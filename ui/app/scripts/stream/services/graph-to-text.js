/*
 * Copyright 2015-2017 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Create the text representation of a graph.
 *
 * @author Andy Clement
 * @author Alex Boyko
 */
define(function () {
	'use strict';
	
    var DEBUG = true;

	var COLON_PREFIX = ':';
    
	/**
	 * Graph representation of stream(s)/app(s).
	 * @type {joint.dia.Graph}
	 */
	var g;
	
	/**
	 * Number of Links left to visit
	 * @type {number}
	 */
	var numberOfLinksToVisit;
	
	/**
	 * Number of nodes left to visit
	 * @type {number}
	 */
	var numberOfNodesToVisit;
	
	/**
	 * Links left to visit indexed by id
	 * @type {Object.<string,{joint.dia.Link}>}
	 */
	var linksToVisit;
	
	/**
	 * Nodes left to visit indexed by id
	 * @type {Object.<string,{joint.dia.Element}>}
	 */
	var nodesToVisit;
	
	/**
	 * Count of how many non-visited links a node has (indexed by node id)
	 * @type {Object.<string,number>}
	 */
	var nodesIncomingLinksCount;

	// A node is an element with a name
	function isNode(element) {
		return element.attr('metadata/name');
	}

	function linkSourceIsNode(link, graph) {
		var linkSource = link.get('source');
		return (linkSource &&
		linkSource.id &&
		graph.getCell(linkSource.id) && isNode(graph.getCell(linkSource.id)));
	}

	function isChannel(e) {
		return e && (e.attr('metadata/name') === 'tap' || e.attr('metadata/name') === 'destination');
	}

	function getName(node) {
		if (!node) {return 'UNDEFINED';}
		if (node.incomingtap) {
			return 'TAPPED(' + getName(node.incomingtap) + ')';
		}
		var name = node.attr('metadata/name');
		if (name === 'destination') {
			return node.attr('props').name;
		}
		else {
			return name;
		}
	}

	function init(graph) {
		numberOfLinksToVisit = 0;
		numberOfNodesToVisit = 0;
		linksToVisit = {};
		nodesToVisit = {};
		nodesIncomingLinksCount = {};
		g = graph;
		g.getElements().forEach(function(element) {
			if (isNode(element)) {
				var nodeId = element.get('id');
				var incomingLinkCount = 0;
				g.getConnectedLinks(element, {inbound: true}).forEach(function(link) {
					if (linkSourceIsNode(link,g)) {
						linksToVisit[link.get('id')] = link;
						numberOfLinksToVisit++;
						incomingLinkCount++;
					}
				});				
				nodesToVisit[nodeId] = element;
				numberOfNodesToVisit++;
				nodesIncomingLinksCount[nodeId] = incomingLinkCount;
			}
		});
	}
    
    function isTapLink(link) {
		return link.attr('props/isTapLink') === 'true';
    }
    
	function printStream(stream) {
		var text = 'Stream: ';
		for (var i=0;i<stream.length;i++) {
			if (i>0) {
				text+=' ';
			}
			text+=getName(stream[i]);
		}
		console.log(text);
	}

	function getIncomingLinks(node) {
		// Only possible if call is occurring during link drawing (one end connected but not the other)
		if (!node) {return [];}
		return g.getConnectedLinks(node, {inbound: true});
	}


	function getNonPrimaryLinks(links) {
		var nonPrimaryLinks = [];
		for (var i = 0; i < links.length; i++) {
			if (isTapLink(links[i])) { 
				nonPrimaryLinks.push(links[i]);
			}
		}
		return nonPrimaryLinks;
	}

	function getNonPrimaryIncomingLinks(node) {
		return getNonPrimaryLinks(getIncomingLinks(node));
	}

	function getPrimaryLink(links) {
		for (var i = 0; i < links.length; i++) {
			if (!isTapLink(links[i])) { 
				return links[i];
			}
		}
		return null;
	}

	function getPrimaryIncomingLink(node) {
		var incomingLinks = getIncomingLinks(node);
		for (var i = 0; i < incomingLinks.length; i++) {
			if (!isTapLink(incomingLinks[i])) { 
				return incomingLinks[i];
			}
		}
		return null;
	}

	function getOutgoingStreamLinks(node) {
		var links = [];
		// !node only possible if call is occurring during link drawing (one end connected but not the other)
		if (node) {
			g.getConnectedLinks(node, {outbound: true}).forEach(function(link) {
				var source = link.get('source');
				if (source.port === 'output') {
					links.push(link);
				}
			});
		}
		return links;
	}

	function findStreamName(node) {
		var streamName = node.attr('stream-name');
		if (streamName) {
			return streamName;
		}
		// Go up the link chain to find the named element
		var incomingLinks = getIncomingLinks(node);
		if (incomingLinks && incomingLinks.length > 0 && !(incomingLinks.length === 1 && incomingLinks[0].get('source').port === 'tap')) {
			if (incomingLinks.length > 1) {
				throw {'msg': 'nodes should only have 1 incoming link at most. Node '+getName(node)+' has '+incomingLinks.length};
			}
			var sourceId = incomingLinks[0].get('source').id;
			var source = g.getCell(sourceId);
			return findStreamName(source);
		}
		return 'UNKNOWN';
	}

	// Create a destination of the form :streamname.name
	// The 'name' element will be the node name unless a label is provided. If a label is
	// provided it will be used instead.
	function toTapDestination(node) {
		var appname = node.attr('node-name');
		if (!appname) {
			appname = node.attr('metadata/name');
		}
		if (appname === 'destination') {
			return COLON_PREFIX + node.attr('props/name');
		} else {
			return COLON_PREFIX+findStreamName(node)+'.'+appname;
		}
	}

	/**
	 * @return true if any node in this stream is tapped
	 */
	function isTapped(headNode) {
		if (isChannel(headNode)) {
			return false;
		}
		var outgoingLinks = getOutgoingStreamLinks(headNode);
		if (outgoingLinks.length > 1) { // multiple outputs, someone is tapping
			return true;
		}
		while (outgoingLinks.length !== 0) {
			var nextId = outgoingLinks[0].get('target').id;
			if (!nextId) { break; } // link is currently being edited
			var nextNode = g.getCell(nextId);
			if (isTapLink(outgoingLinks[0])) {
				return true;
			}
			if (isChannel(nextNode)) {
				break;
			}
			outgoingLinks = getOutgoingStreamLinks(nextNode);
			if (outgoingLinks.length > 1) {
				return true;
			}
		}
		return false;
	}

	/**
	 * For any node, for the head of the stream containing it. This will not follow tap links so the
	 * 'heads' of tap streams will also be found (it won't chase the tap link up and
	 * find the head of the tapped stream). It will also stop at regular destinations and 
	 * consider the destination a head.
	 */
	function findHead(node) {
		console.log('findHead for '+getName(node));
		var currentNode = node;
		var incomingTapLinks = getNonPrimaryIncomingLinks(node);
		if (incomingTapLinks.length > 0) {
			return node;
		}
		var inLink = getPrimaryIncomingLink(currentNode);
		// Only stop at a channel if have followed at least one link
		while (!(isChannel(currentNode) && currentNode !== node) && inLink) {
			var sourceId = inLink.get('source').id;
			if (!sourceId) {
				// the link to this node is currently being edited, it has not yet been connected to something
				inLink = null;
			} else {
				// Don't follow back up if the link is not the primary one from that node
				// to this node
				// var possibleCurrentNode = g.getCell(sourceId);
				// var outLinks = getOutgoingStreamLinks(possibleCurrentNode);
				// var indexOfLinkBeingFollowedInOutputLinks = outLinks.indexOf(inLinks[0]);
				// if (indexOfLinkBeingFollowedInOutputLinks !== 0) {
				// 	// This 'currentNode' is the start of a tap
				// 	break;
				// }
				currentNode = g.getCell(sourceId);
				inLink = getPrimaryIncomingLink(currentNode);
			}
		}
		return currentNode;
	}

	/**
	 * Remove the specified element from the links or nodes to visit as it is about to
	 * be processed.
	 */
	function tidyup(e) {
		if (e.isLink()) {
			delete linksToVisit[e.get('id')];
			nodesIncomingLinksCount[e.get('target').id]--;
			numberOfLinksToVisit--;
		} else {
			delete nodesToVisit[e.get('id')];
			numberOfNodesToVisit--;
		}
		return e;
	}

    
	/**
	 * Build the string DSL representation of a stream based on the link supplied. The
	 * link is expected to be the first one in the stream.
	 */
	function createTextForNode(element, first) {
		var text = '';
		var props = element.attr('props');
		if (!element) {
			return;
		}

		if (first) {
			if (element.attr('stream-name')) {
				text += element.attr('stream-name') + '=';
			}
		}
		if ('tap' === element.attr('metadata/name') || 'destination' === element.attr('metadata/name')) {
			if (props.name) {
				text += COLON_PREFIX+props.name;
			}
		} else {
			if (element.attr('node-name')) {
				text += element.attr('node-name') + ': ';
			}
			text += element.attr('metadata/name');
			if (props) {
				Object.keys(props).forEach(function(propertyName) {
					text += ' --' + propertyName + '=' + props[propertyName];
				});
			}
		}
		tidyup(element);
		return text;
	}

	// Walk the graph and produce DSL
	function processGraph() {
		if (DEBUG) {console.log('> graph-to-text');}
		// 1. Find the obvious stream heads. A stream head is:
		//    - any node without an incoming link
		//    - any node where the incoming link is a tap link
		//    - any node where the incoming link is a non primary link from an app (not destination)
		//    - any destination node that has an incoming and outgoing link(s)
		var i;
		var streamheads=[];
		// var nodesToHead={};
		_.forEach(nodesToVisit, function(node) {
			var head = findHead(node);
			if (!_.contains(streamheads,head)) {
				streamheads.push(head);
			}
		});
		if (DEBUG) {
			console.log('Stream Heads discovered from the graph: ');
			for (i=0;i<streamheads.length;i++) {
				console.log(i+') '+getName(streamheads[i]));
			}
			console.log('---');
		}
		var streams = [];
		var streamId = 1;
		var stream;
		while (streamheads.length>0) {
			var headNode = streamheads.shift();
			if (DEBUG) {
				console.log('Visiting '+getName(headNode));
			}

			if (isTapped(headNode)) {
				// This stream is tapped, it must be named (name generated if necessary)
				var streamName = headNode.attr('stream-name');
				if (!streamName) {
					headNode.attr('stream-name','STREAM_'+streamId);
				}
			}
			var outgoingLinks = getOutgoingStreamLinks(headNode);
			var toFollow;
			var target;			
			var incomingTapLinks = getNonPrimaryIncomingLinks(headNode);
			// If the head is a destination it may have multiple outbound connections, create a stream for each
			if (outgoingLinks.length === 0) {
				if (incomingTapLinks.length === 0) {
					stream = [headNode];
					streamId++;
					streams.push(stream);
				}
				else {
					// Create one variant per incoming tap link 
					for (i=0;i<incomingTapLinks.length;i++) {
						stream = [{'incomingtap':g.getCell(incomingTapLinks[i].get('source').id)}];
						stream.push(headNode);
						streamId++;
						streams.push(stream);
					}
				}
			} else {
				// var incomingTapLinks = getNonPrimaryIncomingLinks(headNode);
				// if (incomingTapLinks.length !== 0) {
				// 	stream = [headNode];
				// 	streamId++;
				// 	streams.push(stream);
				// }
				var targetId;
				var ol;
				if (incomingTapLinks.length > 0) {
				for (i=0;i<incomingTapLinks.length;i++) {
					// Only need to get clever i
					for (ol = 0; ol < outgoingLinks.length; ol++) {
						stream = [{'incomingtap':g.getCell(incomingTapLinks[i].get('source').id)}];
						stream.push(headNode);
						toFollow = getPrimaryLink(outgoingLinks);
						// toFollow.push(outgoingLinks[ol]);
						while (toFollow) {
							targetId = toFollow.get('target').id;
							if (!targetId) {
								// This link is not yet connected to something, it is currently being edited
								toFollow = null;
							} else {
								target = g.getCell(targetId);
								stream.push(target);
								toFollow = getPrimaryLink(getOutgoingStreamLinks(target));
								if (isChannel(target)) {
									// Reached a channel with following outputs, that marks the end of this stream
									toFollow = null;
								}
							}
						}
						streamId++;
						streams.push(stream);
						if (!isChannel(headNode)) {
							// Don't follow more than the primary link, the other links will be taps
							break;
						}
					}
				}
			} else {
				for (ol = 0; ol < outgoingLinks.length; ol++) {
					stream = [headNode];
					toFollow = getPrimaryLink(outgoingLinks);
					// toFollow.push(outgoingLinks[ol]);
					while (toFollow) {
						targetId = toFollow.get('target').id;
						if (!targetId) {
							// This link is not yet connected to something, it is currently being edited
							toFollow = null;
						} else {
							target = g.getCell(targetId);
							stream.push(target);
							toFollow = getPrimaryLink(getOutgoingStreamLinks(target));
							if (isChannel(target)) {
								// Reached a channel with following outputs, that marks the end of this stream
								toFollow = null;
							}
						}
					}
					streamId++;
					streams.push(stream);
					if (!isChannel(headNode)) {
						// Don't follow more than the primary link, the other links will be taps
						break;
					}
				}
			}
				// if (isChannel(headNode) && getIncomingLinks(headNode).length !== 0) {
				// 	// The channel is a stream in its own right
				// 	stream=[headNode];
				// 	streamId++;
				// 	streams.push(stream);
				// }
				// var nonPrimaryLinks = getNonPrimaryLinks(outgoingLinks);
				// for (var tapLink=0; tapLink<nonPrimaryLinks.length;tapLink++) {
				// 	toFollow = nonPrimaryLinks[tapLink]; 
				// 	stream = [];
				// 	while (toFollow) {
				// 		var targetId = toFollow.get('target').id;
				// 		if (!targetId) {
				// 			// This link is not yet connected to something, it is currently being edited
				// 			toFollow = null;
				// 		} else {
				// 			var target = g.getCell(targetId);
				// 			stream.push(target);
				// 			toFollow = getPrimaryLink(getOutgoingStreamLinks(target));
				// 			if (isChannel(target)) {
				// 				// Reached a channel with following outputs, that marks the end of this stream
				// 				toFollow = null;
				// 			}
				// 		}
				// 	}
				// 	streamId++;
				// 	streams.push(stream);
				// 	if (!isChannel(headNode)) {
				// 		// Don't follow more than the primary link, the other links will be taps
				// 		break;
				// 	}
				// }
			}
		}
		if (DEBUG) {
			console.log('computed streams');
			_.forEach(streams,function(stream) {
				printStream(stream);
			});
			console.log('---');
		}
		// 3. Walk the streams (each is an array of nodes that make up the stream) and produce the DSL text
		var text = '';
		var lineNumber = 0;
		var lineStartIndex = 0;
		for (var s = 0; s < streams.length; s++) {
			if (s > 0) {
				text += '\n';
				lineNumber++;
				lineStartIndex = text.length;
			}
			stream = streams[s];
			for (i = 0; i < stream.length; i++) {
				var node = stream[i];
				if (i === 0) {
					var whereToFindName = i;
					if (node.incomingtap) {
						whereToFindName++;
					}
					if (!isChannel(stream[whereToFindName]) && stream[whereToFindName].attr('stream-name')) {
						console.log('Stream has name ' + stream[whereToFindName].attr('stream-name'));
						text += node.attr('stream-name') + '=';
					}
					if (isChannel(stream[whereToFindName])) {
						// stream name can be on next node
						if ((whereToFindName+1)<stream.length) {
							var nameOnNextNode = stream[whereToFindName+1].attr('stream-name');
							if (nameOnNextNode) {
								text += nameOnNextNode + '=';
							}
						}
					}
					if (node.incomingtap) {
					// if ((i+1) >= stream.length) {
						// This is what you use for 'tap heads' - it inserts the ':xxx.yyy >' bit on the front
						// var incomingLinks = getNonPrimaryIncomingLinks(node);//getIncomingLinks(node);
						// // TODO deal with multiple incoming ones!
						// if (incomingLinks.length > 0) {
						// 	var sourceId = incomingLinks[0].get('source').id;
						// 	if (sourceId) {
						// 		var source = g.getCell(sourceId);
						// 		text += toTapDestination(source) + ' > ';
						// 	}
						// }
						text+=toTapDestination(node.incomingtap) + ' > ';
						continue;
					}
					// }
				}
				var nodeText = createTextForNode(node);

				// Set text range for the graph node
				var startCh = text.length - lineStartIndex;
				var endCh = startCh + nodeText.length;
				node.attr('range', {
					start: {ch: startCh, line: lineNumber},
					end: {ch: endCh, line: lineNumber}
				});

				// Append textual representation of the node
				text += nodeText;

				// Are there more nodes?
				if ((i + 1) < stream.length) {
					if (isChannel(node) || isChannel(stream[i + 1])) {
						text += ' > ';
					} else {
						text += ' | ';
					}
				}
			}
		}
		return text;
	}

	/**
	 * Translates the graph into text form.
	 * @param {joint.dia.Graph} g Graph form of stream(s) and or app(s)
	 * @return {string} Textual form
	 */
	return function(g) {
		init(g);		
        return processGraph();
	};
});

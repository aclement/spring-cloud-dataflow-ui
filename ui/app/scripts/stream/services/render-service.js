/*
 * Copyright 2016-2017 the original author or authors.
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
 * Render Service for Flo based Stream Definition graph editor
 *
 * @author Alex Boyko
 * @author Andy Clement
 */
define(function(require) {
    'use strict';

    var joint = require('joint');
    require('flo');

    var dagre = require('dagre');

    // Dagre layout now being used instead
    // var layout = require('stream/services/layout');
    var utils = require('stream/services/utils');

    var HANDLE_ICON_MAP = {
        'remove': 'images/icons/delete.svg',
        'properties': 'images/icons/cog.svg'
    };

    var HANDLE_ICON_SIZE = {
        'remove': {width: 10, height: 10},
        'properties': {width: 11, height: 11}
    };

    var DECORATION_ICON_MAP = {
        'error': 'images/icons/error.svg'
    };

    var IMAGE_W = 120,
        IMAGE_H = 40;

    var HORIZONTAL_PADDING = 5;

    joint.shapes.flo.DataFlowApp = joint.shapes.basic.Generic.extend({

        markup:
        '<g class="stream-module">' +
            '<g class="shape">'+
                '<rect class="box"/>'+
                '<text class="label1"/>'+
                '<text class="label2"/>'+
            '</g>' +
            '<text class="stream-label"/>'+
            '<rect class="input-port" />'+
            '<rect class="output-port"/>'+
        '</g>',

        defaults: joint.util.deepSupplement({

            type: joint.shapes.flo.NODE_TYPE,
            position: {x: 0, y: 0},
            size: { width: IMAGE_W, height: IMAGE_H },
            attrs: {
                '.': {
                    magnet: false,
                },
                '.box': {
                    width: IMAGE_W,
                    height: IMAGE_H,
                    rx: 2,
                    ry: 2,
                    //'fill-opacity':0, // see through
                    stroke: '#6db33f',
                    fill: '#eeeeee',
                    'stroke-width': 2,
                },
                '.input-port': {
                    type: 'input',
                    port: 'input',
                    height: 8, width: 8,
                    magnet: true,
                    fill: '#eeeeee',
                    transform: 'translate(' + -4 + ',' + ((IMAGE_H/2)-4) + ')',
                    stroke: '#34302d',
                    'stroke-width': 1,
                },
                '.output-port': {
                    type: 'output',
                    port: 'output',
                    height: 8, width: 8,
                    magnet: true,
                    fill: '#eeeeee',
                    transform: 'translate(' + (IMAGE_W-4) + ',' + ((IMAGE_H/2)-4) + ')',
                    stroke: '#34302d',
                    'stroke-width': 1,
                },
                '.label1': {
                    'ref-x': 0.5, // jointjs specific: relative position to ref'd element
                    'ref-y': 0.525,
                    'y-alignment': 'middle',
                    'x-alignment' : 'middle',
                    ref: '.box', // jointjs specific: element for ref-x, ref-y
                    fill: 'black',
                    'font-size': 14
                },
                '.label2': {
                    'y-alignment': 'middle',
                    'ref-x': HORIZONTAL_PADDING+2, // jointjs specific: relative position to ref'd element
                    'ref-y': 0.55, // jointjs specific: relative position to ref'd element
                    ref: '.box', // jointjs specific: element for ref-x, ref-y
                    fill: 'black',
                    'font-size': 20
                },
                '.stream-label': {
                    'x-alignment': 'middle',
                    'y-alignment': -0.999999,
                    'ref-x': 0.5, // jointjs specific: relative position to ref'd element
                    'ref-y': 0, // jointjs specific: relative position to ref'd element
                    ref: '.box', // jointjs specific: element for ref-x, ref-y
                    fill: '#AAAAAA',
                    'font-size': 15
                },
                '.shape': {
                }
            }
        }, joint.shapes.basic.Generic.prototype.defaults)
    });

    joint.shapes.flo.Destination = joint.shapes.basic.Generic.extend({
        
                markup:
                '<g class="destination">' +
                    '<g class="shape">'+
                        '<path d="m6,10 a12,12 0 0,0 0,20 l108,0 a12,12 0 0,0 0,-20 l0,0 z" class="box"/>'+
                        // '<rect transform="translate(100, -11)" class="box"/>'+
                        '<text class="label1"/>'+
                        '<text class="label2"/>'+
                    '</g>' +
                    '<text class="stream-label"/>'+
                    '<circle class="input-port" />'+
                    '<circle class="output-port"/>'+
                '</g>',
        
                defaults: joint.util.deepSupplement({
        
                    type: joint.shapes.flo.NODE_TYPE,
                    position: {x: 0, y: 0},
                    size: { width: IMAGE_W, height: IMAGE_H },
                    attrs: {
                        '.': {
                            magnet: false,
                        },
                        '.box': {
                            width: IMAGE_W,
                            height: IMAGE_H/2,
                            rx: 2,
                            ry: 2,
                            //'fill-opacity':0, // see through
                            stroke: '#6db33f',
                            fill: '#eeeeee',
                            'stroke-width': 2,
                        },
                        '.input-port': {
                            type: 'input',
                            port: 'input',
                            r: 4, //height: 8, width: 8,
                            magnet: true,
                            fill: '#eeeeee',
                            // transform: 'translate(' + -4 + ',' + ((IMAGE_H/2)-4) + ')',
                            transform: 'translate(1,' + ((IMAGE_H/2)) + ')',
                            stroke: '#34302d',
                            'stroke-width': 1,
                        },
                        '.output-port': {
                            type: 'output',
                            port: 'output',
                            r: 4, //height: 8, width: 8,
                            magnet: true,
                            fill: '#eeeeee',
                            transform: 'translate(' + (IMAGE_W-1) + ',' + ((IMAGE_H/2)) + ')',
                            stroke: '#34302d',
                            'stroke-width': 1,
                        },
                        '.label1': {
                            'ref-x': 0.5, // jointjs specific: relative position to ref'd element
                            'ref-y': 0.525,
                            'y-alignment': 'middle',
                            'x-alignment' : 'middle',
                            ref: '.box', // jointjs specific: element for ref-x, ref-y
                            fill: 'black',
                            'font-size': 14
                        },
                        '.label2': {
                            'y-alignment': 'middle',
                            'ref-x': HORIZONTAL_PADDING+2, // jointjs specific: relative position to ref'd element
                            'ref-y': 0.55, // jointjs specific: relative position to ref'd element
                            ref: '.box', // jointjs specific: element for ref-x, ref-y
                            fill: 'black',
                            'font-size': 20
                        },
                        '.stream-label': {
                            'x-alignment': 'middle',
                            'y-alignment': -0.999999,
                            'ref-x': 0.5, // jointjs specific: relative position to ref'd element
                            'ref-y': 0, // jointjs specific: relative position to ref'd element
                            ref: '.box', // jointjs specific: element for ref-x, ref-y
                            fill: '#AAAAAA',
                            'font-size': 15
                        },
                        '.shape': {
                        }
                    }
                }, joint.shapes.basic.Generic.prototype.defaults)
            });

    joint.shapes.flo.LinkDataflow = joint.dia.Link.extend({

        toolMarkup: [
            '<g class="link-tool create-stream">',
            '<rect class="link-tools-container" width="22" height="47" transform="translate(-11 -11)"/>',
            '<g class="tool-remove" event="remove">',
            '<circle r="11" transform="scale(.7)"/>',
            '<path transform="scale(.6) translate(-16, -16)" d="M24.778,21.419 19.276,15.917 24.777,10.415 21.949,7.585 16.447,13.087 10.945,7.585 8.117,10.415 13.618,15.917 8.116,21.419 10.946,24.248 16.447,18.746 21.948,24.248z"/>',
            '<title>Remove link.</title>',
            '</g>',
            '<g class="tool-insert-channel" event="insert-channel">',
            '<circle r="11" transform="scale(0.7) translate(-12,-18)" style="stroke:rgb(0,0,0);fill:#ffffff;"/>',
            '<path stroke-linecap="round" transform="scale(0.7) translate(-12,-18)" d="M0,-8 L0,0 M-4,-4 L0,0 M4,-4 L0,0" style="stroke:rgb(0,0,0);stroke-width:2"/>',
            '<rect width="8" height="4" transform="translate(-12,-12)" style="stroke:rgb(0,0,0);fill:#ffffff;stroke-width:1"/>',
            '<title>Insert destination</title>',
            '</g>',
            '<g class="tool-switch" event="switch">',
            '<circle r="11" transform="scale(0.7) translate(12, -18)" style="stroke:rgb(0,0,0);fill:#ffffff;"/>',
            '<line stroke-linecap="round" transform="scale(0.7) translate(5, -22)" x1="4" y1="11" x2="15" y2="0" style="stroke:rgb(0,0,0);stroke-width:2" stroke-dasharray="3, 4"/>',
            '<path stroke-linecap="round" transform="scale(0.7) translate(3,-26)" d="M0,8 L8,8 M4,12 L8,8 M4,4 L8,8" style="stroke:rgb(0,0,0);stroke-width:2"/>',
//            '<line transform="scale(.7) translate(-16, -32)" x1="0" y1="8" x2="12" y2="8" style="stroke:rgb(0,0,0)" stroke-dasharray="3, 3"/>',
//            '<path fill="white" transform="scale(.7) translate(20, -16)" d="M31.229,17.736c0.064-0.571,0.104-1.148,0.104-1.736s-0.04-1.166-0.104-1.737l-4.377-1.557c-0.218-0.716-0.504-1.401-0.851-2.05l1.993-4.192c-0.725-0.91-1.549-1.734-2.458-2.459l-4.193,1.994c-0.647-0.347-1.334-0.632-2.049-0.849l-1.558-4.378C17.165,0.708,16.588,0.667,16,0.667s-1.166,0.041-1.737,0.105L12.707,5.15c-0.716,0.217-1.401,0.502-2.05,0.849L6.464,4.005C5.554,4.73,4.73,5.554,4.005,6.464l1.994,4.192c-0.347,0.648-0.632,1.334-0.849,2.05l-4.378,1.557C0.708,14.834,0.667,15.412,0.667,16s0.041,1.165,0.105,1.736l4.378,1.558c0.217,0.715,0.502,1.401,0.849,2.049l-1.994,4.193c0.725,0.909,1.549,1.733,2.459,2.458l4.192-1.993c0.648,0.347,1.334,0.633,2.05,0.851l1.557,4.377c0.571,0.064,1.148,0.104,1.737,0.104c0.588,0,1.165-0.04,1.736-0.104l1.558-4.377c0.715-0.218,1.399-0.504,2.049-0.851l4.193,1.993c0.909-0.725,1.733-1.549,2.458-2.458l-1.993-4.193c0.347-0.647,0.633-1.334,0.851-2.049L31.229,17.736zM16,20.871c-2.69,0-4.872-2.182-4.872-4.871c0-2.69,2.182-4.872,4.872-4.872c2.689,0,4.871,2.182,4.871,4.872C20.871,18.689,18.689,20.871,16,20.871z"/>',
            '<title>Switch to/from tap</title>',
            '</g>',
            '</g>'
        ].join(''),

        defaults: joint.util.deepSupplement({
            type: joint.shapes.flo.LINK_TYPE,
            options: {
                linkToolsOffset: 1000,
            },
            smooth: true,
//             router: { name: 'metro' },
            attrs: {
                '.connection': { stroke: '#34302d', 'stroke-width': 2 },
                '.connection-wrap': { display : 'none' },
                '.marker-arrowheads': { display: 'none' },
                '.tool-options': { display: 'none' }
            },
        }, joint.dia.Link.prototype.defaults)
    });


    return ['$compile', '$rootScope', '$log', 'StreamMetamodelService', 'FloBootstrapTooltip', 'DataflowUtils', 'MetamodelUtils', function($compile, $rootScope, $log, metamodelService, bootstrapTooltip, dataflowUtils, metamodelUtils) {

        function fitLabel(paper, node, labelPath) {
            var label = node.attr(labelPath);
            if (label && label.length<9) {
                return;
            }
            var view = paper.findViewByModel(node);
            if (view && label) {
                var textView = view.findBySelector(labelPath.substr(0, labelPath.indexOf('/')))[0];
                var offset = 0;
                if (node.attr('.label2/text')) {
                    var label2View = view.findBySelector('.label2')[0];
                    if (label2View) {
                        var box = joint.V(label2View).bbox(false, paper.viewport);
                        offset = HORIZONTAL_PADDING + box.width;
                    }
                }
                var width = joint.V(textView).bbox(false, paper.viewport).width;
                var threshold = IMAGE_W - HORIZONTAL_PADDING - HORIZONTAL_PADDING - offset;
                if (offset) {
                    node.attr('.label1/ref-x', Math.max((offset + HORIZONTAL_PADDING + width / 2) / IMAGE_W, 0.5), { silent: true });
                }
                for (var i = 1; i < label.length && width > threshold; i++) {
                    node.attr(labelPath, label.substr(0, label.length - i) + '\u2026', { silent: true });
                    view.update();
                    width = joint.V(textView).bbox(false, paper.viewport).width;
                    if (offset) {
                        node.attr('.label1/ref-x', Math.max((offset + HORIZONTAL_PADDING + width / 2) / IMAGE_W, 0.5), { silent: true });
                    }
                }
                view.update();
            }
        }

        function createHandle(kind) {
            return new joint.shapes.flo.ErrorDecoration({
                size: HANDLE_ICON_SIZE[kind],
                attrs: {
                    'image': {
                        'xlink:href': HANDLE_ICON_MAP[kind]
                    }
                }
            });
        }

        function createDecoration(kind) {
            return new joint.shapes.flo.ErrorDecoration({
                size: {width: 16, height: 16},
                attrs: {
                    'image': {
                        'xlink:href': DECORATION_ICON_MAP[kind]
                    }
                }
            });
        }

        function createNode(metadata) {
            if (metadata.group === 'source') {
                return new joint.shapes.flo.DataFlowApp(
                    joint.util.deepSupplement({
                        attrs: {
                            '.box': {
                                'fill': '#eef4ee'
                            },
                            '.input-port': {
                                display: 'none'
                            },
                            '.label1': {
                                'text': metadata.name
                            },
                            '.label2': {
                                'text': metadata.metadata.unicodeChar
                            }
                        }
                    }, joint.shapes.flo.DataFlowApp.prototype.defaults)
                );
            } else if (metadata.group === 'processor') {
                return new joint.shapes.flo.DataFlowApp(
                    joint.util.deepSupplement({
                        attrs: {
                            '.box': {
                                'fill': '#eef4ee'
                            },
                            '.label1': {
                                'text': metadata.name
                            },
                            '.label2': {
                                'text': metadata.metadata.unicodeChar
                            },
                            '.stream-label': {
                                display: 'none'
                            }
                        }
                    }, joint.shapes.flo.DataFlowApp.prototype.defaults)
                );
            } else if (metadata.group === 'sink') {
                return new joint.shapes.flo.DataFlowApp(
                    joint.util.deepSupplement({
                        attrs: {
                            '.box': {
                                'fill': '#eef4ee'
                            },
                            '.output-port': {
                                display: 'none'
                            },
                            '.label1': {
                                'text': metadata.name
                            },
                            '.label2': {
                                'text': metadata.metadata.unicodeChar
                            },
                            '.stream-label': {
                                display: 'none'
                            }
                        }
                    }, joint.shapes.flo.DataFlowApp.prototype.defaults)
                );
            } else if (metadata.group === 'task') {
                return new joint.shapes.flo.DataFlowApp(
                    joint.util.deepSupplement({
                        attrs: {
                            '.box': {
                                'fill': '#eef4ee'
                            },
                            '.output-port': {
                                display: 'none'
                            },
                            '.label1': {
                                'text': metadata.name
                            },
                            '.label2': {
                                'text': metadata.metadata.unicodeChar
                            },
                            '.stream-label': {
                                display: 'none'
                            }
                        }
                    }, joint.shapes.flo.DataFlowApp.prototype.defaults)
                );
            } else if (metadata.name === 'tap') {
                return new joint.shapes.flo.DataFlowApp(
                    joint.util.deepSupplement({
                        attrs: {
                            '.box': {
                                'fill': '#eeeeff',
                                'stroke': '#0000ff'
                            },
                            '.input-port': {
                                display: 'none'
                            },
                            '.label1': {
                                'text': metadata.name
                            },
                            '.label2': {
                                'text': metadata.metadata.unicodeChar
                            }
                        }
                    }, joint.shapes.flo.DataFlowApp.prototype.defaults)
                );
            } else if (metadata.name === 'destination') {
                return new joint.shapes.flo.Destination(
                    joint.util.deepSupplement({
                        attrs: {
                            '.box': {
                                'fill': '#eeeeff',
                                'stroke': '#0000ff'
                            },
                            '.label1': {
                                'text': metadata.name
                            },
                            '.label2': {
                                'text': metadata.metadata.unicodeChar
                            }
                        }
                    }, joint.shapes.flo.Destination.prototype.defaults)
                );
            } else {
                return new joint.shapes.flo.DataFlowApp();
            }
        }

        function initializeNewLink(link/*, paperAndGraph*/) {
            link.set('smooth', true);
            link.attr('metadata/metadata/unselectable','true');
            // var isTapLink = link.attr('props/isTapLink');
            // if (isTapLink === 'true') {
            //     var linkView = paperAndGraph.paper.findViewByModel(link);
            //     _.each(linkView.el.querySelectorAll('.connection, .marker-source, .marker-target'), function(connection) {
            //         joint.V(connection).addClass('tapped-output-from-app');
            //     });
            // }
            // TODO remove this on link delete !!
            // paperAndGraph.paper.findViewByModel(link).on('switch',function() {
            //     handleLinkEvent(paperAndGraph.paper, 'switch', link);
            // });
        }

        function isSemanticProperty(propertyPath) {
            return propertyPath === 'node-name' || propertyPath === 'stream-name';
        }

        function refreshVisuals(element, changedPropertyPath, paper) {
            var metadata = element.attr('metadata');
            var type = metadata ? metadata.name : undefined;
            if (changedPropertyPath === 'stream-name') {
                element.attr('.stream-label/text', element.attr('stream-name'));
                element.attr('.stream-label/display', utils.canBeHeadOfStream(paper.model, element) ? 'block' : 'none');
            } else if ((type === 'destination' || type === 'tap') && changedPropertyPath === 'props/name') {
                // fitLabel() calls update as necessary, so set label text silently
                element.attr('.label1/text', element.attr('props/name') ? element.attr('props/name') : element.attr('metadata/name'));
                fitLabel(paper, element, '.label1/text');
            } else if (changedPropertyPath === 'props/language') {
                /*
                 * Check if 'language' property has changed and 'script' property is present
                 */
                metadata.get('properties').then(function(properties) {
                    if (properties.script && properties.script.source) {
                        properties.script.source.type = element.attr('props/language');
                        properties.script.source.mime = element.attr('props/language') === 'javascript' ? 'text/javascript' : 'text/x-' + element.attr('props/language');
                    }
                });
            } else if (changedPropertyPath === 'node-name') {
                var nodeName =  element.attr('node-name');
                // fitLabel() calls update as necessary, so set label text silently
                element.attr('.label1/text', nodeName ? nodeName : element.attr('metadata/name'));
                fitLabel(paper, element, '.label1/text');
            }

            if (element instanceof joint.dia.Link) {
                if (changedPropertyPath === 'props/isTapLink') {
                    var isTapLink = element.attr('props/isTapLink');
                    var linkView = paper.findViewByModel(element);
                    console.log('Adjusting link class isTapLink?'+isTapLink);
                    if (isTapLink === 'true') {
                        _.each(linkView.el.querySelectorAll('.connection, .marker-source, .marker-target'), function(connection) {
                            joint.V(connection).addClass('tapped-output-from-app');
                        });
                    } else {
                        _.each(linkView.el.querySelectorAll('.connection, .marker-source, .marker-target'), function(connection) {
                            joint.V(connection).removeClass('tapped-output-from-app');
                        });
                    }
                }
                console.log('link being refreshed');
            }
        }

        function initializeNewNode(view) {
            var node = view.model;
            var metadata = node.attr('metadata');
            if (metadata) {
                var paper = view.paper;
                var isPalette = paper.model.get('type') === joint.shapes.flo.PALETTE_TYPE;
                var isCanvas = paper.model.get('type') === joint.shapes.flo.CANVAS_TYPE;
                if (metadata.name === 'tap') {
                    refreshVisuals(node, 'props/name', paper);
                } else if (metadata.name === 'destination') {
                    refreshVisuals(node, 'props/name', paper);
                } else {
                    refreshVisuals(node, 'node-name', paper);
                }

                if (isCanvas) {
                    refreshVisuals(node, 'stream-name', paper);
                }

                // Attach angular style tooltip to a app view
                if (view) {
                    if (isCanvas) {

                        // IMPORTANT: Need to go before the element to avoid extra compile cycle!!!!
                        // Attach tooltips to ports. No need to compile against scope because parent element is being compiled
                        // and no specific scope is attached to port tooltips
                        view.$('[magnet]').each(function(index, magnet) {
                            var port = magnet.getAttribute('port');
                            if (port === 'input') {
                                bootstrapTooltip.attachBootstrapTextTooltip(magnet, null, 'Input Port', 'top', 500);
                            } else if (port === 'output') {
                                bootstrapTooltip.attachBootstrapTextTooltip(magnet, null, 'Output Port', 'top', 500);
                            } else if (port === 'tap') {
                                bootstrapTooltip.attachBootstrapTextTooltip(magnet, null, 'Tap Port', 'top', 500);
                            }
                        });

                        bootstrapTooltip.attachCanvasNodeTooltip(view, '.shape', metamodelService);
                    } else if (isPalette) {
                        bootstrapTooltip.attachPaletteNodeTooltip(view);
                    }
                }
            }
        }

        /**
         * Sets some initialization data on the decoration Joint JS view object
         *
         * @param view Joint JS view object for decoration
         */
        function initializeNewDecoration(view) {
            // Attach angular-bootstrap-ui tooltip to error marker
            if (view.paper.model.get('type') === joint.shapes.flo.CANVAS_TYPE && view.model.attr('./kind') === 'error') {
                bootstrapTooltip.attachErrorMarkerTooltip(view);
            }
        }

        /**
         * Sets some initialization data on the handle Joint JS view object
         *
         * @param view Joint JS view object for handle
         */
        function initializeNewHandle(view) {
            // Attach angular-bootstrap-ui tooltip to handles
            if (view.paper.model.get('type') === joint.shapes.flo.CANVAS_TYPE) {
                bootstrapTooltip.attachHandleTooltip(view);
            }
        }

        function createLink() {
            return new joint.shapes.flo.LinkDataflow();
        }

        function getLinkView() {
            return joint.dia.LinkView.extend({
                options: joint.util.deepSupplement({
                    linkToolsOffset: 50,
                    shortLinkLength: 0, // prevents scaling of the tools
                    longLinkLength: 500
                }, joint.dia.LinkView.prototype.options),

                _beforeArrowheadMove: function() {
                    if (this.model.get('source').id) {
                        this._oldSource = this.model.get('source');
                    }
                    if (this.model.get('target').id) {
                        this._oldTarget = this.model.get('target');
                    }
                    joint.dia.LinkView.prototype._beforeArrowheadMove.apply(this, arguments);
                },

                _afterArrowheadMove: function() {
                    joint.dia.LinkView.prototype._afterArrowheadMove.apply(this, arguments);
                    if (!this.model.get('source').id) {
                        if (this._oldSource) {
                            this.model.set('source', this._oldSource);
                        } else {
                            this.model.remove();
                        }
                    }
                    if (!this.model.get('target').id) {
                        if (this._oldTarget) {
                            this.model.set('target', this._oldTarget);
                        } else {
                            this.model.remove();
                        }
                    }
                    delete this._oldSource;
                    delete this._oldTarget;
                }

            });
        }

        function layoutWithDagre(paper) {
            var start, end, empty = true;
            var deferred = dataflowUtils.$q.defer();
            var graph = paper.model;

            var gridSize = paper.options.gridSize;
            if (gridSize <= 1) {
                gridSize = IMAGE_H / 2;
            }

            var g = new dagre.graphlib.Graph();
            g.setGraph({});
            g.setDefaultEdgeLabel(function () {
                return {};
            });

            graph.getElements().forEach(function (node) {
                // ignore embedded cells
                if (!node.get('parent')) {
                    g.setNode(node.id, node.get('size'));

                    // Determine start and end node
                    if (node.attr('metadata/name') === joint.shapes.flo.batch.START_NODE_TYPE && node.attr('metadata/group') === joint.shapes.flo.batch.CONTROL_NODES) {
                        start = node;
                    } else if (node.attr('metadata/name') === joint.shapes.flo.batch.END_NODE_TYPE && node.attr('metadata/group') === joint.shapes.flo.batch.CONTROL_NODES) {
                        end = node;
                    } else {
                        empty = false;
                    }
                }
            });

            var count = 0;
            graph.getLinks().forEach(function (link) {
                if (link.get('source').id && link.get('target').id) {
                    g.setEdge(link.get('source').id, link.get('target').id,
                    {weight: (link.get('source').port==='output'?200:1)});
                    link.set('vertices', []);
                    count++;
                }
            });

            g.graph().rankdir = 'LR';
            g.graph().marginx = gridSize;
            g.graph().marginy = gridSize;
            g.graph().nodesep = 2 * gridSize;
            g.graph().ranksep = 2 * gridSize;
            g.graph().edgesep = gridSize;

            if (empty && start && end) {
                // Only start and end node are present
                // In this case ensure that start is located above the end. Fake a link between start and end nodes
                g.setEdge(start.get('id'), end.get('id'), {
                    minlen: 7
                });

                g.graph().marginx = 5 * gridSize;
            }

            dagre.layout(g);
            g.nodes().forEach(function (v) {
                var node = graph.getCell(v);
                if (node) {
                    var bbox = node.getBBox();
                    node.translate((g.node(v).x - g.node(v).width / 2) - bbox.x, (g.node(v).y - g.node(v).height / 2) - bbox.y);
                }
            });

            g.edges().forEach(function (o) {
                var edge = g.edge(o);
                console.log(JSON.stringify(edge.points));
            });
            deferred.resolve();

            return deferred.promise;

        }

        function getNodeView() {
            return joint.dia.ElementView.extend({
                options: joint.util.deepSupplement({
                }, joint.dia.ElementView.prototype.options),

                render: function() {
                    joint.dia.ElementView.prototype.render.apply(this, arguments);
                    var type = this.model.get('type');
                    if (type === joint.shapes.flo.NODE_TYPE) {
                        initializeNewNode(this);
                    } else if (type === joint.shapes.flo.DECORATION_TYPE) {
                        initializeNewDecoration(this);
                    } else if (type === joint.shapes.flo.HANDLE_TYPE) {
                        initializeNewHandle(this);
                    }
                }

            });
        }

        function handleLinkSourceChanged(link, paper) {
            var graph = paper.model;
            var newSourceId = link.get('source').id;
            var oldSourceId = link.previous('source').id;
            var targetId = link.get('target').id;
            if (newSourceId !== oldSourceId) {
                var newSource = graph.getCell(newSourceId);
                var oldSource = graph.getCell(oldSourceId);
                var target = graph.getCell(targetId);
                // Show input port for 'destination' if outgoing links are gone
                if (oldSource && oldSource.attr('metadata/name') === 'destination' /*&& graph.getConnectedLinks(oldSource, {outbound: true}).length === 0*/) {
                    // No outgoing links -> hide stream name label
                    // Set silently, last attr call would refresh the view
                    oldSource.attr('.stream-label/display', 'none', { silent: true });

                //     // Can't remove attr and update the view because port marking is being wiped out, so set 'block' display
                //     oldSource.attr('.input-port/display', 'block');
                }
                // // Hide input port for destination if it has a new outgoing link
                if (newSource && newSource.attr('metadata/name') === 'destination') {
                    // Has outgoing link, there shouldn't be any incoming links yet -> show stream name label
                    // Set silently, last attr call would refresh the view
                    newSource.attr('.stream-label/display', 'block', { silent: true });

                //     newSource.attr('.input-port/display', 'none');
                }

                // If tap link has been reconnected update the stream-label for the target if necessary
                if (target) {
                    if (link.previous('source').port === 'tap') {
                        target.attr('.stream-label/display', 'none');
                    }
                    if (link.get('source').port === 'tap') {
                        target.attr('.stream-label/display', 'block');
                    }
                }
            }
        }

        function handleLinkTargetChanged(link, paper) {
            var graph = paper.model;
            var newTargetId = link.get('target').id;
            var oldTargetId = link.previous('target').id;
            if (newTargetId !== oldTargetId) {
                var oldTarget = graph.getCell(oldTargetId);
                if (oldTarget) {
                    if (oldTarget.attr('metadata/name') === 'destination') {
                        // old target is a destination. Ensure output port is showing now since incoming links are gone

                        // No more incoming links, there shouldn't be any outgoing links yet -> indeterminate, hide stream label
                        // Set silently, last attr call would refresh the view
                        oldTarget.attr('.stream-label/display', 'none', { silent: true });

                    //     // Can't remove attr and update the view because port marking is being wiped out, so set 'block' display
                    //     oldTarget.attr('.output-port/display', 'block');
                    }
                }
                var newTarget = graph.getCell(newTargetId);
                if (newTarget) {
                    if (newTarget.attr('metadata/name') === 'destination') {
                        // Incoming link -> hide stream name label
                        // Set silently, last attr call would refresh the view
                        newTarget.attr('.stream-label/display', 'none', { silent: true });

                        // // new target is destination? Hide output port then.
                        // newTarget.attr('.output-port/display', 'none');
                    }
                }

                // If tap link has been reconnected update the stream-label for the new target and old target
                if (link.get('source').port === 'tap') {
                    if (oldTarget) {
                        oldTarget.attr('.stream-label/display', 'none');
                    }
                    if (newTarget) {
                        newTarget.attr('.stream-label/display', 'block');
                    }
                }

            }
        }

        function handleLinkRemoved(link, paper) {
            var graph = paper.model;
            var source = graph.getCell(link.get('source').id);
            var target = graph.getCell(link.get('target').id);
            var view;
            if (source && source.attr('metadata/name') === 'destination' && graph.getConnectedLinks(source, {outbound: true}).length === 0) {
                // No more outgoing links, can't be any incoming links yet -> indeterminate, hide stream name label
                // Set silently, last attr call would refresh the view
                source.attr('.stream-label/display', 'none', { silent: true });
                source.removeAttr('.input-port/display');
                view = paper.findViewByModel(source);
                if (view) {
                    view.update();
                }
            }
            if (target && target.attr('metadata/name') === 'destination' && graph.getConnectedLinks(target, {inbound: true}).length === 0) {
                // No more incoming links, there shouldn't be any outgoing links yet -> leave stream label hidden
                // Set silently, last attr call would refresh the view
                target.attr('.stream-label/display', 'none', { silent: true });
                target.removeAttr('.output-port/display');
                view = paper.findViewByModel(target);
                if (view) {
                    view.update();
                }
            }
            // If tap link is removed update stream-name value for the target, i.e. don't display stream anymore
            if (link.get('source').port === 'tap' && target) {
                target.attr('.stream-label/display', 'none');
            }
        }

        function toLinkString(graph, link) {
            var text = '';
            var source = graph.getCell(link.get('source').id);
            var target = graph.getCell(link.get('target').id);
            text+= source?source.attr('metadata/name'):'?';
            text+=' -> ';
            text+= target?target.attr('metadata/name'):'?';
            return text;
        }

        function handleLinkInsertChannel(link, paper) {
            var graph = paper.model;
            var source = graph.getCell(link.get('source').id);
            var target = graph.getCell(link.get('target').id);
            // Create a node
            metamodelService.load().then(function (mm) {
                var metadata = metamodelUtils.getMetadata(mm,'destination','other');
                var newDestinationNode = new joint.shapes.flo.Destination(
                    joint.util.deepSupplement({
                        attrs: {
                            '.box': {
                                'fill': '#eeeeff',
                                'stroke': '#0000ff'
                            },
                            '.label1': {
                                'text': metadata.name
                            },
                            '.label2': {
                                'text': metadata.metadata.unicodeChar
                            }
                        }
                    }, joint.shapes.flo.Destination.prototype.defaults)
                );

                var sourceName = source.attr('metadata/name');
                if (sourceName === 'destination') {
                    sourceName = source.attr('props/name');
                }
                var targetName = target.attr('metadata/name');
                if (targetName === 'destination') {
                    targetName = target.attr('props/name');
                }

                newDestinationNode.set('type',joint.shapes.flo.NODE_TYPE);
                newDestinationNode.attr('props',{'name':sourceName+'-'+targetName});
                newDestinationNode.attr('metadata',metadata);
                graph.addCell(newDestinationNode);
                var nodeView = paper.findViewByModel(newDestinationNode);
                initializeNewNode(nodeView,{'paper':paper,'graph':graph});

                // Adjust existing link to hit this channel
                var previousSource = link.get('source');
                var existingIsTap = (link.attr('props/isTapLink') === 'true');
                link.set('source',{'id':newDestinationNode.id,'port':'output','selector':'.output-port'});

                // New link to connect original source to new target
                var newlink = createLink();
                newlink.set('target',{'id':newDestinationNode.id,'port':'input','selector':'.input-port'});
                newlink.set('source',previousSource);
                newlink.set('type',joint.shapes.flo.LINK_TYPE);
                newlink.attr('metadata',{});
                graph.addCell(newlink);
                newlink.attr('.marker-vertices/display', 'none');
                newlink.attr('props/isTapLink',existingIsTap?'true':'false');
                initializeNewLink(newlink,{'paper':paper,'graph':graph});
                layoutWithDagre(paper);
            });
        }

        function handleLinkSwitch(link, paper) {
            var graph = paper.model;
            var source = graph.getCell(link.get('source').id);
            // var target = graph.getCell(link.get('target').id);
            var isTapLink = (link.attr('props/isTapLink') === 'true');
            if (isTapLink) {
                console.log('Converting link '+toLinkString(graph, link)+' into a primary link');
                link.attr('props/isTapLink','false');
                // Need to ensure no other links are still primary, that isn't allowed
                var outputLinks = graph.getConnectedLinks(source, {outbound: true});
                for (var i = 0; i<outputLinks.length; i++) {
                    var olink = outputLinks[i];
                    if (olink === link || (olink.attr('props/isTapLink') === 'true')) {
                        continue;
                    }
                    // it is a primary link!
                    olink.attr('props/isTapLink','true');
                    refreshVisuals(olink,'props/isTapLink',paper);
                    break;
                }
            }
            else {
                console.log('Converting link '+toLinkString(graph, link)+' into a tap link');
                link.attr('props/isTapLink','true');
            }
            refreshVisuals(link, 'props/isTapLink', paper);
            // if (source) {
            //     var outputLinks = graph.getConnectedLinks(source, {outbound: true});
            //     var isPrimaryLink = true;
            //     for (var i=0;i<outputLinks.length;i++) {
            //         var ol = outputLinks[i];
            //         if (ol === link || (ol.attr('props/isTapLink')==='true')) {
            //             continue;
            //         }
            //         isPrimaryLink = false;
            //         break;
            //     }
            //     console.log("marking primary? "+isPrimaryLink);
            //     link.attr('props/isTapLink',isPrimaryLink?'false':'true');
            //     refreshVisuals(link, 'props/isTapLink', paper);
            // }
        }

        function handleLinkAdded(link, paper) {
            var graph = paper.model;
            var source = graph.getCell(link.get('source').id);
            var target = graph.getCell(link.get('target').id);
            console.log('render-service.handleLinkAdded');
            if (source) {
                var outputLinks = graph.getConnectedLinks(source, {outbound: true});
                var isPrimaryLink = true;
                for (var i=0;i<outputLinks.length;i++) {
                    var ol = outputLinks[i];
                    if (ol === link || (ol.attr('props/isTapLink')==='true')) {
                        continue;
                    }
                    isPrimaryLink = false;
                    break;
                }
                link.attr('props/isTapLink',isPrimaryLink?'false':'true');
                refreshVisuals(link, 'props/isTapLink', paper);
            }
            if (source && source.attr('metadata/name') === 'destination' && target) {
                // A link is added from a source destination to a target. In these cases the
                // target will show the label (whether a real app or another destination).
                // This is done so that if a destination is connected to 5 outputs, this destination
                // won't track the 5 stream names, the nodes it links to will instead.
                target.attr('.stream-label/display', 'block');//, { silent: true });
            }
            if (target && target.attr('metadata/name') === 'destination') {
                // Incoming link has been added -> hide stream label
                // Set silently because update will be called for the next property setting
                target.attr('.stream-label/display', 'none', { silent: true });
                // XXX target.attr('.output-port/display', 'none');
            }
            // If tap link has been added update the stream-label for the target
            if (link.get('source').port === 'tap' && target) {
                target.attr('.stream-label/display', 'block');
            }

        }

        function handleLinkEvent(paper, event, link) {
            if (event === 'change:source') {
                handleLinkSourceChanged(link, paper);
            } else if (event === 'change:target') {
                handleLinkTargetChanged(link, paper);
            } else if (event === 'remove') {
                handleLinkRemoved(link, paper);
            } else if (event === 'add') {
                handleLinkAdded(link, paper);
                paper.findViewByModel(link).on('switch',function() {
                    handleLinkEvent(paper, 'switch', link);
                });
                paper.findViewByModel(link).on('insert-channel',function() {
                    handleLinkEvent(paper, 'insert-channel', link);
                });
            } else if (event === 'switch') {
                handleLinkSwitch(link, paper);
            } else if (event === 'insert-channel') {
                handleLinkInsertChannel(link, paper);
            }
        }

        function getLinkAnchorPoint(linkView, view, magnet, reference) {
            if (magnet) {
                var type = magnet.getAttribute('type');
                var bbox = joint.V(magnet).bbox(false, linkView.paper.viewport);
                var rect = joint.g.rect(bbox);
                if (type === 'input') {
                    return joint.g.point(rect.x, rect.y + rect.height / 2);
                } else {
                    return joint.g.point(rect.x + rect.width, rect.y + rect.height / 2);
                }
            } else {
                return reference;
            }
        }


        return {
            'createNode': createNode,
            'createLink': createLink,
            'createHandle': createHandle,
            'createDecoration': createDecoration,
            'getLinkView': getLinkView,
            'getNodeView': getNodeView,
            'layout': layoutWithDagre,
            'initializeNewLink': initializeNewLink,
            'handleLinkEvent': handleLinkEvent,
            'isSemanticProperty': isSemanticProperty,
            'refreshVisuals': refreshVisuals,
            'getLinkAnchorPoint': getLinkAnchorPoint
        };

    }];

});

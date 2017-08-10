/*
 * Copyright 2015-2016 the original author or authors.
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
 * Utilities for Flo based Stream Definition graph editor.
 *
 * @author Alex Boyko
 */
define(function () {
    'use strict';

    function canBeHeadOfStream(graph, element) {
        if (!element.attr('.input-port') || element.attr('.input-port/display') === 'none') {
            return true;
        } else {
            var incoming = graph.getConnectedLinks(element, { inbound: true });
           //  console.log("Incoming check for "+ element.attr('metadata/name')+": "+JSON.stringify(incoming)+" "+incoming.length);
            if (incoming.length === 1 && incoming[0].get('source').port === 'tap') {
                // If app has one incoming link and its from a tap port then app is a start of a tap stream
                return true;
            }
            // Example incoming entry:
            // [{"type":"sinspctr.Link","smooth":true,
            //   "source":{"id":"0390de06-0a50-40e2-92f4-da5345293e48","selector":".output-port","port":"output"},"target":{"id":"1d83f76a-cb46-42cd-b285-a89ee8b83e8e","selector":".input-port","port":"input"},"id":"ca12147b-b7cb-4bd3-a601-ed0ff155de47","z":5,"attrs":{".marker-vertices":{"display":"none"}}}] 1
            if (incoming.length === 1) {
                // Is the source a destination with other outputs too? If so
                // then all of those nodes linked as outputs are heads rather
                // than the destination itself (being heads means they can
                // have the stream name set on them)
                var sourceCell = graph.getCell(incoming[0].get('source').id);
                var isDestination = sourceCell.attr('metadata/name') === 'destination';
                if (isDestination) {
                    // var destinationInputs = graph.getConnectedLinks(sourceCell, { oubound: true});
                    // if (destinationInputs.length > 1) {
                        return true;
                    // }
                }
            }
        }
        return false;
    }

    function generateStreamName(graph, element) {
        var streamNames = [];
        graph.getElements().forEach(function(e) {
           if (element !== e && e.attr('stream-name') && canBeHeadOfStream(graph, e)) {
               streamNames.push(e.attr('stream-name'));
           }
        });

        // Check if current element stream name is unique
        if (element && element.attr('stream-name') && streamNames.index(element.attr('stream-name')) === -1) {
            return element.attr('stream-name');
        }

        var name = 'STREAM_', index = 1;
        while (streamNames.indexOf(name + index) >= 0) {
            index++;
        }
        return name + index;
    }

    return {
        'canBeHeadOfStream': canBeHeadOfStream,
        'generateStreamName': generateStreamName
    };
});

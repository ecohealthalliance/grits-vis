/*jslint browser: true, nomen: true, unparam: true*/

(function ($, d3, colorbrewer) {
    'use strict';

    var map;

    function opacity(d) {
        return d.properties.score;
    }

    function makePopOver(node, data) {
        var msg = [];
        msg.push('<b>Summary:</b> ' + data.properties.summary);
        msg.push('<b>Date:</b> ' + data.properties.date.toString());
        msg.push('<b>Location:</b> ' + data.properties.country);
        msg.push('<b>Disease:</b> ' + data.properties.disease);
        msg.push('<b>Symptoms:</b> ' + data.properties.symptoms.join(', '));
        msg.push('<b>Species:</b> ' + data.properties.species);
        msg.push('<b>Similarity:</b> ' + data.properties.score.toFixed(2));
        $(node).popover({
            html: true,
            container: 'body',
            placement: 'auto top',
            trigger: 'manual',
            content: msg.join('<br>\n')
        });
    }

    function update(args) {
        var data = args.data,
            dataStart = args.dataEnd,
            dataEnd = args.dataStart;
        
        data.forEach(function (d) {
            if (d.properties.date < dataStart) {
                dataStart = d.properties.date;
            }
            if (d.properties.date > dataEnd) {
                dataEnd = d.properties.date;
            }
        });

        var cscale = colorbrewer.YlGnBu[3],
            midDate = new Date((dataStart.valueOf() + dataEnd.valueOf()) / 2),
            color = d3.scale.linear().domain([dataStart, midDate, dataEnd]).range(cscale).clamp(true);
        map.geojsMap('group', 'points', {
            lat: function (d) { return d.geometry.coordinates[1]; },
            lng: function (d) { return d.geometry.coordinates[0]; },
            r: function (d) {
                return '5pt';
            },
            data: data,
            dataIndexer: function (d) {
                return d.properties.id;
            },
            style: {
                fill: function (d) {
                    if (d.properties.score > 0.99) {
                        return 'red';
                    }
                    return color(d.properties.date);
                },
                'fill-opacity': opacity,
                'stroke-opacity': opacity,
                'stroke': 'black',
                'stroke-width': '0.5pt',
                'pointer-events': 'auto'
            },
            handlers: {
                'click': function (d) {
                    console.log(d);
                },
                'mouseover': function () {
                    $(this).popover('show');
                },
                'mouseout': function () {
                    $(this).popover('hide');
                }
            },
            enter: {
                each: function (d) {
                    var link = d3.select(this.parentNode).append('svg:a')
                        .attr('xlink:href', d.properties.link)
                        .attr('target', 'healthMapInfo');
                    $(link.node()).prepend(this);
                    makePopOver(this, d);
                }
            },
            exit: {
                each: function (d) {
                    $(this).parent().remove();
                }
            }

        }).trigger('draw');
    }
    window.mapApp = {
        initialize: function (node) {
            map = $(node).geojsMap({'zoom': 3});
            $(map).on('datachanged', function (evt, args) {
                update(args);
            });
        },
    };
}(window.$, window.d3, window.colorbrewer));

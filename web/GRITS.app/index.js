/*jslint browser: true */
/*globals d3, $, loadHealthMapData */

$(function () {
    "use strict";

    /*
    var resize = function () {
        var width = $(this).width(),
            height = $(this).height();

        d3.select(this)
            .html("<b>width: </b>" + width + "<br>" +
                  "<b>height: </b>" + height + "<br>");
    };
    */
    $(window).resize(function () {
        $("div").trigger("resize.div");
    });
    //$(".content").on("resize.div", resize);
    // Create control panel.
    $("#control-panel").controlPanel();

    // place map in upper left
    var map = $('#upper-left').geojsMap({'zoom': 3});
    var color = d3.scale.category10().domain(d3.range(20));
    
    function makePopOver(node, data) {
        var msg = [];
        msg.push('<b>Summary:</b> ' + data.description);
        msg.push('<b>Date:</b> ' + data.meta.date.toString());
        msg.push('<b>Location:</b> ' + data.meta.country);
        msg.push('<b>Disease:</b> ' + data.meta.disease);
        msg.push('<b>Symptoms:</b> ' + data.symptoms.join(', '));
        $(node).popover({
            html: true,
            container: 'body',
            placement: 'top',
            trigger: 'manual',
            content: msg.join('<br>\n')
        });
    }

    // add a new feature group, add some data, and trigger a draw
    loadHealthMapData(new Date(2014, 2, 1), new Date(2014, 2, 7), 200, function (data) {
        map.geojsMap('group', 'points', {
            lat: function (d) { return d.meta.latitude; },
            lng: function (d) { return d.meta.longitude; },
            r: '5pt',
            data: data,
            style: {
                fill: function (d, i) { return color(i % 10); }
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
            each: function (d) {
                var link = d3.select(this.parentNode).append('svg:a')
                    .attr('xlink:href', d.meta.link)
                    .attr('target', 'healthMapInfo');
                $(link.node()).prepend(this);
                makePopOver(this, d);
            }
        }).trigger('draw');
    });

    // ***** DENDROGRAM in lower right *****
    (function () {
        var getChildren = function (node) {
            return [].concat(node.children && node.children[0] ? getChildren(node.children[0]) : [],
                             tangelo.isArray(node.symptom.name) ? node.symptom.name : [],
                             node.children && node.children[1] ? getChildren(node.children[1]) : []);
        };

        d3.json("../decision-tree/decision_tree.json", function (err, data) {
            var symptoms,
                qargs;

            if (err) {
                console.log(err);
                return;
            }

            function defaultColor(node) {
                node.color = "lightsteelblue";
                $.each(node.children, function (i, v) {
                    defaultColor(v);
                });
            }
            defaultColor(data);

            function followPath(node, symptoms){
                var way;

                if (!node.children || node.children.length === 0) {
                    node.color = "red";
                } else {
                    node.color = "pink";

                    way = symptoms.hasOwnProperty(node.symptom.name.toLowerCase()) ? 0 : 1;
                    followPath(node.children[way], symptoms);
                }
            }

            qargs = tangelo.queryArguments();
            if (qargs.hasOwnProperty("symptoms")) {
                symptoms = {};
                $.each(qargs.symptoms.split(",").map(function (s) {
                    return s.toLowerCase();
                }), function (_, v) {
                    symptoms[v] = true;
                });

                followPath(data, symptoms);
            }

            $("#lower-right").dendrogram({
                data: data,
                orientation: "vertical",
                id: {field: "id"},
                textsize: 14,
                nodesize: 5,
                nodeColor: {field: "color"},
                hoverNodeColor: {value: "firebrick"},
                collapsedNodeColor: {value: "blue"},
                onNodeCreate: function (d) {
                    var left,
                        right,
                        html;

                    if (!tangelo.isArray(d.symptom.name)) {
                        left = d.children && d.children[0] ? getChildren(d.children[0]) : [];
                        right = d.children && d.children[1] ? getChildren(d.children[1]) : [];

                        html = "<p><b>Symptom: </b>" + d.symptom.name + "</p>";
                        html += "<p><b>Disease count: </b>" + (left.length + right.length) + "</p>";
                        html += "<p><b>Present: </b>" + left.join(", ") + "</p>";
                        html += "<p><b>Absent: </b>" + right.join(", ") + "</p>";
                    } else {
                        html = "<p><b>Diseases: </b>" + d.symptom.name.join(", ") + "</p>";
                    }

                    $(this).popover({
                        animation: true,
                        html: true,
                        placement: $("#tree").dendrogram("option", "orientation") === "horizontal" ? "auto right" : "auto bottom",
                        trigger: "manual",
                        content: html,
                        container: "body"
                    });

                    d3.select(this)
                        .on("click.popover", function (d) {
                            if (d3.event.shiftKey) {
                                $(this).popover("hide");
                            } else {
                                $(this).popover("toggle");
                            }
                        });
                },
                onNodeDestroy: function (d) {
                    $(this).popover("destroy");
                }
            });

            $("#lower-right").dendrogram("on", "click.collapse", function (d, i, elt) {
                if (d3.event.shiftKey) {
                    this.action("collapse").call(elt, d, i);
                }
            });
        });
    }());
});

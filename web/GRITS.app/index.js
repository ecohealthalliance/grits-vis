/*jslint browser: true */
/*globals d3, $ */

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


    var table = [
          [ "NEW YORK","NY","40.757929","-73.985506"],
          [ "LOS ANGELES","CA","34.052187","-118.243425"],
          [ "DENVER","CO","39.755092","-104.988123"],
          [ "PORTLAND","OR","45.523104","-122.670132"],
          [ "HONOLULU","HI","21.291982","-157.821856"],
          [ "ANCHORAGE","AK","61.216583","-149.899597"],
          [ "DALLAS","TX","32.781078","-96.797111"],
          [ "SALT LAKE CITY","UT","40.771592","-111.888189"],
          [ "MIAMI","FL","25.774252","-80.190262"],
          [ "PHOENIX","AZ","33.448263","-112.073821"],
          [ "CHICAGO","IL","41.879535","-87.624333"],
          [ "WASHINGTON","DC","38.892091","-77.024055"],
          [ "SEATTLE","WA","47.620716","-122.347533"],
          [ "NEW ORLEANS","LA","30.042487","-90.025126"],
          [ "SAN FRANCISCO","CA","37.775196","-122.419204"],
          [ "ATLANTA","GA","33.754487","-84.389663"]
        ];
    
    var color = d3.scale.category20().domain(d3.range(20)),
        clicked = -1;

    // add a new feature group, add some data, and trigger a draw
    map.geojsMap('group', 'points', {
        lat: function (d) { return parseFloat(d[2]); }, // custom accessors
        lng: function (d) { return parseFloat(d[3]); },
        r: function (d, i) { return i === clicked ? '10pt' : '3pt'; },
        data: table,
        style: {
            fill: function (d, i) { return color(i); },
            stroke: 'black',
            'stroke-width': '1px',
            'fill-opacity': 1.0
        },
        enter: {
            style: {
                fill: function (d, i) { return color(i); },
                'fill-opacity': 0.0
            },
            transition: {
                duration: 1000
            },
            handlers: {
                'click': function (d, i) {
                    clicked = i;
                    d3.select(this).transition().attr('r', '10pt');
                }
            }
        }
    }).trigger('draw');

    window.setInterval(function () {
        // every 2 seconds rotate the table and redraw with a transition
        table.push(table.shift());
        map.geojsMap('group', 'points', {
            data: table,
            transition: {
                ease: 'linear'
            }
        }).trigger('draw');
    }, 2000);
    
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

/*jslint browser: true */
/*globals d3, $ */

$(function () {
    "use strict";

    // Register a resize callback for the whole window; cause this to emit
    // custom resize events on each div.
    $(window).resize(function () {
        $("div").trigger("resize.div");
    });

    // Create control panel.
    $("#control-panel").controlPanel();

    // Install a keyup handler on the text input element - after a specified
    // delay, this will parse the input and send it to registered listeners.
    d3.select("#symptoms")
        .on("keyup", (function () {
            var wait = null,
                delay = 500,
                sendSymptoms;

            sendSymptoms = function (that) {
                var text,
                    words;

                // Get the input text.
                text = d3.select(that)
                    .property("value")
                    .trim();

                // Split the input by comma, then trim whitespace off the ends
                // of each piece.
                words = text.split(",")
                    .map(function (w) {
                        return w.trim();
                    })
                    .filter(function (w) {
                        return w !== "";
                    });

                // Bail if there are no words.
                if (words.length === 0) {
                    return;
                }

                // TODO: construct an event object (i.e., d3.event, et al.) and
                // emit an appropriate event here.
                console.log(words);
            };

            return function () {
                // Stop interrupted callbacks from piling up and firing all at
                // once.
                if (wait) {
                    window.clearTimeout(wait);
                }

                wait = window.setTimeout(sendSymptoms, delay, this);
            };
        }()));

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

    // add a new feature group, add some data, and trigger a draw
    map.geojsMap('group', 'points', {
        lat: function (d) { return parseFloat(d[2]); }, // custom accessors
        lng: function (d) { return parseFloat(d[3]); },
        data: table
    }).trigger('draw');

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

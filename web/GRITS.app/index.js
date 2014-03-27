/*jslint browser: true */
/*globals d3, $, loadHealthMapData, colorbrewer */

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

                // Construct and dispatch an event object that has the symptom
                // list in it.
                $.event.trigger({
                    type: "symptoms",
                    symptoms: words
                });
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
            placement: 'auto top',
            trigger: 'manual',
            content: msg.join('<br>\n')
        });
    }
    
    var defaultStart = new Date(2014, 1, 15),
        defaultEnd = new Date(2014, 1, 17);
    // create date range slider
    $('#dateRangeSlider').dateRangeSlider({
        range: true,
        bounds: {
            min: new Date(2014, 0, 1),
            max: new Date(2014, 2, 25)
        },
        defaultValues: {
            min: defaultStart,
            max: defaultEnd
        }
    }).on('valuesChanged', function (e, dates) {
        // add a new feature group, add some data, and trigger a draw
        var dataStart = dates.values.min,
            dataEnd   = dates.values.max;
        loadHealthMapData(dataStart, dataEnd, 1000, function (data) {
            var symptoms = [],
                defaultFill = 1.0,
                unselectFill = 1e-6,
                cscale = colorbrewer.Reds[3],
                midDate = new Date((dataStart.valueOf() + dataEnd.valueOf())/2),
                color = d3.scale.linear().domain([dataStart, midDate, dataEnd]).range(cscale).clamp(true);

            function intersectSymptoms(d) {
                var found = false;
                if (!symptoms.length) {
                    return true;
                }
                symptoms.forEach(function (symptom) {
                    d.symptoms.forEach(function (s) {
                        if (s.toLowerCase() === symptom) {
                            found = true;
                        }
                    });
                });
                return found;
            }
            map.geojsMap('group', 'points', {
                lat: function (d) { return d.meta.latitude; },
                lng: function (d) { return d.meta.longitude; },
                r: function (d) {
                    if (intersectSymptoms(d)) {
                        return (d.meta.rating * 3).toString() + 'pt';
                    }
                    return '0pt';
                },
                data: data,
                dataIndexer: function (d) { return d._id; },
                style: {
                    fill: function (d) { 
                        return color(d.meta.date);
                    },
                    'fill-opacity': function (d) { return intersectSymptoms(d) ? defaultFill : unselectFill; },
                    'stroke': 'black',
                    'stroke-width': '0.5pt'
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
                            .attr('xlink:href', d.meta.link)
                            .attr('target', 'healthMapInfo');
                        $(link.node()).prepend(this);
                        makePopOver(this, d);
                    }
                }
            }).trigger('draw');
            map.on('symptoms', function (e) {
                symptoms = [];
                $.each(e.symptoms, function (i, v) {
                    symptoms.push(v.toLowerCase());
                });
                map.geojsMap('group', 'points', {
                    transition: {
                        duration: 1000
                    }
                }).trigger('draw');
            });
        });
    }).trigger('valuesChanged', { values: { min: defaultStart, max: defaultEnd }});


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

    // ***** SPACEMAP in upper right *****
    d3.json("../spacemap/graph_export_2.json", function () {
        var constraints = [],
            spacemap,
            dataStack = [],
            data,
            types = [
                "link",
                "x",
                "y",
                "ordinalx",
                "ordinaly",
                "xy",
                "map"
            ];

        function updateData(d) {
            var fieldMap = {},
                fields = [];

            // data = d;

            data = d.nodes.slice(10);
            data.forEach(function (d) {
                d.lat = +d.lat;
                d.lon = +d.lon;
                d.random = Math.random();
                d.category = Math.round(Math.random() * 10);
                d.time = new Date();
                if (d.title.indexOf(">") >= 0) {
                    d.shortTitle = d.title.split(">")[1].split("-")[0];
                } else {
                    d.shortTitle = d.title.split(":")[1];
                }
            });

            // Discover fields
            data.forEach(function (d) {
                var field;
                for (field in d) {
                    if (d.hasOwnProperty(field) && !fieldMap[field]) {
                        fieldMap[field] = true;
                        fields.push(field);
                    }
                }
            });

            spacemap = $("#upper-right").spacemap({
                data: data,
                constraints: constraints
            }).data("spacemap");

            d3.select("#field-select").selectAll("option")
                .data(fields)
                .enter().append("option")
                .attr("value", function (d) { return d; })
                .text(function (d) { return d; });

        }

        $("#distance-slider").slider({
            min: 0,
            max: 100,
            value: 20,
            step: 1,
            change: function (evt, ui) {
                spacemap.option("linkDistance", ui.value);
            },
            slide: function (evt, ui) {
                spacemap.option("linkDistance", ui.value);
            }
        });

        $("#charge-slider").slider({
            min: 0,
            max: 100,
            value: 30,
            step: 1,
            change: function (evt, ui) {
                spacemap.option("charge", -ui.value);
            },
            slide: function (evt, ui) {
                spacemap.option("charge", -ui.value);
            }
        });

        $("#gravity-slider").slider({
            min: 0,
            max: 0.2,
            value: 0.1,
            step: 0.001,
            change: function (evt, ui) {
                spacemap.option("gravity", ui.value);
            },
            slide: function (evt, ui) {
                spacemap.option("gravity", ui.value);
            }
        });

        $("#add-button").click(function () {
            var field = $("#field-select").val(),
                row = $('<div class="form-group"></div>'),
                label = $('<label class="col-sm-2 control-label">' + field + '</label>'),
                sliderCol = $('<div class="col-sm-7"></div>'),
                slider = $('<div></div>'),
                typeCol = $('<div class="col-sm-3"></div>'),
                type = $('<select class="form-control"></select>'),
                constraint = {
                    name: field,
                    accessor: tangelo.accessor({field: field}),
                    type: "link",
                    strength: 0.5
                };

            d3.select(type.get(0)).selectAll("option")
                .data(types)
                .enter().append("option")
                .attr("value", function (d) { return d; })
                .text(function (d) { return d; });
            type.on("change", function () {
                constraint.type = type.val();
                spacemap.option("constraints", constraints);
            });

            constraints.push(constraint);
            sliderCol.append(slider);
            typeCol.append(type);
            row.append(label);
            row.append(sliderCol);
            row.append(typeCol);
            $("#constraints").append(row);
            slider.slider({
                min: 0,
                max: 1,
                value: 0.5,
                step: 0.01,
                change: function (evt, ui) {
                    constraint.strength = ui.value;
                    spacemap.option("constraints", constraints);
                },
                slide: function (evt, ui) {
                    constraint.strength = ui.value;
                    spacemap.option("constraints", constraints);
                }
            });
            spacemap.option("constraints", constraints);
        });

        $("#add-data-button").click(function () {
            var like = data.map(function(d) { return d._id.$oid; }).join(","),
                fields = constraints.map(function(d) { return d.name + ":" + d.strength; }).join(",");

            d3.json("healthmap?like=" + like + "&limit=50&fields=" + fields, function (newData) {
                // Add new data to the data array
                var idMap = {};
                if (newData.length === 0) {
                    return;
                }
                newData.forEach(function (d) {
                    idMap[d._id.$oid] = true;
                });
                data.forEach(function (d) {
                    if (!idMap[d._id.$oid]) {
                        newData.push(d);
                    }
                });
                dataStack.push(data);
                updateData(newData);
            });
        });

        $("#undo-button").click(function () {
            if (dataStack.length > 0) {
                updateData(dataStack.pop());
            }
        });

        d3.json("../spacemap/graph_export_2.json", function (data) {
            updateData(data);
        });

    });

    // ***** TIMELINE in lower left *****
    var data = [
        {date: new Date('1-1-2013'), y1: 4, y2: 10},
        {date: new Date('2-1-2013'), y1: 5, y2: 9},
        {date: new Date('3-1-2013'), y1: 6, y2: 8},
        {date: new Date('4-1-2013'), y1: 7, y2: 7},
        {date: new Date('5-1-2013'), y1: 8, y2: 6},
        {date: new Date('6-1-2013'), y1: 9, y2: 5},
        {date: new Date('7-1-2013'), y1: 10, y2: 4}
    ];

    var timeline = $('#lower-left').timeline({
        data: data,
        date: {field: "date"},
        y: [{field: "y1"}, {field: "y2"}]
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

                if (Object.keys(symptoms).length === 0) {
                    return;
                }

                if (!node.children || node.children.length === 0) {
                    node.color = "red";
                } else {
                    node.color = "pink";

                    way = symptoms.hasOwnProperty(node.symptom.name.toLowerCase()) ? 0 : 1;
                    followPath(node.children[way], symptoms);
                }
            }

            function restoreDefaultColor(node){
                var way;

                if (node.collapsed) {
                    node.color = "blue";
                } else {
                    node.color = "lightsteelblue";
                }

                if (node.children) {
                    $.each(node.children, function (i, v) {
                        restoreDefaultColor(v);
                    });
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

            $("#lower-right").on("symptoms", function (e) {
                var symptoms = {};
                $.each(e.symptoms, function (i, v) {
                    symptoms[v.toLowerCase()] = true;
                });

                restoreDefaultColor($(this).dendrogram("option", "data"));
                followPath($(this).dendrogram("option", "data"), symptoms);
                $(this).dendrogram("refresh");
            });
        });
    }());
});

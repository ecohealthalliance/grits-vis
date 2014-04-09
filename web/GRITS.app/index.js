/*jslint browser: true, nomen: true, unparam: true */
/*globals console, d3, $, loadHealthMapData, tangelo, mapApp, timelineApp*/

$(function () {
    "use strict";
    var spacemap,
        constraints = [],
        dataStack = [],
        types = [
            "link",
            "x",
            "y",
            "ordinalx",
            "ordinaly",
            "xy",
            "map"
        ],
        currentData  = [],
        defaultStart = new Date(2014, 0, 1),
        defaultEnd = new Date(2014, 2, 17),
        _symptoms = [],
        _queryLimit = 250,
        _selectedDateRange,
        spacemapInitialized = false,
        allData = [],
        data = [];


    // helper function to get a sorted array of keys from an object
    function getKeys(obj) {
        var keys = [], key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                keys.push(key);
            }
        }
        keys.sort();
        return keys;
    }

    // Register a resize callback for the whole window; cause this to emit
    // custom resize events on each div.
    $(window).resize(function () {
        $("div").trigger("resize.div");
    });

    // Create control panel.
    $("#control-panel").controlPanel();

    mapApp.initialize('#upper-left');
    timelineApp.initialize('#lower-left');

    function addConstraint(field, value) {
        // var row = $('<div class="form-group"></div>'),
        var row = $('<div></div>'),
            label = $('<label class="col-sm-2 control-label">' + field + '</label>'),
            sliderCol = $('<div class="col-sm-2" style="margin-top:15px"></div>'),
            slider = $('<div></div>'),
            typeCol = $('<div class="col-sm-3 hidden"></div>'),
            type = $('<select class="form-control"></select>'),
            constraint = {
                name: field,
                accessor: tangelo.accessor({field: 'properties.' + field}),
                type: "link",
                strength: value
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
            value: value,
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
    }

    function updateData(data) {
        var fieldMap = {},
            fields = [];

        currentData = data;

        // Discover fields
        data.forEach(function (d) {
            var field, subfield;
            for (field in d) {
                if (d.hasOwnProperty(field) && !fieldMap[field]) {
                    if (tangelo.isObject(d[field])) {
                        for (subfield in d[field]) {
                            if (d[field].hasOwnProperty(subfield) && !fieldMap[field + "." + subfield]) {
                                fieldMap[field + "." + subfield] = true;
                                fields.push(field + "." + subfield);
                            }
                        }
                    }
                    fieldMap[field] = true;
                    fields.push(field);
                }
            }
        });

        spacemap = $("#upper-right").spacemap({
            data: data,
            constraints: constraints
        }).data("spacemap");

        if (!spacemapInitialized) {
            spacemapInitialized = true;
            addConstraint("symptoms", 0);
            addConstraint("disease", 1);
            addConstraint("country", 0);
        }

        d3.select("#field-select").selectAll("option")
            .data(fields)
            .enter().append("option")
            .attr("value", function (d) { return d; })
            .text(function (d) { return d; });

    }

    function updateEverything() {
        var dataStart = _selectedDateRange.values.min,
            dataEnd   = _selectedDateRange.values.max,
            disease = $("#disease").val();
        loadHealthMapData(dataStart, dataEnd, disease, _queryLimit, function (argData, allSymptoms, allDiseases) {
            
            if (argData === 'login') {
                $("#login-panel").modal('show');
                return;
            } else if (argData === 'group') {
                $("#group-panel").modal('show');
                return;
            }

            allData = argData;
            $('#itemNumber').text(allData.length.toString() + " records loaded");
            filterBySymptoms();

            $('.content').trigger('datachanged', {
                data: data,
                dataStart: dataStart,
                dataEnd: dataEnd,
                disease: disease,
                allSymptoms: allSymptoms,
                allDiseases: allDiseases
            });

            updateOthers();
            updateSymptomsBox(allSymptoms);
        });
    }

    d3.select("#disease").on("change", function () {
        updateEverything();
    });

    // create date range slider
    $('#dateRangeSlider').dateRangeSlider({
        range: true,
        bounds: {
            min: new Date(2012, 3, 1),
            max: new Date(2014, 2, 17)
        },
        defaultValues: {
            min: defaultStart,
            max: defaultEnd
        }
    }).on('valuesChanged', function (e, dates) {
        // add a new feature group, add some data, and trigger a draw
        _selectedDateRange = dates;
        updateEverything();
    }).trigger('valuesChanged', { values: { min: defaultStart, max: defaultEnd }});

    function updateOthers() {
        // Update spacemap
        updateData(data);

    }

    function filterBySymptoms() {
        function intersectSymptoms(d) {
            var found = false;
            if (!_symptoms.length) {
                return true;
            }
            _symptoms.forEach(function (symptom) {
                if (found || symptom === 'all') {
                    found = true;
                } else {
                    d.properties.symptoms.forEach(function (s) {
                        if (s.toLowerCase() === symptom) {
                            found = true;
                        }
                    });
                }
            });
            return found;
        }

        data = [];
        allData.forEach(function (d) {
            if (intersectSymptoms(d)) { data.push(d); }
        });
    }

    $('#dataLimit').change(function (evt) {
        _queryLimit = parseInt($(this).val(), 10);
        console.log(_queryLimit);
        $('#dateRangeSlider').trigger('valuesChanged', _selectedDateRange);
    }).val(_queryLimit.toString());


    // ***** SPACEMAP in upper right *****
    $("#distance-slider").slider({
        min: 0,
        max: 100,
        value: 50,
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
            sliderCol = $('<div class="col-sm-8" style="margin-top:15px"></div>'),
            slider = $('<div></div>'),
            typeCol = $('<div class="col-sm-3 hidden"></div>'),
            type = $('<select class="form-control"></select>'),
            constraint = {
                name: field,
                accessor: tangelo.accessor({field: field}),
                type: "link",
                strength: 1.0
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
            value: 1.0,
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
        var like = currentData.map(function(d) { return d._id.$oid; }).join(","),
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
            currentData.forEach(function (d) {
                if (!idMap[d._id.$oid]) {
                    newData.push(d);
                }
            });
            dataStack.push(currentData);
            updateData(newData);
        });
    });

    $("#undo-button").click(function () {
        if (dataStack.length > 0) {
            updateData(dataStack.pop());
        }
    });

    function updateSymptomsBox(symptoms) {
        function getSelectedSymptoms() {
            var selected = [];
            d3.select("#symptomsSelectContainer")
                .selectAll('option').each(function () {
                    var t = d3.select(this);
                    if (t.node().selected) {
                        selected.push(d3.select(this).text());
                    }
            });
            return selected;
        }
        var oldSelected = getSelectedSymptoms(),
            main = d3.select("#symptomsSelectContainer");
        main.selectAll('#symptomsSelectBox').remove();
        var sel = main.append('select')
                    .attr('id', 'symptomsSelectBox');
        sel.node().multiple = true;
        sel.append('option')
            .attr('value', 'all')
            .text('all')
            .node().selected = ( !oldSelected.length || 
                                  oldSelected.indexOf('all') >= 0);
        getKeys(symptoms).forEach(function (s) {
            var opt = sel.append('option')
                .attr('value', s)
                .text(s);
            if (oldSelected.indexOf(s) >= 0) {
                opt.node().selected = true;
            } else {
                opt.node().selected = false;
            }
        });
        sel.on('change', function () {
            _symptoms = getSelectedSymptoms();
            updateEverything();
        });
    }
    updateSymptomsBox([]);


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

            function followPath(node, symptoms) {
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

            function restoreDefaultColor(node) {
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

            $("#lower-right").dendrogramLocal({
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
                        placement: $("#tree").dendrogramLocal("option", "orientation") === "horizontal" ? "auto right" : "auto bottom",
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

            $("#lower-right").dendrogramLocal("on", "click.collapse", function (d, i, elt) {
                if (d3.event.shiftKey) {
                    this.action("collapse").call(elt, d, i);
                }
            });

            $("#lower-right").on("symptoms", function (e) {
                var symptoms = {};
                $.each(e.symptoms, function (i, v) {
                    symptoms[v.toLowerCase()] = true;
                });

                restoreDefaultColor($(this).dendrogramLocal("option", "data"));
                followPath($(this).dendrogramLocal("option", "data"), symptoms);
                $(this).dendrogramLocal("refresh");
            }).resize($(this).dendrogramLocal("refresh"));
        });
    }());
});

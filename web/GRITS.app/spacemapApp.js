/*jslint browser: true, unparam: true*/
(function ($, d3, tangelo) {
    'use strict';

    function shuffle(a) {

        function swap(i, j) {
            var tmp = a[i];
            a[i] = a[j];
            a[j] = tmp;
        }

        // return a randomly shuffled copy of 'a'
        var b = a.slice();
        b.forEach(function (d, i) {
            var j = Math.floor(Math.random() * b.length);
            swap(i, j);
        });
        return b;
    }

    window.spacemapApp = {
        initialize: function (node) {
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
            currentData,
            spacemapInitialized = false,
            maxDataSize = 100;

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

                data = shuffle(data).slice(0, maxDataSize);
                currentData = data;

                // Discover fields
                data.forEach(function (d, i) {
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

                spacemap = $(node).spacemap({
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

            $(node).on('datachanged', function (evt, arg) {
                updateData(arg.data.filter(function (d) {
                    return d.properties.score >= arg.threshold;
                }));
            });

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
        }
    };
}(window.$, window.d3, window.tangelo));

/*jslint browser: true, nomen: true, unparam: true */
/*globals console, d3, $, loadHealthMapData, tangelo, mapApp, timelineApp, dendrogramApp, spacemapApp*/

$(function () {
    "use strict";
    var defaultStart = new Date(2014, 0, 1),
        defaultEnd = new Date(2014, 2, 17),
        _symptoms = [],
        _queryLimit = 250,
        _selectedDateRange,
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
    dendrogramApp.initialize('#lower-right');
    spacemapApp.initialize('#upper-right');


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
                symptoms: _symptoms,
                allSymptoms: allSymptoms,
                allDiseases: allDiseases
            });

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

});

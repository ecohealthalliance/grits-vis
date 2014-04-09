/*jslint browser: true, nomen: true, unparam: true */
/*globals console, d3, $, loadHealthMapData, tangelo, mapApp, timelineApp, dendrogramApp, spacemapApp*/

$(function () {
    "use strict";
    var defaultStart = new Date(2014, 0, 1),
        defaultEnd = new Date(2014, 2, 17),
        _symptoms = [],
        _queryLimit = 250;


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

    function updateSymptomsBox(symptoms) {
        var oldSelected = getSelectedSymptoms(),
            box = d3.select('#symptomsSelectBox');

        box.selectAll('option').remove();

        box.append('option')
            .attr('value', 'all')
            .text('all')
            .node().selected = ( !oldSelected.length || 
                                  oldSelected.indexOf('all') >= 0);
        getKeys(symptoms).forEach(function (s) {
            var opt = box.append('option')
                .attr('value', s)
                .text(s);
            if (oldSelected.indexOf(s) >= 0) {
                opt.node().selected = true;
            } else {
                opt.node().selected = false;
            }
        });
    }

    function updateEverything() {


        var dataStart = $('#dateRangeSlider').dateRangeSlider('min'),
            dataEnd = $('#dateRangeSlider').dateRangeSlider('max'),
            disease = $("#disease").val();
        loadHealthMapData(dataStart, dataEnd, disease, _queryLimit, function (argData, allSymptoms, allDiseases) {
            
            function filterBySymptoms(allData) {
                var filteredData = [];
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

                allData.forEach(function (d) {
                    if (intersectSymptoms(d)) { filteredData.push(d); }
                });
                return filteredData;
            }

            if (argData === 'login') {
                $("#login-panel").modal('show');
                return;
            }
            if (argData === 'group') {
                $("#group-panel").modal('show');
                return;
            }

            $('#itemNumber').text(argData.length.toString() + " records loaded");
            var data = filterBySymptoms(argData);

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
    }).on('valuesChanged', updateEverything)
      .trigger('valuesChanged');


    $('#dataLimit').change(function (evt) {
        _queryLimit = parseInt($(this).val(), 10);
        updateEverything();
    }).val(_queryLimit.toString());

    d3.select('#symptomsSelectContainer')
        .append('select')
            .attr('id', 'symptomsSelectBox')
            .call(function () {
                this.node().multiple = true;
            })
            .on('change', function () {
                _symptoms = getSelectedSymptoms();
                updateEverything();
            });
    updateSymptomsBox([]);

});

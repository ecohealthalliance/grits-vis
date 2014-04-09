/*jslint browser: true, nomen: true, unparam: true */
/*globals console, d3, $, tangelo, mapApp, timelineApp, dendrogramApp, spacemapApp*/

window.gritsLoader(function (loadHealthMapData) {
    "use strict";
    var defaultStart = new Date(2014, 0, 1),
        defaultEnd = new Date(2014, 2, 17),
        _queryLimit = 250,
        _savedSpecies = {};

    if (loadHealthMapData === 'login') {
        $("#login-panel").modal('show');
        return;
    }
    if (loadHealthMapData === 'group') {
        $("#group-panel").modal('show');
        return;
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

    function getSelectedOptions(node) {
        var selected = [], all = false;
        d3.select(node)
            .selectAll('option').each(function () {
                if (this.text === 'all' && this.selected) {
                    all = true;
                }
                if (all || this.selected) {
                    selected.push(this.text);
                }
        });
        return selected;
    }
    
    function getArrayFromKeys(obj) {
        var keys = [], key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                keys.push(key);
            }
        }
        return keys;
    }

    function multiSelectBox(node, items) {
        // generate a multi-select ui element with the given items
        
        var allItems = ['All'].concat(items || []),
            selection = d3.select(node)
            .selectAll('option')
                .data(allItems, function (i) { return i; });
        
        function makeUpper(s) {
            return s;
            //return s[0].toUpperCase() + s.substr(1);
        }

        selection.enter()
            .append('option')
                .text(function (d) { return makeUpper(d); })
                .filter(function (d) { return d === 'All'; })
                .each(function (d) {
                    this.selected = true;
                });
        
        selection.exit()
            .remove();
        selection.sort(function (a, b) {
            // sort by key, except all goes first
            if ( a === 'All' ) {
                return -1;
            }
            if ( b === 'All' ) {
                return 1;
            }
            if ( a === b ) {
                return 0;
            }
            return a < b ? -1 : 1;
        });
        return node;
    }

    function updateEverything() {

        var dataStart = $('#dateRangeSlider').dateRangeSlider('min'),
            dataEnd = $('#dateRangeSlider').dateRangeSlider('max'),
            symptoms = getSelectedOptions('#symptomsSelectBox'),
            diseases = getSelectedOptions('#diseaseSelectBox'),
            species = getSelectedOptions('#speciesSelectBox');
        loadHealthMapData(dataStart, dataEnd, species, diseases, _queryLimit, function (argData, allSymptoms, allSpecies, allDiseases) {
            
            function filterBySymptoms(allData) {
                var filteredData = [];
                function intersectSymptoms(d) {
                    var found = false;
                    if (!symptoms.length) {
                        return true;
                    }
                    symptoms.forEach(function (symptom) {
                        if (found || symptom === 'All') {
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


            $('#itemNumber').text(argData.length.toString() + " records loaded");
            var data = filterBySymptoms(argData);

            $('.content').trigger('datachanged', {
                data: data,
                dataStart: dataStart,
                dataEnd: dataEnd,
                symptoms: symptoms,
                allSymptoms: allSymptoms,
                allDiseases: allDiseases
            });

            multiSelectBox('#symptomsSelectBox', getArrayFromKeys(allSymptoms));
            multiSelectBox('#diseaseSelectBox', getArrayFromKeys(allDiseases));
            multiSelectBox('#speciesSelectBox', getArrayFromKeys($.extend(_savedSpecies, allSpecies)));
        });
    }

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
    }).on('valuesChanged', updateEverything);


    $('#dataLimit').change(function (evt) {
        _queryLimit = parseInt($(this).val(), 10);
        updateEverything();
    }).val(_queryLimit.toString());
    
    d3.select(multiSelectBox('#symptomsSelectBox'))
        .on('change', function () {
            updateEverything();
        });
    
    d3.select(multiSelectBox('#diseaseSelectBox'))
        .on('change', function () {
            updateEverything();
        });
    
    d3.select(multiSelectBox('#speciesSelectBox'))
        .on('change', function () {
            updateEverything();
        });

    updateEverything();
});

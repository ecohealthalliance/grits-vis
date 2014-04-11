/*jslint browser: true, unparam: true*/
(function ($) {
    'use strict';
    
    window.similarityApp = {
        initialize: function (main) {
            var distance = function (d) { return d.properties.scoreObj.distance.value; },
                time = function (d) { return d.properties.scoreObj.time.value; },
                symptoms = function (d) { return d.properties.scoreObj.symptoms.value; },
                species = function (d) { return d.properties.scoreObj.species.value; },
                comp = [
                    distance,
                    time,
                    symptoms,
                    species
                ];
            distance.label = 'distance';
            time.label = 'time';
            symptoms.label = 'symptoms';
            species.label = 'species';
            $(main).correlationPlot()
                    .correlationPlot('variables', comp)
                    .on('datachanged', function (evt, arg){
                        $(main).correlationPlot('data', arg.data);
                        $(main).trigger('draw');
                    })
                    .on('thresholdchanged', function (evt, arg) {
                        $(main).correlationPlot('threshold', arg.threshold);
                        $(main).trigger('draw');
                    });
        }
    };
}(window.$));

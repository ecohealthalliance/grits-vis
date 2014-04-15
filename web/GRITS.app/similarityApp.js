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
                ],
                threshold = 0.5,
                color = function (d) {
                    if (d.properties.score >= 1) {
                        return 'red';
                    }
                    return d.properties.score > threshold ? 'steelblue' : 'white';
                };
            distance.label = 'distance';
            time.label = 'time';
            symptoms.label = 'symptoms';
            species.label = 'species';
            $(main).correlationPlot({
                variables: comp,
                color: color
            })
                .on('datachanged', function (evt, arg){
                    threshold = arg.threshold;
                    $(main).correlationPlot('data', arg.data);
                    $(main).trigger('draw');
            });
            $(window).resize(function () {
                $(main).trigger('draw');
            });
        }
    };
}(window.$));

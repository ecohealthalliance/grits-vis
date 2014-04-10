/*jslint browser: true, unparam: true*/
(function ($) {
    'use strict';
    
    var options = {
        x: function (d) { return d.properties.scoreObj.distance.value; },
        y: function (d) { return d.properties.scoreObj.value; },
        idx: function (d) { return d.properties.id; },
        width: 500,
        height: 500,
        threshold: 0.5
    };

    window.similarityApp = {
        initialize: function (main) {
            $(main).correlationPlot(options)
                .on('datachanged', function (evt, arg) {
                    $(main).correlationPlot('data', arg.data)
                        .trigger('draw');
                });
        }
    };
}(window.$));

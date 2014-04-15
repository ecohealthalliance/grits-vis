/*jslint browser: true, nomen: true, unparam: true*/

(function ($, d3) {
    'use strict';
    window.timelineApp = {
        initialize: function (node) {
            $(node).on('datachanged', function (evt, args) {
                var data = args.data,
                    seriesMap = {},
                    series = [];
                // Update timeline

                // Bin the data by hour
                console.log(args.threshold);
                data.filter(function (d) {
                    return d.properties.score >= args.threshold;
                }).forEach(function (d) {
                    var hour = new Date(d.properties.date);
                    hour.setMinutes(0);
                    hour.setSeconds(0);
                    hour.setMilliseconds(0);
                    if (!seriesMap[hour]) {
                        seriesMap[hour] = {date: hour, count: 0};
                        series.push(seriesMap[hour]);
                    }
                    seriesMap[hour].count += 1;
                });

                series.sort(function (a, b) { return d3.ascending(a.date, b.date); });

                $(node).empty();
                $(node).timeline({
                    data: series,
                    date: {field: "date"},
                    y: [{field: "count"}]
                });

            });
        }
    };
}(window.$, window.d3));

/*jslint browser: true*/
/*global alert*/
(function ($) {
    var _histData = null;
    function loadHistData() {
        if (_histData) {
            return;
        }
        return $.ajax({
            url: 'data/symptomsHist.json',
            dataType: 'json',
            success: function (response) {
                _histData = response;
            },
            error: function () {
                alert('Failed to load symptoms data.');
            }
        });
    }

    // generate a random list of symptoms from a probability distribution
    function generateSymptoms() {
        function rSelect(h) {
            var cdf = h.cdf, val = h.value;
            var i = Math.random(), minVal = 2, minIdx = -1;
            cdf.forEach(function (v, k) {
                if (i <= v && v < minVal) {
                    minVal = v;
                    minIdx = k;
                }
            });
            return val[minIdx];
        }
            
        var N = rSelect(_histData.nSymptoms), symptoms = [], i, repeat, s;
        function inList(d) {
            var v = false;
            symptoms.forEach(function (t) {
                if (d === t) {
                    v = true;
                }
            });
            return v;
        }
        for ( i = 0; i < N; i++ ) {
            repeat = true;
            while(repeat) {
                s = rSelect(_histData.symptoms);
                repeat = inList(s);
            }
            symptoms.push(s);
        }
        return symptoms;
    }

    window.loadHealthMapData = function (startDate, endDate, limit, callBack) {
        $.ajax({
            url: '/girder/api/v1/resource/mongo_search',
            dataType: 'json',
            data: {
                type: 'item',
                q: JSON.stringify({
                    'meta.date': {
                        '$gte': {
                            '$date': startDate.valueOf()
                        },
                        '$lt': {
                            '$date': endDate.valueOf()
                        }
                    }
                }),
                limit: limit
            },
            success: function (response) {
                var itemRequests = [],
                     data = [];
                if (!_histData) {
                    itemRequests.push(loadHistData());
                }
                response.forEach(function (item) {
                    itemRequests.push(
                        $.ajax({
                            url: '/girder/api/v1/item/' + item._id,
                            dataType: 'json',
                            success: function (response) {
                                data.push(response);
                            }
                        })
                    );
                });
                $.when.apply($, itemRequests).then(
                    function () {      // success
                        data.forEach(function (d) {
                            var dateTime = d.meta.date.split(' '),
                                date = dateTime[0].split('-'),
                                time = dateTime[1].split(':');
                            dateTime = new Date(date[0], date[1] - 1, date[2]);
                            dateTime.setHours(time[0]);
                            dateTime.setMinutes(time[1]);
                            dateTime.setSeconds(time[2]);
                            d.meta.date = dateTime;
                            d.symptoms = generateSymptoms();
                        });
                        callBack(data);
                },
                    function () {      // fail
                        alert('Girder data failed to load');
                });
            }
        });
    };

}(window.$));

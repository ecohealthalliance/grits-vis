/*jslint browser: true, nomen: true */
/*global alert*/
(function ($) {
    "use strict";

    var _histData = null;
    var _logInOkay = null;
    function loadHistData(callBack) {
        if (_histData) {
            callBack();
        }
        return $.ajax({
            url: 'data/symptomsHist.json',
            dataType: 'json',
            success: function (response) {
                _histData = response;
                callBack();
            },
            error: function () {
                alert('Failed to load symptoms data.');
            }
        });
    }

    // generate a random list of symptoms from a probability distribution
    function generateSymptoms() {
        function rSelect(h) {
            var cdf = h.cdf, val = h.value,
                i = Math.random(), minVal = 2, minIdx = -1;
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
        for (i = 0; i < N; i += 1) {
            repeat = true;
            while (repeat) {
                s = rSelect(_histData.symptoms);
                repeat = inList(s);
            }
            symptoms.push(s);
        }
        return symptoms;
    }

    window.loadHealthMapData = function (startDate, endDate, disease, limit, callBack) {
        function fetchData() {
            var params = {};
            if (startDate) {
                params.start = startDate.toISOString();
            }
            if (endDate) {
                params.end = endDate.toISOString();
            }
            if (disease !== 'All') {
                params.disease = disease;
            }
            if (limit) {
                params.limit = limit;
            }
            //params.geoJSON = 1;
            $.ajax({
                url: '/girder/api/v1/resource/grits',
                dataType: 'json',
                data: params,
                success: function (response) {
                    function parseDate (dateString) {
                        if (dateString instanceof Date) {
                            return dateString;
                        }
                        var dateTime = dateString.split(' '),
                            date = dateTime[0].split('-'),
                            time = dateTime[1].split(':');
                        dateTime = new Date(date[0], date[1] - 1, date[2]);
                        dateTime.setHours(time[0]);
                        dateTime.setMinutes(time[1]);
                        dateTime.setSeconds(time[2]);
                        return dateTime;
                    }

                    loadHistData(function () {
                        response.forEach(function (d) {
                            d.meta.date = parseDate(d.meta.date);
                            d.symptoms = generateSymptoms();
                        });
                        callBack(response);
                    });
                }
            });
        }

        if (_logInOkay) { // maybe check log in every time?
            fetchData();
        } else {
            $.ajax({
                url: '/girder/api/v1/user/me',
                dataType: 'json',
                success: function (response) {
                    if (response) {
                        if (response.groups && response.groups.length > 0) { // should test if it is the correct group, but... later
                            _logInOkay = true;
                            fetchData();
                        } else {
                            _logInOkay = false;
                            callBack("group");
                        }
                    } else {
                        _logInOkay = false;
                        callBack("login");
                    }
                }
            });
        }
    };

}(window.$));

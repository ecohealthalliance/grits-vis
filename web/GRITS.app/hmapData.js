/*jslint browser: true, nomen: true */
/*global alert*/
(function ($) {
    "use strict";

    var _logInOkay = null;

    window.loadHealthMapData = function (startDate, endDate, species, disease, limit, callBack) {
        function fetchData() {
            var params = {};
            if (startDate) {
                params.start = startDate.toISOString();
            }
            if (endDate) {
                params.end = endDate.toISOString();
            }
            if (disease && disease.length > 0 && disease[0].toLowerCase() !== 'all') {
                params.disease = JSON.stringify(disease);
            }
            if (limit) {
                params.limit = limit;
            }
            if (species && species.length > 0 && species[0].toLowerCase() !== 'all') {
                params.species = JSON.stringify(species);
            }
            params.geoJSON = 1;
            params.randomSymptoms = 1;
            params.disableRegex = 1;
            $.ajax({
                url: '/girder/api/v1/resource/grits',
                dataType: 'json',
                data: params,
                success: function (response) {
                    var data = [],
                        symptoms = {},
                        diseases = {},
                        speciess = {};
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
                    function addKey(obj, key) {
                        if (obj.hasOwnProperty(key)) {
                            obj[key]++;
                        } else {
                            obj[key] = 1;
                        }
                    }
                    response.features.forEach(function (d) {
                        d.properties.date = parseDate(d.properties.date);
                        addKey(diseases, d.properties.disease);
                        d.properties.symptoms.forEach(function (s) {
                            addKey(symptoms, s);
                        });
                        addKey(speciess, d.properties.species);
                        data.push(d);
                    });
                    callBack(data, symptoms, speciess, diseases);
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

/*jslint browser: true, nomen: true */
/*global alert*/
(function ($) {
    "use strict";

    var loadedIncidentId = null,
        loadedIncident = null,
        targetIncident = '23710530003';
    
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

    function loadTargetIncident(callBack) {
        if (loadedIncidentId !== targetIncident) {
            $.ajax({
                url: '/girder/api/v1/resource/grits',
                dataType: 'json',
                data: {
                    id: JSON.stringify([targetIncident]),
                    geoJSON: 1,
                    disableRegex: 1,
                    randomSymptoms: 1
                },
                success: function (response) {
                    loadedIncident = response.features[0];
                    loadedIncident.properties.date = parseDate(loadedIncident.properties.date);
                    loadedIncidentId = loadedIncident.properties.id;
                    callBack(loadedIncident);
                }
            });
        } else {
            callBack(loadedIncident);
        }
    }

    function loadHealthMapData (startDate, endDate, species, disease, limit, callBack) {
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


    window.gritsLoader = function (callBack) {
        $.ajax({
            url: '/girder/api/v1/user/me',
            dataType: 'json',
            success: function (response) {
                if (response) {
                    if (response.groups && response.groups.length > 0) { // should test if it is the correct group, but... later
                        loadTargetIncident(function () {
                            callBack(loadHealthMapData);
                        });
                    } else {
                        callBack("group");
                    }
                } else {
                    callBack("login");
                }
            }
        });
    };
}(window.$));

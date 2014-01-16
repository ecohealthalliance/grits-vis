/*globals $, console, d3, tangelo */

$(function () {
    "use strict";
    var query = (function () {
        // This function is anonymous, is executed immediately and 
        // the return value is assigned to QueryString!
        var query_string = {},
            query = window.location.search.substring(1),
            vars = query.split("&"),
            i,
            pair,
            arr;
        for (i = 0; i < vars.length; i += 1) {
            pair = vars[i].split("=");
            // If first entry with this name
            if (typeof query_string[pair[0]] === "undefined") {
                query_string[pair[0]] = pair[1];
            // If second entry with this name
            } else if (typeof query_string[pair[0]] === "string") {
                arr = [ query_string[pair[0]], pair[1] ];
                query_string[pair[0]] = arr;
            // If third or later entry with this name
            } else {
                query_string[pair[0]].push(pair[1]);
            }
        }
        return query_string;
    }()),
        reports = query.reports.split(","),
        options;

    console.log(query);

    d3.json("graph_export_2.json", function (d) {
        console.log(d);

        d.links = d.links.filter(function (d) {
            if (query.type === "info") {
                return d.info_link;
            }
            if (query.type === "symptoms") {
                return d.matching_symptoms >= 3;
            }
            if (query.type === "geo") {
                return d.geo_distance < 50;
            }
            return d.matching_symptoms >= 3 || d.info_link || d.geo_distance < 50;
        });

        d.nodes.forEach(function (d) {
            d.focused = reports.indexOf(d.promed_id) !== -1;
            d.lat = +d.lat;
            d.lon = +d.lon;
            if (d.title.indexOf(">") >= 0) {
                d.shortTitle = d.title.split(">")[1].split("-")[0];
            } else {
                d.shortTitle = d.title.split(":")[1];
            }
        });

        options = {
            data: d,
            nodeId: {field: "promed_id"},
            nodeLabel: {field: "shortTitle"},
            nodeCharge: {value: -30},
            nodeColor: {field: "focused"},
            linkOpacity: {value: 0.01},
            linkDistance: {value: 80},
            dynamicLabels: true
        };

        if (query.constrainLat === "true") {
            options.nodeY = {field: "lat"};
        }
        if (query.constrainLon === "true") {
            options.nodeX = {field: "lon"};
        }

        $("body").nodelink(options);
    });
});
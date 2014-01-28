/*globals $, console, d3, tangelo */

$(function () {
    "use strict";

    $("#control-panel").controlPanel();

    d3.json("../graph/graph_export_2.json", function (d) {
        var spacemap, constraints;

        console.log(d);

        d.nodes = d.nodes.slice(0, 500);

        d.nodes.forEach(function (d) {
            d.lat = +d.lat;
            d.lon = +d.lon;
            d.random = Math.random();
            d.category = Math.round(Math.random() * 10);
            d.time = new Date();
            if (d.title.indexOf(">") >= 0) {
                d.shortTitle = d.title.split(">")[1].split("-")[0];
            } else {
                d.shortTitle = d.title.split(":")[1];
            }
        });

        constraints = [
        /*
            {
                accessor: tangelo.accessor({field: "lat"}),
                type: "y",
                strength: 1
            },
            {
                accessor: tangelo.accessor({field: "lon"}),
                type: "x",
                strength: 1
            },
            {
                accessor: tangelo.accessor({field: "random"}),
                type: "x",
                strength: 0.1
            },
        */
        /*
            {
                accessor: tangelo.accessor({field: "random"}),
                type: "x",
                strength: 0.5
            },
        */
            {
                accessor: tangelo.accessor({field: "category"}),
                type: "link",
                strength: 1
            },
            {
                accessor: function (d) { return {lng: d.lon, lat: d.lat}; },
                type: "map",
                strength: 0.2
            }
        ];

        spacemap = $("#vis").spacemap({
            data: d.nodes,
            constraints: constraints
        }).data("spacemap");

        window.setTimeout(function () {
            console.log("hi");
            constraints[0].strength = 1;
            constraints[1].strength = 0.01;
            spacemap.option("constraints", constraints);
        }, 5000);
    });
});
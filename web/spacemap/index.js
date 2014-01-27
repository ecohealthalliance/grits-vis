/*globals $, console, d3, tangelo */

$(function () {
    "use strict";

    $("#control-panel").controlPanel();

    d3.json("../graph/graph_export_2.json", function (d) {
        console.log(d);

        d.nodes = d.nodes.slice(0, 5000);

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

        $("#vis").spacemap({
            data: d.nodes,
            constraints: [
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
                {
                    accessor: tangelo.accessor({field: "category"}),
                    type: "link",
                    strength: 0.5
                },
                {
                    accessor: tangelo.accessor({field: "random"}),
                    type: "x",
                    strength: 0.5
                },
            */
                {
                    accessor: function (d) { return {x: d.lon, y: -d.lat}; },
                    type: "xy",
                    strength: 0.5
                }
            ]
        });
    });
});
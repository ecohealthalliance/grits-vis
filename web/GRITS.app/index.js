/*jslint browser: true */
/*globals d3, $ */

$(function () {
    "use strict";

    /*
    var resize = function () {
        var width = $(this).width(),
            height = $(this).height();

        d3.select(this)
            .html("<b>width: </b>" + width + "<br>" +
                  "<b>height: </b>" + height + "<br>");
    };
    */
    $(window).resize(function () {
        $("div").trigger("resize.div");
    });
    //$(".content").on("resize.div", resize);
    // Create control panel.
    $("#control-panel").controlPanel();

    // place map in upper left
    $('#upper-left').geojsMap();
});

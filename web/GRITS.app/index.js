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
    var map = $('#upper-left').geojsMap({'zoom': 3});


    var table = [
          [ "NEW YORK","NY","40.757929","-73.985506"],
          [ "LOS ANGELES","CA","34.052187","-118.243425"],
          [ "DENVER","CO","39.755092","-104.988123"],
          [ "PORTLAND","OR","45.523104","-122.670132"],
          [ "HONOLULU","HI","21.291982","-157.821856"],
          [ "ANCHORAGE","AK","61.216583","-149.899597"],
          [ "DALLAS","TX","32.781078","-96.797111"],
          [ "SALT LAKE CITY","UT","40.771592","-111.888189"],
          [ "MIAMI","FL","25.774252","-80.190262"],
          [ "PHOENIX","AZ","33.448263","-112.073821"],
          [ "CHICAGO","IL","41.879535","-87.624333"],
          [ "WASHINGTON","DC","38.892091","-77.024055"],
          [ "SEATTLE","WA","47.620716","-122.347533"],
          [ "NEW ORLEANS","LA","30.042487","-90.025126"],
          [ "SAN FRANCISCO","CA","37.775196","-122.419204"],
          [ "ATLANTA","GA","33.754487","-84.389663"]
        ];

    // add a new feature group, add some data, and trigger a draw
    map.geojsMap('group', 'points', {
        lat: function (d) { return parseFloat(d[2]); }, // custom accessors
        lng: function (d) { return parseFloat(d[3]); },
        data: table
    }).trigger('draw');

});

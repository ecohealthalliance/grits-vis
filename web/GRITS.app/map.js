/*jslint browser: true, unparam: true*/
(function ($, geo) {
    $.fn.geojsMap = function (params) {
        var defaults = {
            zoom: 2,
            center: [0, 0]
        },
            idiv = 0;
        params = $.extend({}, defaults, params);

        this.each(function () {
            // we need to change geojs to accept a jquery node...
            var divID = 'geojsMapDiv' + (++idiv).toString(),
                m_node = $(this);
            m_node.attr('id', divID);

            // create the map and layers
            var mapOpts = $.extend({ node: divID }, params),
                map = geo.map(mapOpts),
                osm = geo.osmLayer({'renderer': 'vglRenderer'}).referenceLayer(true);
            
            // resize handler
            function resize() {
                map.resize(0, 0, m_node.width(), m_node.height());
            }
            $(window).resize(resize); 
            map.addLayer(osm);
            resize();
        });
    };
}(window.$, window.geo));

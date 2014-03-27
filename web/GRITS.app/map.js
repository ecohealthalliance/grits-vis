/*jslint browser: true, unparam: true*/
(function ($, geo, d3) {
    
    // create a group of markers inside the given geojs layer
    function GeoApplicationGroup(id, layer, jdiv) {
        var renderer = layer.renderer(),
            svg = renderer.canvas().append('g').attr('id', id),
            ll2xy = renderer.latLngToDisplayGenerator(),
            trans = [0, 0],
            center;
        
        // where we keep the geo transformation cache in the data objects
        // we could store it somewhere else, but then we need to deal with dataIndexer
        var _x = '_x_' + id,
            _y = '_y_' + id;

        center = [ jdiv.width()/2, jdiv.height()/2 ];

        // set default styles/accessors/data
        jdiv.data(id, {
                lat: function (d) { return d.lat(); },
                lng: function (d) { return d.lng(); },
                r: '3pt',
                transition: null,
                style: {
                    fill: 'blue',
                    stroke: 'none',
                    'fill-opacity': 1.0,
                    'stroke-opacity': 1.0
                },
                handlers: {},
                each: function () {},
                enter: {
                    //lat: center.x,
                    //lng: center.y,
                    r: '0pt',
                    transition: {
                        delay: 0,
                        duration: 500,
                        ease: 'cubic-in-out'
                    },
                    style: {
                        'fill-opacity': 0.0,
                        'stroke-opacity': 0.0
                    },
                    handlers: {}
                },
                exit: {
                    //lat: center.x,
                    //lng: center.y,
                    r: '0pt',
                    transition: {
                        delay: 0,
                        duration: 500,
                        ease: 'cubic-in-out'
                    },
                    style: {
                        'fill-opacity': 0.0,
                        'stroke-opacity': 0.0
                    },
                    handlers: {}
                },
                data: [],
                dataIndexer: null,
                flushGeoCache: true  // for recompute of geo transform, broken right now
            }
        );
        
        // apply styling rules to a selection
        function applyStyle(s, opts) {
            var key;
            function addHandler(event, handler) {
                return function () {
                    d3.select(this).on(event, handler);
                };
            }
            s
                .attr('cx', function (d) { return d[_x]; })
                .attr('cy', function (d) { return d[_y]; })
                .attr('r', opts.r)
                .style(opts.style);
            for (key in opts.handlers) {
                if (opts.handlers.hasOwnProperty(key)) {
                    s.each(addHandler(key, opts.handlers[key]));
                }
            }
            if (opts.each) {
                s.each(opts.each);
            }
            return s;
        }

        // create a selection transition
        function applyTransition(s, trans) {
            if (!trans) {
                return s;
            }
            return s.transition()
                        .delay(trans.delay || 0)
                        .duration(trans.duration === undefined ? 500 : trans.duration)
                        .ease(trans.ease || 'cubic-in-out');
        }

        this.draw = function (aOpts) {
            // extract draw options
            var flushCache = (aOpts || {}).flushCache;

            // tell geojs we are modifying the data
            layer.modified();

            // extract styles/accessors
            var opts = jdiv.data(id);
            
            // compute geo transform
            opts.data.forEach(function (d) {
                var pt, lat;
                if (flushCache || opts.flushGeoCache || !d.hasOwnProperty(_x) || !d.hasOwnProperty(_y)) {
                    // hack to get around weirdness of geoTransform in geojs...
                    lat = geo.mercator.lat2y(opts.lat(d));
                    pt = ll2xy(geo.latlng(lat, opts.lng(d)));
                    d[_x] = pt.x() - trans[0];
                    d[_y] = pt.y() - trans[1];
                }
                //opts.flushGeoCache = false;
            });

            // create the selection
            var pts = svg.selectAll('.dataPoints').data(opts.data);
            
            // apply main style/transition
            applyStyle(applyTransition(pts, opts.transition), opts);

            // append elements on enter
            var enter = pts.enter()
                .append('circle')
                .attr('class', 'dataPoints');

            // apply enter style
            applyStyle(enter, opts.enter);
            
            // apply enter style/transition
            applyStyle(applyTransition(enter, opts.enter.transition), opts);

            // apply exit style/transition
            applyStyle(applyTransition(pts.exit(), opts.exit.transition), opts.exit).remove();

            // reset main transition
            jdiv.data({transition: null});

        };

        this.translate = function (t) {
            if (t === undefined) {
                trans = [0, 0];
            } else {
                trans[0] += t[0];
                trans[1] += t[1];
            }
            svg.attr('transform', 'translate(' + trans.toString() + ')');
        };
    }
    
    // initialize a geojs map inside `elem`
    function initialize(params) {
        var defaults = {
                zoom: 2,
                center: [0, 0]
        },
            idiv = 0;
        params = $.extend(true, {}, defaults, params);

        this.each(function () {
            // we need to change geojs to accept a jquery node...
            var divID = 'geojsMapDiv' + (++idiv).toString(),
                m_this = this,
                m_node = $(m_this);
            m_node.attr('id', divID);

            // check if this element has already been initialized with a map
            // ( we can't currently destroy an existing map )
            if (m_node.data('_mapLayer') !== undefined) {
                throw 'geojsMap called twice on the same element';
            }

            // create the map and layers
            var mapOpts = $.extend({ node: divID }, params),
                map = geo.map(mapOpts),
                osm = geo.osmLayer({'renderer': 'vglRenderer'}).referenceLayer(true),
                layer = geo.featureLayer({'renderer': 'd3Renderer'});
            
            // resize handler
            function resize() {
                map.resize(0, 0, m_node.width(), m_node.height());

                // georeferencing needs to be recomputed on resize
                m_node.trigger('draw', { flushCache: true });
            }

            // set up data handlers
            m_node.on('draw', function (evt, opts) {
                var groups = m_node.data('_mapGroups');
                $.map(groups, function (g) {
                    g.draw(opts);
                });
            });

            layer.on(geo.event.pan, function (evt) {
                var groups = m_node.data('_mapGroups');
                $.map(groups, function (g) {
                    g.translate([
                        evt.curr_display_pos.x - evt.last_display_pos.x,
                        evt.curr_display_pos.y - evt.last_display_pos.y
                    ]);
                });
            });

            // layer object to the element data
            m_node.data('_mapLayer', layer);

            // initialize groups
            m_node.data('_mapGroups', {});
            
            // attach resize handler
            $(window).resize(resize);

            // connect the layers together
            map.addLayer(osm)
               .addLayer(layer);

            // perform the initial resize
            resize();

            return this;
        });

        return this;
    }

    // get a marker group, create a new one, or set options
    function getSetGroup (id, opts) {
        var m_node = $(this),
            layer = m_node.data('_mapLayer'),
            groups = m_node.data('_mapGroups');


        // group does not exist, make a new one
        if (!groups.hasOwnProperty(id)) {
            groups[id] = new GeoApplicationGroup(id, layer, m_node);
            m_node.data('_mapGroups', groups);
        }

        // set if opts is defined
        if (opts !== undefined && id !== undefined) {
            $.extend(true, m_node.data(id), opts);
            return this;
        }

        // return a group's options
        return $.extend(true, m_node.data(id));
    }

    $.fn.geojsMap = function (arg1, arg2, arg3) {
        var r; 
        if (arg1 === 'group') {
            r = getSetGroup.call(this, arg2, arg3);
        } else {
            r = initialize.call(this, arg1);
        }

        return r;
    };
}(window.$, window.geo, window.d3));

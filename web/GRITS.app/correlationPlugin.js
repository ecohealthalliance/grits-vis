/*jslint browser: true, unparam: true*/
(function (d3, $) {
    function CorrelationSubPlot(options) {
        options = options || {};
        
        var that = this,
            node = options.node,
            padding = options.padding || 7.5,
            width = (options.width || $(node).width()) - 2 * padding,
            height = (options.height || $(node).height()) - 2 * padding,
            svg = d3.select(options.node)
                    .append('g')
                        .attr('transform', 'translate(' + padding + ',' + padding + ')'),
            xAx = d3.scale.linear().range([0, width]).domain([0,1]),
            yAx = d3.scale.linear().range([height, 0]).domain([0,1]),
            opacity = options.opacity || 1,
            duration = options.duration || 250;
        
        svg.append('rect')
            .attr('class', 'axis')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', width)
            .attr('height', height);

        this.x = options.x;
        this.y = options.y;
        this.data = options.data || [];
        this.idx = options.idx || undefined;
        this.radius = options.radius || '3pt';
        this.threshold = options.threshold || 0.5;

        this.draw = function () {
            if (!(that.x && that.y)) {
                throw "x and y accessors are not set";
            }
            var selection = svg.selectAll('.point')
                                .data(that.data, that.idx);

            selection.enter()
                .append('circle')
                    .attr('class', 'point')
                    .attr('cx', function (d) {
                        return xAx(that.x(d));
                    })
                    .attr('cy', function (d) {
                        return yAx(that.y(d));
                    })
                    .attr('r', that.radius)
                    .style({
                        'fill-opacity': 0,
                        'stroke-opacity': 0
                    });
            selection.exit()
                .remove();
            selection
                .transition()
                    .duration(duration)
                .attr('cx', function (d) {
                    return xAx(that.x(d));
                })
                .attr('cy', function (d) {
                    return yAx(that.y(d));
                })
                .attr('r', that.radius)
                .style({
                    'fill-opacity': opacity,
                    'stroke-opacity': opacity
                })
                .style('fill', function (d) {
                    return d.properties.scoreObj.value <= that.threshold ? 'red' : null;
                });
            return this;
        };
    }
    
    function CorrelationPlotter(options) {
        options = options || {};
        var that = this,
            node = options.node,
            padding = options.padding || 10,
            offset = 15,
            oWidth = options.width || $(node).width(),
            oHeight = options.height || $(node).height(),
            rWidth = Math.min(oWidth, oHeight),
            width = rWidth - 2*padding - offset,
            height = rWidth - 2*padding - offset,
            eWidth = (oWidth - rWidth)/2,
            eHeight = (oHeight - rWidth)/2,
            svg = d3.select(node).append('svg')
                        .attr('class', 'correlationPlot')
                        .attr('width', oWidth + 2*padding)
                        .attr('height', oHeight + 2*padding)
                        .append('g')
                            .attr('transform', 'translate(' + (padding + eWidth + offset) + ',' + (padding + eHeight + offset) + ')');
        this.variables = options.variables || [];
        this.data = options.data || [];
        this.table = null;
        this.draw = function () {
            if (!that.variables.length) { return; }
            var nvars = that.variables.length,
                nblocks = nvars - 1,
                sWidth = width/nblocks,
                sHeight = height/nblocks,
                plotSelection;
            
            // create the variable correlation table
            if (!that.table) {
                that.table = [];
                that.variables.forEach(function (d) {
                    that.variables.forEach(function (e) {
                        that.table.push({
                            x: e,
                            y: d
                        });
                    });
                });
            }
            
            // add axis labels
            svg.selectAll('.xlabel')
                .data(that.variables.slice(0,3))
                    .enter()
                .append('text')
                    .attr('class', 'xlabel')
                    .attr('x', function (d, i) {
                        return (i + 0.5)*sWidth;
                    })
                    .attr('y', - offset/2)
                    .attr('text-anchor', 'middle')
                    .text(function (d) { return d.label; });
            svg.selectAll('.ylabel')
                .data(that.variables.slice(1))
                    .enter()
                .append('text')
                    .attr('class', 'ylabel')
                    .attr('transform', function (d, i) {
                        var cx = -offset/2,
                            cy = (nvars - i - 1.5) * sWidth;
                        return 'translate(' + cx + ',' + cy + ') rotate(-90)';
                    })
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('text-anchor', 'middle')
                    .text(function (d) { return d.label; });
                                    
            plotSelection = svg.selectAll('.subPlot')
                    .data(that.table);
            plotSelection.enter()
                .append('g')
                    .attr('class', 'subPlot')
                    .attr('transform', function (d, i) {
                        var x = i % nvars,
                            y = nvars - 1 - Math.floor(i / nvars);
                        return 'translate(' + (x * sWidth) + ',' + (y * sHeight) + ')';
                    })
                .each(function (d, i) {
                    var x = i % nvars,
                        y = nvars - 1 - Math.floor(i / nvars);
                    if (x + y < nvars - 1) {
                        d.plot = new CorrelationSubPlot({
                            width: sWidth,
                            height: sHeight,
                            node: this,
                            x: d.x,
                            y: d.y
                        });
                    } else {
                        d.plot = {
                            draw: function () { return null; }
                        };
                    }
                });
            
            plotSelection.each(function (d) {
                d.plot.data = that.data;
                d.plot.draw();
            });

        };

    }

    $.fn.correlationPlot = function (arg1, arg2) {
        $.each(this, function () {
            var node = $(this),
                obj = node.data('plotObject');
            if (arg1 === 'variables') {
                obj.variables = arg2;
            } else if (arg1 === 'data') {
                obj.data = arg2;
            } else {
                obj = new CorrelationPlotter($.extend({'node': this}, arg1));
                node.data('plotObject', obj);
                $(node).on('draw', obj.draw);
            }
        });
        return this;
    };
}(window.d3, window.$));

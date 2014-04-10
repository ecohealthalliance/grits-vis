/*jslint browser: true, unparam: true*/
(function (d3, $) {
    function CorrelationPlotter(options) {
        options = options || {};
        
        var that = this,
            node = options.node,
            padding = options.padding || 10,
            width = (options.width || $(node).width()) - 2 * padding,
            height = (options.height || $(node).height()) - 2 * padding,
            svg = d3.select(options.node)
                    .append('svg')
                        .attr('class', 'correlationPlot')
                        .attr('width', width + 2*padding)
                        .attr('height', height + 2*padding)
                        .append('g')
                            .attr('transform', 'translate(' + padding + ',' + padding + ')'),
            xAx = d3.scale.linear().range([0, width]).domain([0,1]),
            yAx = d3.scale.linear().range([height, 0]).domain([0,1]),
            line = d3.svg.line().x(function (d) { return xAx(d[0]); })
                                .y(function (d) { return yAx(d[1]); }),
            opacity = options.opacity || 1,
            duration = options.duration || 250;
        
        svg.append('path')
            .attr('class', 'xAxis axis')
            .attr('d', line([[0,0], [1,0]]));

        svg.append('path')
            .attr('class', 'yAxis axis')
            .attr('d', line([[0,0], [0,1]]));

        this.x = options.x;
        this.y = options.y;
        this.data = options.data || [];
        this.idx = options.idx || undefined;
        this.radius = options.radius || '5pt';
        this.threshold = options.threshold;

        this.draw = function () {
            if (!(that.x && that.y)) {
                throw "x and y accessors are not set";
            }
            var selection = svg.selectAll('.point')
                                .data(that.data, that.idx),
                thresholdArc = svg.selectAll('.threshold'),
                arc = d3.svg.arc()
                            .innerRadius(0)
                            .outerRadius(function (d) { return xAx(d); })
                            .startAngle(0)
                            .endAngle(Math.PI / 2);

            if (that.threshold) {
                thresholdArc.data([that.threshold])
                    .enter().append('path')
                        .attr('class', 'threshold')
                        .attr('transform', 'translate(0,' + height + ')');
                thresholdArc
                        .attr('d', arc);

            } else {
                thresholdArc.remove();
            }
            selection.enter()
                .append('circle')
                    .attr('class', 'point')
                    .attr('cx', that.x)
                    .attr('cy', that.y)
                    .attr('r', that.radius)
                    .style({
                        'fill-opacity': 0,
                        'stroke-opacity': 0
                    });
            selection.exit()
                .remove();
            selection
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
                });
            return this;
        };
    }

    $.fn.correlationPlot = function (arg1, arg2) {
        $.each(this, function () {
            var node = $(this),
                obj = node.data('plotObject');
            if (arg1 === 'x') {
                obj.x = arg2;
            } else if (arg1 === 'y') {
                obj.y = arg2;
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

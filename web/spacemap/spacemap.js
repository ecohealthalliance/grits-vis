/*jslint browser: true, nomen: true */

(function (tangelo, $, d3) {
    "use strict";

    if (!($ && $.widget && d3)) {
        $.fn.nodelink = tangelo.unavailable({
            plugin: "nodelink",
            required: ["JQuery", "JQuery UI", "d3"]
        });
        return;
    }

    $.widget("tangelo.spacemap", {
        options: {
            data: [],
            constraints: [],
            width: $(window).width(),
            height: $(window).height()
        },

        _create: function () {
            var options;

            this.force = d3.layout.force();

            this.svg = d3.select(this.element.get(0))
                .append("svg");

            options = $.extend(true, {}, this.options);
            options.data = this.options.data;
            delete options.disabled;
            delete options.create;
            this._setOptions(options);
            this._update();
        },

        _update: function () {
            var that = this,
                dataNodes = [],
                colorScale;

            this.nodes = [];
            this.links = [];

            this.options.data.forEach(function (d) {
                var node = {data: d};
                that.nodes.push(node);
                dataNodes.push(node);
            });

            this.options.constraints.forEach(function (constraint, i) {
                var scale, xScale, yScale;

                constraint.nodeMap = {};
                constraint.index = i;

                if (constraint.type === "x") {
                    scale = d3.scale.linear()
                        .domain(d3.extent(that.options.data, constraint.accessor))
                        .range([0, that.options.width]);
                    constraint.constrain = function (d) {
                        d.x = scale(constraint.accessor(d.data));
                    };
                } else if (constraint.type === "y") {
                    scale = d3.scale.linear()
                        .domain(d3.extent(that.options.data, constraint.accessor))
                        .range([0, that.options.height]);
                    constraint.constrain = function (d) {
                        d.y = scale(constraint.accessor(d.data));
                    };
                } else if (constraint.type === "xy") {
                    xScale = d3.scale.linear()
                        .domain(d3.extent(that.options.data, function (d) {
                            return constraint.accessor(d).x;
                        }))
                        .range([0, that.options.width]);
                    yScale = d3.scale.linear()
                        .domain(d3.extent(that.options.data, function (d) {
                            return constraint.accessor(d).y;
                        }))
                        .range([0, that.options.height]);
                    constraint.constrain = function (d) {
                        d.x = xScale(constraint.accessor(d.data).x);
                        d.y = yScale(constraint.accessor(d.data).y);
                    };
                } else if (constraint.type === "link") {
                    constraint.constrain = function () {};
                }
                dataNodes.forEach(function (node) {
                    var value = JSON.stringify(constraint.accessor(node.data));
                    if (!constraint.nodeMap[value]) {
                        constraint.nodeMap[value] = {data: node.data, constraint: constraint};
                        that.nodes.push(constraint.nodeMap[value]);
                    }
                    that.links.push({source: node, target: constraint.nodeMap[value]});
                });
            });

            console.log(this.nodes);
            console.log(this.links);

            this.force.linkDistance(function (link) {
                //return 0;
                return 0;
                //return 100 - 100 * link.target.constraint.strength;
            })
                .linkStrength(function (link) {
                    return link.target.constraint.strength;
                })
                .charge(function (node) {
                    //return 0;
                    return node.constraint ? 0 : -20;
                })
                .gravity(0)
                .chargeDistance(20)
                .theta(0.2)
                .size([this.options.width, this.options.height])
                .nodes(this.nodes)
                .links(this.links)
                .start();

            this.link = this.svg.selectAll(".link")
                .data(this.links);

            this.link.enter()
                .append("line")
                .classed("link", true)
                .style("opacity", function (d) { return d.target.constraint.strength / 2; })
                .style("stroke", "#999")
                .style("stroke-width", 1);

            this.node = this.svg.selectAll(".node")
                .data(this.nodes);

            this.node.enter()
                .append("circle")
                .classed("node", true)
                .call(this.force.drag)
                .append("title");

            colorScale = d3.scale.category10();

            this.node
                .attr("r", function (d) { return d.constraint ? 2 : 4; })
                .style("fill", function (d) { return colorScale(d.constraint ? d.constraint.index : -1); })
                .style("opacity", 1);

            this.force.on("tick", function () { that._tick.call(that); });

            this.force.resume();
        },

        _tick: function() {
            var that = this;

            that.nodes.forEach(function (node) {
                if (node.constraint) {
                    node.constraint.constrain(node);
                }
            });

            that.link.attr("x1", function (d) { return d.source.x; })
                .attr("y1", function (d) { return d.source.y; })
                .attr("x2", function (d) { return d.target.x; })
                .attr("y2", function (d) { return d.target.y; });

            that.node.attr("cx", function (d) { return d.x; })
                .attr("cy", function (d) { return d.y; });
        }
    });
}(window.tangelo, window.jQuery, window.d3));

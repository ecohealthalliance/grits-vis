(function (_, $, d3) {
    "use strict";

    $.widget("tangelo.casecount", {
        options: {
            caseCounts: [],
            x: function (d) { return d.date; },
            y: function (d) { return d.value; },
            click: function (d, that) {
                that.selectedId = that.options.id(d);
                that.plot.selectAll("circle")
                    .attr("r", function (d) { return that.options.id(d) === that.selectedId ? 8 : 2.5; })
                    // .style("opacity", function (d) { return that.options.id(d) === that.selectedId ? 1 : 0.3; })
                    .style("fill", function (d) { return that.options.color(d, that); });
                that.plot2.selectAll("circle")
                    .attr("r", function (d) { return that.options.id(d) === that.selectedId ? 3 : 1.5; })
                    // .style("opacity", function (d) { return that.options.id(d) === that.selectedId ? 1 : 0.3; })
                    .style("fill", function (d) { return that.options.color(d, that); });
                // window.open(this.options.link(d), "_blank");
                if (!that.detail) {
                    that.detail = d3.select(that.element.get(0)).append("div")
                        .style("position", "fixed")
                        .style("top", "20px")
                        .style("right", "20px")
                        .style("width", "300px")
                        .style("padding", "0px 20px 20px 20px")
                        .style("background", "#eee")
                        .style("font-family", "Arial")
                        .style("opacity", 0.8);
                }
                that.detail.html('<h4>' + d.article + '</h4><b>Cases:</b> ' + d.value + '<br><b>Type:</b> ' + d.type + d.typeDetail + '<br>'
                        + '<b>Original text:</b> "' + d.text + '"<br><b>Kind:</b> ' + (d.death ? "deaths" : "cases") + '<br><b>Article:</b> <a href="' + d.url + '" target="blank">' + d.id + '</a>');
            },
            color: function (d, that) {
                if (d.death) {
                    return "red";
                }
                return "steelblue";
            },
            init: function (that) {
                d3.select(that.element.get(0)).append("div")
                    .style("position", "fixed")
                    .style("top", "20px")
                    .style("right", "340px")
                    .style("width", "100px")
                    .style("padding", "20px 20px 20px 20px")
                    .style("background", "#fff")
                    .style("font-family", "Arial")
                    .html('<b><span style="color:steelblue">Cases</span><br><span style="color:red">Deaths</span>');
            },
            id: function (d) { return d.id; },
            margin: {
                top: 10,
                bottom: 170,
                left: 30,
                right: 30
            },
            margin2: {
                top: 40,
                bottom: 20,
                left: 30,
                right: 30
            },
            width: null,
            height: null,
            height2: 170,
            xTicks: 10,
            yTicks: 10
        },

        _create: function () {
            this.svg = d3.select(this.element.get(0)).append("svg").attr("class", "timeline");
            this.main = this.svg.append("g");
            this.plot = this.main.append("g").attr("class", "plot");
            this.plot2 = this.main.append("g").attr("class", "plot");
            this.selectedId = undefined;

            var axisPadding = 15,
                height = (this.options.height || this.element.height()) -
                    this.options.margin.top - this.options.margin.bottom - axisPadding;

            this.xaxis = this.main.append("g")
                .attr("transform", "translate(0," + height + ")")
                .style("font-family", "sans-serif")
                .style("font-size", "11px");

            this.yaxis = this.main.append("g")
                .style("font-family", "sans-serif")
                .style("font-size", "11px");

            this.xaxis2 = this.main.append("g")
                .attr("transform", "translate(0," + height + ")")
                .style("font-family", "sans-serif")
                .style("font-size", "11px");

            this._x = null;
            this._y = null;
            $(window).resize(this._update.bind(this));
            this.options.init(this);
            this._update();
        },

        _setOptions: function (options) {
            this._super(options);
            this._update();
        },

        _update: function () {
            var that = this,
                axisPadding = 15,
                margin = this.options.margin,
                xAcc = this.options.x,
                yAcc = this.options.y,
                width = (this.options.width || this.element.width()) -
                    margin.left - margin.right - axisPadding,
                height = (this.options.height || this.element.height()) -
                    margin.top - margin.bottom - axisPadding,
                height2 = this.options.height2 -
                    this.options.margin2.top - this.options.margin2.bottom - axisPadding,
                y2 = height + height2 + this.options.margin2.top,
                color = d3.scale.category10(),
                xaxis,
                yaxis,
                xaxis2,
                line,
                data;

            data = [];
            color("number");
            color("range");
            color("min/max");
            color("min");
            color("max");
            color("unknown");

            this.options.caseCounts.forEach(function (d) {
                if (!d.meta.diagnosis.keypoints) {
                    return;
                }
                d.meta.diagnosis.keypoints.forEach(function (point) {
                    var value = NaN,
                        c = point.count,
                        type = "unknown",
                        typeDetail = "";

                    if (!c) {
                        return;
                    }
                    if (c.range_start) {
                        value = (c.range_start + c.range_end) / 2;
                        type = "range";
                        typeDetail = " [" + c.range_start + "," + c.range_end + "]";
                    } else if (c.min && c.max) {
                        value = (c.min + c.max) / 2;
                        type = "min/max"
                        typeDetail = " [" + c.min + "," + c.max + "]";
                    } else if (c.min) {
                        value = c.min;
                        type = "min"
                    } else if (c.max) {
                        value = c.max;
                        type = "max"
                    } else if (c.number) {
                        value = c.number;
                        type = "number"
                    }

                    if (value > 1000) {
                        value = NaN;
                    }

                    data.push({
                        date: d.meta.date.$date,
                        value: value,
                        text: point.text,
                        type: type,
                        typeDetail: typeDetail,
                        article: d.description,
                        death: c.death,
                        url: "http://healthmap.org/ln.php?" + d.name.slice(0, -4),
                        id: d.name.slice(0, -4)
                    });
                });
            });

            this._x = d3.time.scale()
                .domain(d3.extent(data, function (d) {
                    return new Date(xAcc(d));
                }))
                .range([0, width])
                .nice();
            this._y = d3.scale.linear()
                .domain(d3.extent(data, function (d) {
                    var val = yAcc(d);
                    if (_.isNumber(val) && !isNaN(val)) {
                        return val;
                    }
                    return undefined;
                }))
                .range([height, 0])
                .nice();

            this._x2 = d3.time.scale()
                .domain(this._x.domain())
                .range([0, width])
                .nice();
            this._y2 = d3.scale.linear()
                .domain(this._y.domain())
                .range([y2, height + this.options.margin2.top])
                .nice();

            xaxis = d3.svg.axis()
                .scale(this._x)
                .orient("bottom");
            xaxis.ticks(this.options.xTicks);
            yaxis = d3.svg.axis()
                .scale(this._y)
                .orient("left");
            yaxis.ticks(this.options.yTicks);

            xaxis2 = d3.svg.axis()
                .scale(this._x2)
                .orient("bottom");
            xaxis2.ticks(this.options.xTicks);

            // resize svg
            this.svg
                .attr("width", width + margin.left + margin.right + axisPadding)
                .attr("height", height + margin.top + margin.bottom + axisPadding);
            this.main
                .attr("transform", "translate(" + (margin.left + axisPadding) + "," + margin.top + ")");

            // generate axes
            this.xaxis
                .attr("transform", "translate(0," + height + ")")
                .call(xaxis);
            this.yaxis
                .call(yaxis);
            this.xaxis2
                .attr("transform", "translate(0," + y2 + ")")
                .call(xaxis2);

            function styleLine(selection) {
                selection
                    .style("fill", "none")
                    .style("stroke", "black")
                    .style("stroke-width", "1px")
                    .style("shape-rendering", "crispEdges");
            }

            this.xaxis.selectAll("path").call(styleLine);
            this.xaxis.selectAll("line").call(styleLine);
            this.yaxis.selectAll("path").call(styleLine);
            this.yaxis.selectAll("line").call(styleLine);
            this.xaxis2.selectAll("path").call(styleLine);
            this.xaxis2.selectAll("line").call(styleLine);

            this.plot.selectAll("circle")
                .data(data.filter(function (d) {
                    return !isNaN(that.options.x(d)) && !isNaN(that.options.y(d));
                }))
                .enter().append("circle")
                .attr("r", 2.5)
                .style("stroke", "white")
                .style("stroke-width", 0.5);
            this.plot.selectAll("circle")
                .attr("cx", function (d) { return that._x(that.options.x(d)); })
                .attr("cy", function (d) { return that._y(that.options.y(d)); })
                .style("cursor", "pointer")
                .style("fill", function (d) { return that.options.color(d, that); })
                .on("mouseover", function (d) {
                    d3.select(this).attr("r", 8);
                })
                .on("mouseout", function (d) {
                    d3.select(this).attr("r", function (d) { return that.options.id(d) === that.selectedId ? 8 : 2.5 })
                })
                .on("click", function (d) { that.options.click(d, that); });

            this.plot2.selectAll("circle")
                .data(data.filter(function (d) {
                    return !isNaN(that.options.x(d)) && !isNaN(that.options.y(d));
                }))
                .enter().append("circle")
                .attr("r", function (d) { return that.options.id(d) === that.selectedId ? 3 : 1.5 })
                .attr("opacity", 1)
                .style("fill", function (d) { return that.options.color(d, that); })
                .attr("stroke", "none");
            this.plot2.selectAll("circle")
                .attr("cx", function (d) { return that._x2(that.options.x(d)); })
                .attr("cy", function (d) { return that._y2(that.options.y(d)); });

            if (!this.brush) {
                this.brush = d3.svg.brush()
                    .x(this._x2)
                    .on("brush", function () {
                        that._x.domain(that.brush.empty() ? that._x2.domain() : that.brush.extent());
                        that.plot.selectAll("circle")
                            .attr("cx", function (d) { return that._x(that.options.x(d)); })
                            .attr("cy", function (d) { return that._y(that.options.y(d)); });
                        // focus.select(".area").attr("d", area);
                        that.xaxis.call(xaxis);
                    });
                this.plot2.append("g")
                    .attr("class", "x brush")
                    .call(this.brush)
                    .selectAll("rect")
                    .style("opacity", 0.2)
                    .attr("y", -6);
            }
            this.plot2.selectAll("g.brush").selectAll("rect")
                .attr("transform", "translate(0," + (height + this.options.margin2.top) + ")")
                .attr("height", height2 + 7);
        }
    });
}(window._, window.jQuery, window.d3));

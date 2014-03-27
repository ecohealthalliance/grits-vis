/*jslint browser: true, unparam: true */

(function ($, tangelo, vg) {
    "use strict";

    $.fn.timeline = function (spec) {
        var y,
            date = tangelo.accessor(spec.date, undefined),
            data = spec.data,
            dt = [],
            opt = {
                data: {table: dt},
                renderer: "svg",
                el: this[0]
            },
            that = this[0];

        spec.y = tangelo.isArray(spec.y) ? spec.y : [spec.y];
        y = [];
        spec.y.forEach(function (row) {
            var accessor = tangelo.accessor(row, undefined);
            accessor.field = row.field;
            y.push(accessor);
        });
        data.forEach(function (row) {
            y.forEach(function (yy) {
                dt.push({
                    date: date(row),
                    group: yy.field,
                    y: yy(row),
                    orig: row
                });
            });
        });
        console.log(dt);
        vg.parse.spec("timeline.json", function(chart) {
            chart(opt)
                // .on("mouseover", function (event, d) {
                //     // if (on.mouseover) {
                //     //     on.mouseover(d);
                //     // }
                // })
                // .on("mouseout", function (event, d) {
                //     // if (on.mouseout) {
                //     //     on.mouseout(d);
                //     // }
                // })
                // .on("click", function (event, d) {
                //     // if (on.click) {
                //     //     on.click(d);
                //     // }
                // })
                .update();
        });

        function update() {
            return that;
        }

        that.update = update;
        return that;
    };

}(window.jQuery, window.tangelo, window.vg));

function getChildren(node){
    return [].concat(node.children && node.children[0] ? getChildren(node.children[0]) : [],
                     tangelo.isArray(node.symptom.name) ? node.symptom.name : [],
                     node.children && node.children[1] ? getChildren(node.children[1]) : []);
}

$(function () {
    d3.json("decision_tree.json", function (err, data) {
        var symptoms,
            qargs;

        if (err) {
            console.log(err);
            return;
        }

        function defaultColor(node) {
            node.color = "lightsteelblue";
            $.each(node.children, function (i, v) {
                defaultColor(v);
            });
        }
        defaultColor(data);

        function followPath(node, symptoms){
            var way;

            if (!node.children || node.children.length === 0) {
                node.color = "red";
            } else {
                node.color = "pink";

                way = symptoms.hasOwnProperty(node.symptom.name) ? 0 : 1;
                followPath(node.children[way], symptoms);
            }
        }

        qargs = tangelo.queryArguments();
        if (qargs.hasOwnProperty("symptoms")) {
            symptoms = {};
            $.each(qargs.symptoms.split(","), function (_, v) {
                symptoms[v] = true;
            });

            followPath(data, symptoms);
        }

        d = data;

        $("#tree").dendrogram({
            data: data,
            orientation: "vertical",
            id: {field: "id"},
            textsize: 14,
            nodesize: 5,
            nodeColor: {field: "color"},
            hoverNodeColor: {value: "firebrick"},
            collapsedNodeColor: {value: "blue"},
            onNodeCreate: function (d) {
                var left,
                    right,
                    html;

                if (!tangelo.isArray(d.symptom.name)) {
                    left = d.children && d.children[0] ? getChildren(d.children[0]) : [];
                    right = d.children && d.children[1] ? getChildren(d.children[1]) : [];

                    html = "<p><b>Symptom: </b>" + d.symptom.name + "</p>";
                    html += "<p><b>Disease count: </b>" + (left.length + right.length) + "</p>";
                    html += "<p><b>Present: </b>" + left.join(", ") + "</p>";
                    html += "<p><b>Absent: </b>" + right.join(", ") + "</p>";
                } else {
                    html = "<p><b>Diseases: </b>" + d.symptom.name.join(", ") + "</p>";
                }

                $(this).popover({
                    animation: true,
                    html: true,
                    placement: $("#tree").dendrogram("option", "orientation") === "horizontal" ? "auto right" : "auto bottom",
                    trigger: "manual",
                    content: html,
                    container: "body"
                });

                d3.select(this)
                    .on("click.popover", function (d) {
                        if (d3.event.shiftKey) {
                            $(this).popover("hide");
                        } else {
                            $(this).popover("toggle");
                        }
                    });
            },
            onNodeDestroy: function (d) {
                $(this).popover("destroy");
            }
        });

        $("#tree").dendrogram("on", "click.collapse", function (d, i, elt) {
            if (d3.event.shiftKey) {
                this.action("collapse").call(elt, d, i);
            }
        });
    });
});

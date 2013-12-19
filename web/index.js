function getChildren(node){
    return [].concat(node.children && node.children[0] ? getChildren(node.children[0]) : [],
                     tangelo.isArray(node.symptom.name) ? node.symptom.name : [],
                     node.children && node.children[1] ? getChildren(node.children[1]) : []);
}

$(function () {
    d3.json("decision_tree.json", function (err, data) {
        if (err) {
            console.log(err);
            return;
        }

        d = data;

        $("#tree").dendrogram({
            data: data,
            orientation: "vertical",
            id: {field: "id"},
            textsize: 14,
            nodesize: 5,
            hoverNodeColor: {value: "firebrick"},
            collapsedNodeColor: {value: "blue"},
            newNodes: function (d) {
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
                    trigger: "click",
                    content: html,
                    container: "body"
                });
            }
        });
    });
});

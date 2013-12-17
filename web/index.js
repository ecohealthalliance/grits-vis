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
            //orientation: "vertical",
            id: {field: "id"},
            //label: {field: "symptom.name"},
            //nodesize: 15,
            textsize: 14,
            initialize: function (enter, update, exit) {
                enter.append("title")
                    .text(function (d) {
                        var left,
                            right;

                        if (!tangelo.isArray(d.symptom.name)) {
                            left = d.children && d.children[0] ? getChildren(d.children[0]) : [];
                            right = d.children && d.children[1] ? getChildren(d.children[1]) : [];

                            return d.symptom.name + "; children without: " + left + "; children with: " + right;
                        } else {
                            return "diseases: " + d.symptom.name;
                        }
                    });
            }
        });
    });
});

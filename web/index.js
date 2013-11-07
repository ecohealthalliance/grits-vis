$(function () {
    d3.json("decision_tree.json", function (err, data) {
        if (err) {
            console.log(err);
            return;
        }

        console.log(data);

        tangelo.vis.dendrogram({
            data: data,
            id: {field: "id"},
            el: d3.select("#tree").node()
        });
    });
});

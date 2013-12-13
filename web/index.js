$(function () {
    d3.json("decision_tree.json", function (err, data) {
        if (err) {
            console.log(err);
            return;
        }

        console.log(data);

        $("#tree").dendrogram({
            data: data,
            id: {field: "id"},
        });
    });
});

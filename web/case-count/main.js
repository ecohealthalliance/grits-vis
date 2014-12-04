
$(function () {
    var data = [
        {
            time: new Date().getTime(),
            value: 0
        },
        {
            time: new Date().getTime() + 1 * 1000 * 60 * 60 * 24,
            value: 1
        }
    ];

    d3.json('ebola_cases_10-7-2014_formatted_1pct.json', function (data) {
        console.log(data[0]);
        $('body').append('<div/>').casecount({caseCounts: data});
    });
});

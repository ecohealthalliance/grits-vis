
$(function () {
    d3.json('ebola_cases_10-7-2014_formatted_1pct.json', function (data) {
        console.log(data[0]);
        $('body').append('<div/>').casecount({caseCounts: data});
    });
});

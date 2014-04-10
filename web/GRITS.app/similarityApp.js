/*jslint browser: true, unparam: true*/
(function ($) {
    'use strict';
    
    var options = {
        idx: function (d) { return d.properties.id; },
        width: 120,
        height: 120,
        threshold: 0.5,
        padding: 5,
        radius: '2pt'
    };
    
    function createGrid(node, nRows, nCols) {
        var row, col,
            width = Math.floor(100 / nCols).toFixed(0) + '%',
            height = Math.floor(100 / nRows).toFixed(0) + '%',
            curRow;
        
        for (row = 0; row < nRows; row++) {
            curRow = $('<div></div>').appendTo(node)
                        .css('height', height)
                        .addClass('row');
            for (col = 0; col < nCols; col++) {
                $('<div></div>').appendTo(curRow.get(0))
                    //.css('width', width)
                    .addClass('cell')
                    .addClass('item-' + row + '-' + col);
            }
        }
        return $(node).find('.cell');
    }

    window.similarityApp = {
        initialize: function (main, x, y) {
            var row, col,
                cells = createGrid(main, 4, 4),
                comp = [
                    function (d) { return d.properties.scoreObj.distance.value; },
                    function (d) { return d.properties.scoreObj.time.value; },
                    function (d) { return d.properties.scoreObj.symptoms.value; },
                    function (d) { return d.properties.scoreObj.species.value; }
                ];
            $.each(cells, function () {
                $(this).addClass('col-sm-3');
            });
            for (row = 0; row < 4; row++) {
                for (col = 0; col < 4; col++) {
                    $(main).find('.item-' + row + '-' + col)
                           .correlationPlot($.extend({x: comp[col],
                                                      y: comp[3-row]}, options));
                }
            }
            $(main).on('datachanged', function (evt, arg){
                cells.correlationPlot('data', arg.data).trigger('draw');
            });
        }
    };
}(window.$));

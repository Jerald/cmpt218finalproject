$(document).ready(function ()
{
    makeGrid("#top");
    makeGrid("#mid");
    makeGrid("#bot");
    console.log("Prepped");
});

function makeGrid (layerID)
{
    $(layerID).append($("<table>"));

    var row1 = buildRow($("<tr>"));
    var row2 = buildRow($("<tr>"));
    var row3 = buildRow($("<tr>"));

    $(`${layerID} > table`).append(row1).append(row2).append(row3);
}

function buildRow (row)
{
    for (var i = 0; i < 3; i++)
    {
        row.append($("<td>").addClass("gridCell"));
    }

    return row;
}
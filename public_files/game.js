var gameCube;
var currentTurn;

// Defined in lobby.js
// var player;
// var username;
// var socketio;

$(document).ready(function ()
{
    // Remove for production!
    console.log("Initialization for game.js");

    gameCube = {
        top: [],
        mid: [],
        bot: []
    };

    myTurn = undefined;
    socketio.emit("getTurn");

    makeGrid("top");
    makeGrid("mid");
    makeGrid("bot");

    socketio.on("cellChange", cellChange);
    
    socketio.on("serverClose", () => { socketio.close(); console.log("Socket connection closed by server"); });
    
    socketio.on("win", win);
    socketio.on("lose", lose);

    socketio.on("setTurn", setTurn);

    if (player != undefined)
    {
        $("#player").text("Player ID: " + player);
    }
    else
    {
        $("#player").text("Your socket connection has issues! Likely you attempted to connect while two players were already assigned.");        
    }

    $("#user").text("Hello " + username + "! Have a good game!");

    console.log("Prepped");
});

function win()
{
    console.log("I won!");
    $("#turn").text("").toggleClass("yourTurn", false);
    $("#turn").text("").toggleClass("notYourTurn", false);

    $("#gameEnding").text("You've won the game!").addClass("gameWin");
}

function lose()
{
    console.log("I lost :(");
    $("#turn").text("").toggleClass("yourTurn", false);
    $("#turn").text("").toggleClass("notYourTurn", false)

    $("#gameEnding").text("Unfortunately you've lost :(").addClass("gameLose");
}

function setTurn(turn)
{
    var text;
    currentTurn = turn;

    console.log("Current turn: " + currentTurn);

    if (currentTurn == player)
    {
        text = `Is it currently your turn! Make a move!`;
    }
    else
    {
        text = `It's not your turn! Wait for the other player!`;
    }

    $("#turn").text(text).toggleClass("yourTurn", currentTurn == player);
    $("#turn").text(text).toggleClass("notYourTurn", currentTurn != player);
}


function makeGrid (layer)
{
    $(`#${layer}`).append($("<table>"));

    var row0 = buildRow($("<tr>"), `${layer}-row0`);
    var row1 = buildRow($("<tr>"), `${layer}-row1`);
    var row2 = buildRow($("<tr>"), `${layer}-row2`);

    $(`#${layer} > table`).append(row0).append(row1).append(row2);
    
    for (var i = 0; i < 3; i++)
    {
        let row = "row" + i;
        gameCube[layer][row] = [];
        for (var j = 0; j < 3; j++)
        {
            gameCube[layer][row][j] = undefined;
        }
    }
}

function buildRow (row, idInfo)
{
    var id;

    for (var i = 0; i < 3; i++)
    {
        id = `${idInfo}-${i}`;
        row.append($("<td>").addClass("gridCell").attr("id", id).click(clickHandler));
    }

    return row;
}

function encodeID(layer, row, col)
{
    return `${layer}-${row}-${col}`;
}

function clickHandler (event)
{
    var element = event.target; // The clicked element (in this case, clicked cell)
    
    var parsedID = element.id.split("-");
    
    var layer = parsedID[0];
    var row = parsedID[1];
    var col = parsedID[2];

    console.log(`Clicked at (${layer}, ${row}, ${col})`);

    var rowNum = row.slice(row.length - 1, row.length) - 1;
    // $(`#${layer}-${row}-${col}`).text(gameCube[layer][rowNum][col]);

    var clickObj = {
        layer: layer,
        row: row,
        col: col,
        player: player
    };

    socketio.emit("click", clickObj, clickCallback);
}

function clickCallback(response, reason)
{
    if (response == "success")
    {
        console.log("We clicked correctly!");
    }
    else if (response == "failure")
    {
        reason ? console.log("We failed to click for reason: " + reason) : console.log("We failed to click :(");
    }
    else
    {
        console.log("Something is wrong with clicking and the server!");
    }
}

function cellChange(change)
{
    var layer = change.layer;
    var row = change.row;
    var col = change.col;
    var update = change.update;

    var id = encodeID(layer, row, col);

    console.log(`Player ${update} clicked at: (${layer}, ${row}, ${col})`);
    $(`#${id}`).addClass(update);
    gameCube[layer][row][col] = update;
}
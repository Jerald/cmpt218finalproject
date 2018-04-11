var socketio;
var gameCube;
var setCells;

var p1;
var p2;
var players;

var currentPlayer;

module.exports = gameModule;

function init ()
{
    gameCube = {
        top: [],
        mid: [],
        bot: []
    };

    players = {};
    players.stats = {};
    players.usernames = {};
    players.startTime = undefined;

    makeGameCube("top");
    makeGameCube("mid");
    makeGameCube("bot");

    // Generate a random number between 0 and 1 then round it. If 1, p1. If 0, p2.
    currentPlayer = Math.round(Math.random()) ? "p1" : "p2";
    console.log("Starting player: " + currentPlayer);

    console.log("Game module init complete!");
}

function makeGameCube(layer)
{
    for (var i = 0; i < 3; i++)
    {
        let row = "row" + i;
        gameCube[layer][row] = [];
        for (var j = 0; j < 3; j++)
        {
            gameCube[layer][row][j] = undefined;;
            console.log("Making gameCube element: " + `(${layer}, ${row}, ${j})`);
        }
    }
}

function gameModule(passedSocketio, app)
{
    // Now I can do my own shit!
    socketio = passedSocketio;
    
    init();

    socketio.on("connection", connectionHandler);

}

function startGame()
{   
    players.p1.emit("startGame");
    players.p2.emit("startGame");

    players.startTime = Date.now();

    console.log("Starting game. No more users should connect!");
    console.log("Current turn: " + currentPlayer);
}

function gameOver(ending)
{
    if (ending == "draw")
    {
        players.stats.p1.draws += 1;
        players.stats.p2.draws += 1;
    }
    else if (ending == "p1")
    {
        players.stats.p1.wins += 1;
        players.stats.p2.loses += 1;
    }
    else if (ending == "p2")
    {
        players.stats.p1.loses += 1;
        players.stats.p2.wins += 1;
    }
}

function setupStats(playerID)
{
    players.stats[playerID] = {
        moves: 0,
        wins : 0,
        loses: 0,
        draws: 0,
    }
}

function saveStatsToServer(playerID)
{
    connect(saveStats);

    function saveStats(err, db, database)
    {
        if (err)
        {
            console.log("MongoDB did bad while trying to save user stats post-game...");
            throw err;
        }

        db.collection(players.usernames[playerID], null, function (err, collection)
        {
            if (err)
            {
                console.log("MongoDB did bad while getting collection for user stats post-game...");
                throw err;
            }

            let statsObj = players.stats[playerID];

            let updateObj =
            {
                $inc: { totalMoves: statsObj.moves,
                        wins: statsObj.wins,
                        losses: statsObj.loses,
                        draws: statsObj.draws
                      }
            }

            collection.findOneAndUpdate({}, updateObj, null, function (err, result)
            {
                if (err)
                {
                    console.log("MongoDB did bad while finding and updating the user stats post-game...");
                    throw err;
                }
            });
        });
    }
}

function connectionHandler(socket)
{
    if (players.p1 == undefined)
    {
        players.p1 = socket;
        setupPlayer("p1");
    }
    else if (players.p2 == undefined)
    {
        players.p2 = socket;
        setupPlayer("p2");
        
        // Both players are connected
        startGame();
    }
    else
    {
        console.log("Too many players!");
    }
}

function setupPlayer(playerID)
{
    players[playerID].on("click", clickHandler(playerID));
    players[playerID].on("getTurn", () => players[playerID].emit("setTurn", currentPlayer));
    players[playerID].emit("assignPlayer", playerID);

    players.usernames[playerID] = undefined;
    players[playerID].on("sendUsername", (username) => players.usernames[playerID] = username);
    
    setupStats(playerID);

    console.log(playerID + " is connected");
}

function clickHandler(passedPlayer)
{
    return function click(data, callback)
    {
        var player = passedPlayer;
        var layer = data.layer; 
        var row = data.row;
        var col = data.col;

        if (player != data.player)
        {
            console.log("ERROR: Our sockets are all confused! Source player: " + data.player + ". Intended player: " + player);
            callback("failure", "socketConfusion");
            return;
        }

        if (player != currentPlayer)
        {
            callback("failure", "wrongTurn");
            return;
        }
    
        console.log(`Player ${player}  clicked at location: (${layer}, ${row}, ${col})`);

        if (setCells >= 27)
        {
            gameOver("draw");
        }
    
        // If the cell is already taken for some reason (like clicking a clicked cell again)
        if (gameCube[layer][row][col] != undefined)
        {
            callback("failure", "takenCell");
            return;
        }
        
        // Otherwise, set the cell as taken by the player, then tell all players which cell was changed and by who
        gameCube[layer][row][col] = player;
        setCells += 1;
        players.stats[player].moves += 1;
        callback("success");
    
        var changeObj = {
            layer: layer,
            row: row,
            col: col,
            update: player
        };
    
        broadcastBoardChange(changeObj);
        gameStateCheck(changeObj);
    }
}

function broadcastBoardChange(change)
{
    if (players.p1 != undefined)
    {
        players.p1.emit("cellChange", change);
    }

    if (players.p2 != undefined)
    {
        players.p2.emit("cellChange", change);
    }
}

function gameStateCheck(lastChange)
{   
    var player = lastChange.update;
    
    var cell = lastChange;
    cell.player = player;
    cell.update = undefined;

    var playerWin = matchSearch(cell);
    
    if (playerWin == true)
    {
        console.log("Player " + player + " has won!");

        if (player == "p1")
        {
            players.p1.emit("win");
            players.p2.emit("lose");
        }
        else if (player == "p2")
        {
            players.p1.emit("lose");
            players.p2.emit("win");
        }

        gameOver(player);

        return;
    }

    // If the player is p1, it becomes p2. If it's p2, it becomes p1
    if (currentPlayer == "p1")
    {
        currentPlayer = "p2";
    }
    else
    {
        currentPlayer = "p1";
    }

    players.p1.emit("setTurn", currentPlayer);
    players.p2.emit("setTurn", currentPlayer);
}

function matchSearch(cell)
{
    var layers = ["top", "mid", "bot"];
    var layerIndex = layers.indexOf(cell.layer);

    var rows = ["row0", "row1", "row2"];
    var rowIndex = rows.indexOf(cell.row);

    var cols = ["0", "1", "2"];
    var colIndex = cols.indexOf(cell.col);

    var output = false;

    for (var i = -1; i <= 1; i++)
    {
        for (var j = -1; j <= 1; j++)
        {
            for (var k = -1; k <= 1; k++)
            {
                // Modify the indicies by i, j, k and check if clicked by player
                // If so, search for the next one in that direction

                let modLayerIndex = layerIndex + i;
                let modRowIndex = rowIndex + j;
                let modColIndex = colIndex + k;

                // If we're looking at the same cell, go to the next iteration
                if (i == 0 && j == 0 && k == 0) { continue; }

                let layer;
                let row;
                let col;

                // Stupid hack. In JS assignment returns what was set, so if it was undefined then it skips this iteration.
                if ((layer = layers[modLayerIndex]) == undefined) { continue; }
                if ((row = rows[modRowIndex]) == undefined) { continue; }
                if ((col = cols[modColIndex]) == undefined) { continue; }

                // If the given cell is marked by the player
                if (gameCube[layer][row][col] == cell.player)
                {
                    if (extendDirection(cell, {layer: i, row: j, col: k}) == true)
                    {
                        return true;
                    }
                }
            }
        }
    }

    return false;
}

function extendDirection(cell, direction)
{
    // Search for +/- 2 in from the cell in the given direction
    // If you find any 3 valid cells, we return that we've found a match
    
    var layers = ["top", "mid", "bot"];
    var layerIndex = layers.indexOf(cell.layer);
    
    var rows = ["row0", "row1", "row2"];
    var rowIndex = rows.indexOf(cell.row);
    
    var cols = ["0", "1", "2"];
    var colIndex = cols.indexOf(cell.col);
    
    var matches = 0;

    // console.log("-------------------------------------------------------------------------------");
    // console.log(`Extending from (${layerIndex}, ${rowIndex}, ${colIndex}) in the direction of (${direction.layer}, ${direction.row}, ${direction.col})`);
    
    for (let i = -2; i <= 2; i++)
    {
        // console.log("Current i: " + i);

        let modLayerIndex = layerIndex + (i*direction.layer);
        let modRowIndex = rowIndex + (i*direction.row);
        let modColIndex = colIndex + (i*direction.col);

        // console.log(`Modified indicies: (${modLayerIndex}, ${modRowIndex}, ${modColIndex})`);

        let layer;
        let row;
        let col;

        // Stupid hack. In JS assignment returns what was set, so if it was undefined then it skips this iteration.
        if ((layer = layers[modLayerIndex]) == undefined) { continue; }
        if ((row = rows[modRowIndex]) == undefined) { continue; }
        if ((col = cols[modColIndex]) == undefined) { continue; }


        // console.log(`Checking the cell (${layer}, ${row}, ${col})`);

        // The gameCube element at the modified indices
        // If it's equal to the player we're searching for, we add one to our matches
        if (gameCube[layer][row][col] == cell.player)
        {
            matches += 1;
        }
    }

    if (matches == 3)
    {
        // console.log("Found a winning match!");
        // console.log("-------------------------------------------------------------------------------");

        return true;
    }
    else if (matches >= 0 && matches <= 3)
    {
        // console.log("No winning match found");
        // console.log("-------------------------------------------------------------------------------");

        return false;
    }
    else
    {
        console.log("ERROR: something is bad with the game cube...");
        // console.log("-------------------------------------------------------------------------------");

        return false;
    }
}

function closeConnections ()
{
    if (players.p1 != undefined)
    {
        players.p1.emit("serverClose");
        players.p1 = undefined;
    }

    if (players.p2 != undefined)
    {
        players.p2.emit("serverClose");
        players.p2 = undefined;
    }

    console.log("Closed socket connections");
    process.exit();
}

// process.on("exit", closeConnections);
process.on("SIGINT", closeConnections);
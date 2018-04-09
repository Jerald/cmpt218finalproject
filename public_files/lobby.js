// See lobby.html for primer on the design for this system.

// For proper cleanup, we cannot define any global variables. Use closure instead. If we need global variables, also set them as undefined as per below.
// Dynamic page protocol will use the following function for cleanup:

function changePage (data)
{
    // Clear every function *except* main socket.io loop.
    // For example, if we have a function called foo() which we've set, we clear it with the following:
    // foo = undefined
    // This in fact will clear the code from the browser's memory.

    // Add functions to clear below:
    // <here>

    // This replaces the entire page with the supplied replacement data:
    console.log("running")
    $("html").html(data);
}

// This above function will not need to be cleared itself, as the game page will define it's own. (If not, it won't actually be of any real issue)
// The changePage function gets called as the success of the ajax which triggers the page change.

// This is an example of the ajax to call to load the game page. Copy the body to where it gets used. It'll probably be triggered by the start button in some way.
// The url and some other values may need to be changed.

function test()
{
    console.log("good");
}

function ajaxLoadGame ()
{
    $.ajax({
        method: "POST",
        url: "/game.html",
        dataType: `html`,
        data: FormData,
        success: function (response){
            console.log(response);
            var newDoc = document.open("text/html", "replace");
            newDoc.write(response);
            newDoc.close();
        }
    });
}

// To use the socketio connection, we abuse global scope. We define the socket variable in global scope, so once it's defined we can access it anywhere.
// This persists after we reload the page, assuming we don't delete it like the other variables. Example:
var socketio; // This is the connection variable, do NOT delete it.
// This socketio object still needs to be constructed in some ready function in this script.
// Construction example: socketio = io();

window.onload = function test()
{
    ajaxLoadGame();
}

socketio = io();

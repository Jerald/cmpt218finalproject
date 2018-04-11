var express = require('express');
var http = require('http');
var fs = require('fs');
var path = require('path');
var app = express();
var MongoClient = require('mongodb').MongoClient;
var async = require('async');

const port = process.env.PORT || 34416;

const url = 'mongodb://heroku_j2s6r6g2:iviph9u2pek0ab3v31kue2gach@ds161018.mlab.com:61018/heroku_j2s6r6g2';
const database = "heroku_j2s6r6g2";

var activeToken;
var isActive = false;
var start;
var end;
var userBase = [];
var collection;

var options = {
  dotfiles: 'ignore',
  etag: false,
  extensions: ['htm','html'],
  index: "login.html"
}

app.use(express.json());
app.use(express.urlencoded( { extended:false} ));

app.use('/', express.static('./public_files', options));

app.post('/goToRegister', function(req,res,next){
    res.sendFile(__dirname + "/public_files/register.html");
});

app.post('/login', function(req,res,next){
    var exists = false;
    var account;
    gameModule(undefined, undefined, true);
    MongoClient.connect(url,function(err,db){
        if(err) console.log(err);
        else
        {
            console.log("Connected to db");
            var dbo = db.db(database);
            dbo.collection(req.body.loginUsername).find({}).toArray(function(err, result) {
                if (err) res.sendFile(__dirname + "/private_files/loginFail.html");
                else
                {
                    if(result.length === 0)
                    {
                        res.sendFile(__dirname + "/private_files/loginFail.html");
                    }
                    else if(result[0].password != req.body.loginPassword)
                    {
                        res.sendFile(__dirname + "/private_files/loginFail.html");
                    }
                    else
                    {
                        res.send(`<!DOCTYPE html><html> <head> <title>Assignment 4</title> <meta charset="utf-8" /> <link rel="stylesheet" href="layout.css"> </head> <body> <div id="textDiv"> <h1>Assignment 4</h1> <h4>Paymon Jalali & Oscar Smith-Sieger</h4> <hr> <h2>The Background</h2> <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p> <hr> <h2>The Landing Page</h2> </div> <br> <div class="mainDiv"> <h1 id="loggedInUser">Welcome ` + req.body.loginUsername + `!</h1> <form method="POST" action="startGame"><input type="submit" class="pageButton submit" value="Start Game"><input type="text" name="username" value="${req.body.loginUsername}" style="visibility: hidden; height:0px; width:0px;"></form><br> <button class="pageButton delete">Log Out</button><br><form method="POST" action="/hiscores"><input type="submit" class="pageButton add" value="Hiscores"></form> <h2>Your Stats</h2> <table align="center"> <tr><td><strong>Wins</strong></td><td>` + result[0].wins + `</td></tr> <tr><td><strong>Losses</strong></td><td>` + result[0].losses + `</td></tr> <tr><td><strong>Draws</strong></td><td>` + result[0].draws + `</td></tr> <tr><td><strong>Total Moves</strong></td><td>` + result[0].totalMoves + `</td></tr> </table> </div> </body></html>`);
                    }
                }
                db.close();
            });
        }
    });
});

app.post('/startGame', function(req,res,next){
    // res.sendFile(__dirname + "/private_files/lobby.html");

    let file = fs.readFileSync(__dirname + "/private_files/lobby.html", "utf8");
    let username = req.body.username;
    file += `<div id="username">${username}</div>`;
    file += `</body>`;
    file += `</html>`;
    res.send(file);
    res.end();
});

app.post('/game.html', function(req,res,next){
    res.sendFile(__dirname + "/public_files/game.html")
});

app.post('/register', function(req,res,next){
    var duplicate = false;
    MongoClient.connect(url,function(err,db){
        if(err) console.log(err);
        else
        {
            console.log("Connected to db");
            var dbo = db.db(database);

            dbo.listCollections().toArray(function(err, collections){
                for(p = 1; p < collections.length; p++)
                {
                    if(collections[p].name === req.body.registerUsername)
                    {
                        duplicate = true;
                        break;
                    }
                }

                if(req.body.registerPassword != req.body.registerPasswordConfirm)
                {
                    res.sendFile(__dirname + "/private_files/registerPasswordsNotMatching.html");
                }
                else if(duplicate)
                {
                    //search collections for username if exists sendfile
                    duplicate = false;
                    res.sendFile(__dirname + "/private_files/registerUsernameExists.html");
                }
                else
                {
                    var user = {};
                    user['password'] = req.body.registerPassword;
                    user['email'] = req.body.registerEmail;
                    user['firstName'] = req.body.registerFirstName;
                    user['lastName'] = req.body.registerLastName;
                    user['birthday'] = req.body.registerBirthday;
                    user['gender'] = req.body.registerGender;
                    user['wins'] = 0;
                    user['losses'] = 0;
                    user['draws'] = 0;
                    user['totalMoves'] = 0;
                    user['lastGameTime'] = "";
                    console.log(user);
                    console.log(req.body.registerUsername);

                    dbo.collection(req.body.registerUsername).insert(user,function(err,data){
                        if(err) throw(err);
                        else console.log("sucessfuly inserted");
                        res.sendFile(__dirname + "/private_files/registerSuccess.html");
                    });
                }
                db.close();
            });
        }
    });
});

app.post('/hiscores', function(req,res,next){
    // var table = `<tr><td>Username</td><td>Wins</td><td>Losses</td><td>Draws</td><td>Total Moves</td></tr>`;
    // MongoClient.connect(url,function(err,db){
    //     if(err) console.log(err);
    //     else
    //     {
    //         var current;
    //         console.log("Connected to db");
    //         var dbo = db.db(database);
    //         dbo.listCollections().toArray(function(err, collections){
    //           if(err) res.send("couldnt pull users");
    //           else
    //           {
    //             collections.forEach(function(listItem, index){
    //                 dbo.collection(listItem.name).find({}).toArray(function(err, result) {
    //                     if (err) res.send("failed fetching users");
    //                     else
    //                     {
    //                         if(listItem.name != "system.indexes")
    //                         {
    //                           console.log(listItem.name)
    //                           console.log("wins:", result[0].wins);
    //                           console.log("losses:", result[0].losses);
    //                           console.log("draws:", result[0].draws);
    //                           console.log("totalMoves:", result[0].totalMoves);
    //                           table += `<tr><td>` + listItem.name + `</td><td>` + result[0].wins + `</td><td>` + result[0].losses + `</td><td>` + result[0].draws + `</td><td>` + result[0].totalMoves + `</td></tr>`;
    //                         }
    //                     }
    //                     db.close();
    //                 });
    //             });
    //             res.send(`<!DOCTYPE html><html> <head> <title>Assignment 4</title> <meta charset="utf-8" /> <link rel="stylesheet" href="layout.css"> </head> <body> <div id="textDiv"> <h1>Assignment 4</h1> <h4>Paymon Jalali & Oscar Smith-Sieger</h4> <hr> <h2>The Background</h2> <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p> <hr> <h2>The Hiscores</h2> </div> <br> <div class="mainDiv"> <table align="center">` + table + `</table> </div> </body></html>`)
    //           }
    //         });
    //     }
    // });
    async.waterfall([
        connect,
        getUsers,
        createTable
    ], function (err, results) {
        res.send(`<!DOCTYPE html><html> <head> <title>Assignment 4</title> <meta charset="utf-8" /> <link rel="stylesheet" href="layout.css"> </head> <body> <div id="textDiv"> <h1>Assignment 4</h1> <h4>Paymon Jalali & Oscar Smith-Sieger</h4> <hr> <h2>The Background</h2> <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p> <hr> <h2>The Hiscores</h2> </div> <br> <div class="mainDiv"> <table align="center">` + results + `</table> </div> </body></html>`);
    });
});



function connect(connectCallback)
{
    MongoClient.connect(url,function(err,db){
        if(err) connectCallback(err);
        else
        {
            console.log("Connected to db");
            var dbo = db.db(database);
            connectCallback(null, dbo, db);
        }
    });
}

function getUsers(dbobj, db, getUsersCallback)
{
    dbobj.listCollections().toArray(function(err, collections){
      if(err) res.send("couldnt pull users");
      else
      {
          getUsersCallback(null, collections, dbobj, db)
      }
    });
}

function createTable(users, dbobject, db, createTableCallback)
{
  var table = `<tr><td><strong>Username</strong></td><td><strong>Wins</strong></td><td><strong>Losses</strong></td><td><strong>Draws</strong></td><td><strong>Total Moves</strong></td></tr>`;
  users.forEach(function(listItem, index){
      dbobject.collection(listItem.name).find({}).toArray(function(err, result) {
          if (err) res.send("failed fetching users");
          else
          {
              if(listItem.name != "system.indexes")
              {
                table += `<tr><td>` + listItem.name + `</td><td>` + result[0].wins + `</td><td>` + result[0].losses + `</td><td>` + result[0].draws + `</td><td>` + result[0].totalMoves + `</td></tr>`;
              }
              if(index >= users.length-1)
              {
                db.close();
                createTableCallback(null, table);
              }
          }
      });
  });
}

var server = http.createServer(app);
var socketio = require("socket.io")(server);
var gameModule = require("./gameModule.js");
gameModule(socketio, app);

server.listen(port);
console.log('Server running on port ' + port);

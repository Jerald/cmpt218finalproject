var express = require('express');
var http = require('http');
var fs = require('fs');
var path = require('path');
var app = express();
var MongoClient = require('mongodb').MongoClient;

const port = process.env.PORT || 34416;

const url = 'mongodb://root:root@ds231589.mlab.com:31589/cmpt218asn4';
const database = "cmpt218asn4";

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
                        res.send(`<!DOCTYPE html><html> <head> <title>Assignment 4</title> <meta charset="utf-8" /> <link rel="stylesheet" href="layout.css"> </head> <body> <div id="textDiv"> <h1>Assignment 4</h1> <h4>Paymon Jalali & Oscar Smith-Sieger</h4> <hr> <h2>The Background</h2> <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p> <hr> <h2>The Landing Page</h2> </div> <br> <div class="mainDiv"> <h1>Welcome ` + req.body.loginUsername + `!</h1> <button class="pageButton submit">Start Game</button><br> <button class="pageButton delete">Log Out</button> <h2>Your Stats</h2> <table align="center"> <tr><td><strong>Wins</strong></td><td>` + result[0].wins + `</td></tr> <tr><td><strong>Losses</strong></td><td>` + result[0].losses + `</td></tr> <tr><td><strong>Draws</strong></td><td>` + result[0].draws + `</td></tr> <tr><td><strong>Total Moves</strong></td><td>` + result[0].totalMoves + `</td></tr> </table> </div> </body></html>`);
                    }
                }
                db.close();
            });
        }
    });
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

app.get('/hiscores', function(req,res,next){
    var exists = false;
    var account;
    MongoClient.connect(url,function(err,db){
        if(err) console.log(err);
        else
        {
            var current;
            console.log("Connected to db");
            var dbo = db.db(database);
            dbo.listCollections().toArray(function(err, collections){
              if(err) res.send("couldnt pull users")
              else
              {
                collections.forEach(function(listItem, index){
                    dbo.collection(listItem.name).find({}).toArray(function(err, result) {
                        if (err) res.send("failed fetching users");
                        else
                        {
                            if(listItem.name != "system.indexes")
                            {
                              console.log(listItem.name)
                              console.log("wins:", result[0].wins);
                              console.log("losses:", result[0].losses);
                              console.log("draws:", result[0].draws);
                              console.log("totalMoves:", result[0].totalMoves);
                            }
                        }
                        db.close();
                    });
                });
              }
            });

        }
    });
});

app.listen(port);
console.log('Server running on port ' + port);

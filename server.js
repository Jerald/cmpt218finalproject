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
                        res.send("login success");
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

app.post('/startCheckIn', function(req,res,next){
    console.log(req.body.submitBtn);
    if(req.body.submitBtn == "Start Check-In")
    {
        start = new Date();
        start = start.toTimeString().split(' ')[0]
        activeToken = req.body.checkInID;
        isActive = true;

        console.log("active token:", activeToken, "isActive:", isActive);
        res.send(`<!DOCTYPE html><html> <head> <title>Assignment 3</title> <meta charset="utf-8" /> <link rel="stylesheet" href="layout.css"> </head> <body> <div id="textDiv"> <h1>Assignment 3</h1> <h4>Paymon Jalali (301257435)</h4> <hr> <h2>The Background</h2> <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p> <hr> <h2>The Admin Landing</h2> </div> <br> <p>Please check in now!</p> <p>Check-In ID: ` + req.body.checkInID + `</p> <div class="mainDiv"> <form method='post' action='/cancelCheckIn'> <input type="submit" class="pageButton delete" value="Stop ` + req.body.checkInID +
        ` Check-In"/> </form> </div> </body></html>`);
    }
    else
    {
        mongo.connect(url,function(err,db){
            if(err) console.log(err);
            else
            {
                console.log(req.body.checkInID);
                var dbo = db.db("cmpt218asn3");
                dbo.collection(req.body.checkInID).find({}).toArray(function(err, result) {
                    if (err) res.send("No check-in history found.");
                    else
                    {
                        res.write("Check-in history for: " + req.body.checkInID + "\n\n")
                        for(k = 0; k < result.length; k++)
                        {
                            res.write(result[k].time + " " + result[k].name + " " + result[k].userID + "\n");
                        }
                        res.end();
                        db.close();
                    }
                });
            }
        });
    }

});

app.post('/cancelCheckIn', function(req,res,next){
    end = new Date();
    end = end.toTimeString().split(' ')[0];
    collection = activeToken;
    console.log(userBase);

    if(userBase.length > 0)
    {
        mongo.connect(url,function(err,db){
            if(err) console.log(err);
            else
            {
                console.log("Connected to db");
                var dbo = db.db("cmpt218asn3");
                dbo.collection(collection).insert(userBase,function(err,data){
                    if(err) throw(err);
                    else console.log("sucessfuly inserted");
                    db.close();

                    res.write("Total users checked-in:" + userBase.length + "\n");
                    res.write("\n");
                    res.write("List of users(name, userID):\n");
                    for(j = 0; j < userBase.length; j++) res.write(userBase[j].name + ", " + userBase[j].userID + "\n");
                    res.end();

                    activeToken = "";
                    isActive = false;
                    userBase = [];
                    console.log("Session now inactive.");
                });
            }
        });
    }
    else res.send("No users checked in.");
});

app.post('/checkIn', function(req,res,next){
    if(req.body.checkInString != activeToken)
    {
        res.sendFile(__dirname + "/private_files/checkInNotActive.html");
    }
    else
    {
        var user = {};
        user['time'] = new Date().toTimeString().split(' ')[0];
        user['name'] = req.body.name;
        user['userID'] = req.body.userID;
        userBase.push(user);
        res.send("Thank you for checking in!");
    }
});

app.post('/serveCheckIn', function(req,res,next){
    res.sendFile(__dirname + "/public_files/checkIn.html");
});

app.listen(port);
console.log('Server running on port ' + port);

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

app.listen(port);
console.log('Server running on port ' + port);

'use strict';

const express     = require('express');
const bodyParser  = require('body-parser');
const fccTesting  = require('./freeCodeCamp/fcctesting.js');
const passport    = require('passport');
const session     = require('express-session');
const mongo       = require('mongodb').MongoClient;
const LocalStrategy = require('passport-local');
const bcrypt      = require('bcrypt');
const auth        = require('./auth.js')
const routes      = require('./routes.js')
const GitHubStrategy = require('passport-github');

const app = express();


app.set('view engine','pug')

fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


//To set up your express app to use use the session we'll define just a few basic options.
//Be sure to add 'SESSION_SECRET' to your .env file and give it a random value.
//This is used to compute the hash used to encrypt your cookie!
app.use(session({
  secret: process.env.SECRET_SESSION,
  resave:true,
  saveUninitialized:true
}));


//As well you can go ahead and tell your express app to use
//'passport.initialize()' and 'passport.session()'. 
app.use(passport.initialize());
app.use(passport.session());



//Connect to MongoDB: we want to the connect to our database then start listening for requests
//The purpose of this is to not allow requests before our database is connected or if there is a database error.
//To accomplish you will want to encompass your serialization and your app listener inside mongo.connect(function())
//IMPORTANT: Use Atlas MongoDB Node v2.2 link to connect to the DB
mongo.connect(process.env.DATABASE,(err,db)=>{
  if(err){
    console.log('Database error ' + err);
  }else{
    console.log('Successful database connection');
    

    
    //Import authentincation and routes files
    auth(app,db); 
    routes(app,db);
    
    
    
    // Handling missing pages (404), add after all routes
    app.use((req,res)=>{
      res.status(404)
          .type('text')
          .send('Not found');
    });
    
    
    app.listen(process.env.PORT || 3000, () => {
      console.log("Listening on port " + process.env.PORT);
    });
    
  }
});



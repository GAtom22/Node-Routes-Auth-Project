const passport       = require('passport');
const ObjectID       = require('mongodb').ObjectID;    // use it you call new ObjectID(THE_ID)
const bodyParser     = require('body-parser');
const LocalStrategy  = require('passport-local');
const bcrypt         = require('bcrypt');
const GitHubStrategy = require('passport-github');

    
module.exports = function(app,db){
  
  //We need to have a serialize function and a deserialize function
    //In passport we create these with passport.serializeUser( OURFUNCTION ) and passport.deserializeUser( OURFUNCTION )
    //The serializeUser is called with 2 arguments, the full user object and a callback used by passport.
    //Returned in the callback should be a unique key to identify that user = MongoDB _id
    //Similarly deserializeUser is called with that key and a callback function for passport as well,
    //but this time we have to take that key and return the users full object to the callback.
  passport.serializeUser((user,done)=>{
      done(null, user._id);
    });

    passport.deserializeUser((id,done)=>{
      db.collection('socialusers').findOne(    // check in socialusers
        {_id: new ObjectID(id)},
        (err,doc)=>{ 
          if(doc==null){
            db.collection('users').findOne(      // if not in socialusers, check in users
            {_id: new ObjectID(id)}, (err,doc)=>{done(null,doc)})
          }else{
          done(null,doc) }}
      )
    });


    //Authentication Strategies - Local Strategy
    passport.use(new LocalStrategy(function(username,password,done){
      db.collection('users').findOne({username: username}, function(err, user){
        console.log('User '+username+' attempted to log in.');
        if(err) { return done(err); }
        if(!user){ return done(null,false); }
        if(!bcrypt.compareSync(password, user.password)){ return done(null, false); }
        return done(null,user);
      })
      
    }));
  
  
    //Strategies with OAuth: GitHub
  passport.use(new GitHubStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbarckURL: 'https://equable-chip.glitch.me/auth/github/callback'
    },function(accessToken, refreshToken, profile, cb){
      console.log(profile);
     
    //Database logic with callback containing our user object
    db.collection('socialusers').findAndModify(
      {id: profile.id},
      {},
      {$setOnInsert:{
        id: profile.id,
        name: profile.displayName,
        photo: profile.photos,
        email: profile.emails,
        created_on: new Date(),
        provider: profile.provider
      }, $set: {
        last_login: new Date()
      }, $inc:{
        login_count: 1
      }},
      {upsert: true, new: true},
      (err,doc) =>{
        return cb(null, doc.value);
      }
    );
    
    }
  ));
  
  
};
const bcrypt       = require('bcrypt');
const passport     = require('passport');

module.exports = function(app,db){
  app.route('/')
        .get((req, res) => {
          //res.sendFile(process.cwd() + '/views/index.html');
          // USE ABSOLUTE PATH for the pug file - add process.cwd()
          // Looking at our pug file 'index.pug' included in your project, we used the variables title and message.
          // to pass a value to these variables, pass this object along setting the variables for your index view:
          //{title: 'Hello', message: 'Please login'}
          //add a new variable to the object showLogin: true to show the form in index.pug
          //This form is set up to POST on /login so this is where we should set up to accept the POST and authenticate the user.
         res.render(process.cwd()+'/views/pug/index.pug',{title:'Hello',message:'Please Login', showLogin:true, showRegistration: true});

        });
    

    //Registering the new user, should be as follows:
    //Query database with a findOne command
    //if user is returned then it exists and redirect back to home
    //OR if user is undefined and no error occurs then 'insertOne' into the database with
    //the username and password and as long as no errors occur then call next to go to step 2,
    //authenticating the new user, which we've already written the logic for in our POST /login route.
    app.route('/register')
        .post((req,res,next)=>{
          db.collection('users').findOne({ username:req.body.username }, function(err,user){
            if(err){
              next(err);
            }else if(user){
              res.redirect('/');
            }else{
              // hash the password and send it to DB
              var hash = bcrypt.hashSync(req.body.password, 12);
              db.collection('users').insertOne({
                username: req.body.username,
                password: hash
              }, (err,doc)=>{
                if(err){
                  res.redirect('/');
                }else{
                  next(null,user);
                }
              })
            }
          })  
      },
    passport.authenticate('local', { failureRedirect: '/' }),
    (req, res, next) => {
      res.redirect('/profile');
    });
    

      //How to Use Passport Strategies
    //For this challenge you should add the route /login to accept a POST request. 
    //To authenticate on this route you need to add a middleware to do so before then sending a response.
    //This is done by just passing another argument with the middleware before your function(req,res) with your response!
    //The middleware to use is passport.authenticate('local').
    app.route('/login')
        .post(passport.authenticate('local', {failureRedirect: '/'}),(req,res)=>{
            res.redirect('/profile');
          });


    //As in, any user can just go to /profile whether they authenticated or not by typing in the url. 
    //We want to prevent this by checking if the user is authenticated first before rendering the profile page. 
    //This is the perfect example of when to create a middleware.
    //The challenge here is creating the middleware function ensureAuthenticated(req, res, next), 
    //which will check if a user is authenticated by calling passports isAuthenticated on the request which in turn checks for req.user is to be defined. 
    //If it is then next() should be called, otherwise we can just respond to the request with a redirect to our homepage to login.    
    function ensureAuthenticated(req,res,next){
      if(req.isAuthenticated()){
        return next();
      }
      res.redirect('/');
    };

    app.route('/profile')
        .get(ensureAuthenticated,(req,res)=>{
          res.render(process.cwd()+'/views/pug/profile.pug', {username: req.user.username})
        });



    //The route should just unauthenticate the user and redirect to the home page instead of rendering any view.
    app.route('/logout')
        .get((req,res)=>{
          req.logout();      //In passport, unauthenticating a user is as easy as just calling req.logout(); 
          res.redirect('/');
        });
  
  
  
  //Strategies with OAuth: GitHub
      app.route('/auth/github')
          .get(passport.authenticate('github'));
  
      app.route('/auth/github/callback')
        .get(passport.authenticate('github', {failureRedirect: '/'}),(req,res)=>{
            res.redirect('/profile');
          });
  
  
};
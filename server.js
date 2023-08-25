const express = require('express');
const app = express()
const { pool } = require("./dbConfig"); //imports the pool object from the dbConfig.js file.
const bcrypt = require('bcrypt');  //imports the bcrypt module from the Node.js package manager
const session = require("express-session");
const flash = require("express-flash");
const passport = require('passport');

const initializePassport = require("./passportConfig");
initializePassport(passport);


const PORT = process.env.PORT || 4000;

app.set("view engine", "ejs");   //middleware
app.use(express.urlencoded({extended : false})); //parses incoming requests with URL-encoded payloads.
app.use(session({
  secret:'secret',        //to specify the secret that is used to encrypt the session data.
  resave: false,  //to specify whether the session data should be saved every time the user makes a request.
  saveUninitialized:false // to specify whether the session data should be saved even if it has not been modified.
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());



app.get('/', (req,res) => {
  res.render("index");
});

app.get('/users/register', checkAuthenticated, (req,res)=>{
  res.render("register");
});

app.get('/users/login', checkAuthenticated, (req,res)=>{
  res.render("login");
});

app.get('/users/dashboard', checkNotAuthenticated, (req,res)=>{
  res.render("dashboard", { user: req.user.name});
});

app.get('/users/logout', (req, res)=>{
  req.logOut;
  req.flash("success_msg", "You have been successfully logged out.");
  res.redirect("/users/login");
});

app.post('/users/register', async (req,res)=> {
    let { name, email, password, password2 } = req.body;

    

    console.log({
      name, email, password, password2
    });

    let errors = [];

    if(!name || !email || !password || !password2){
      errors.push({message: "Please enter all fields"});
    }
    if(password.length < 6){
      errors.push({message: "Password should be atleast six characters."});
    }
    if(password != password2){
      errors.push({message: "Passwords do not match."});
    }
    if(errors.length > 0){
      res.render("register", { errors });
    }else{                          
      //form validation has been passed.
      let hashedPassword = await bcrypt.hash(password,10);
      console.log(hashedPassword);

      pool.query(
        //query a database for users whose email address matches the value of the email variable.
        `SELECT * FROM users WHERE email = $1`, [email], (err, results)=>{
          if (err){
            throw err;
          }
          console.log(results.rows);
          if(results.rows.length > 0){
            errors.push({message:"Email already registered."});
            res.render("register", { errors }); 
          }else{
            pool.query(
              `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id , password`, [name, email, hashedPassword], (err, results)=>{
                if(err){
                  throw err
                }
                console.log(results.rows);
                req.flash('success_msg', "You are now registered. Please Login.");
                res.redirect('/users/login');
              }
            );
          }
        }
      )
    }

});

app.post('/users/login',passport.authenticate('local', {
  successRedirect:'/users/dashboard',
  failureRedirect: '/users/login',
  failureFlash: true
}));


//if authenticated, gives access to the dashboard.
function checkAuthenticated(req,res,next){
    if(req.isAuthenticated()){           
      return res.redirect("/users/dashboard")
    }
    next();    //used to pass control to the next middleware in a middleware chain.
}

//if not authenticated,redirect to the login page. Restricts forced browsing.
function checkNotAuthenticated(req,res,next){           
  if(req.isAuthenticated()){
    return next();
  }
    res.redirect('/users/login');
}

app.listen(PORT, ()=>{
  console.log(`Server running on port ${PORT}`);
});
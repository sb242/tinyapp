//required packages
const morgan = require("morgan");
const express = require("express");
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");

//server setup
const app = express();
const PORT = 8080; // default port 8080
app.set("view engine", "ejs"); //set view engine

//Middleware
app.use(morgan('dev'));
app.use(cookieSession({
  name: 'session',
  keys: ['secretKey'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(express.urlencoded({ extended: true })); //middleware used for translating sent data into readable code, from a buffer(not human readable) to string

//global helper functions
const { getUserByEmail, urlsForUser, generateRandomString } = require('./helpers');

//url and user databases
const urlDatabase = {};
const users = {};

//get methods
app.get("/", (req, res) => {
  const userID = req.session.userID;

  if (userID) {
    res.redirect("/urls");
    return;
  }
  
  res.redirect("/login");
});

app.get("/urls", (req, res) => {
  const userID = req.session.userID;
  const userURLS = urlsForUser(userID, urlDatabase);
  
  if (!userID) {
    res.redirect("/login");
    return;
  }

  const templateVars = { userURLS, users, userID };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const userID = req.session.userID;

  if (!userID) {
    res.redirect("/login");
    return;
  }

  const templateVars = { users, userID };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const id = req.params.id;
  const userID = req.session.userID;
  const longURL = urlDatabase[id].longURL;
  
  if (!userID) {
    res.redirect("/login");
    return;
  }

  if (!urlDatabase[id]) {
    res.send("URL does not exist");
    return;
  }

  if (urlDatabase[id].userID !== userID) {
    res.send("That URL does not belong to you");
    return;
  }

  const templateVars = { id, longURL, users, userID };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const id = req.params.id;
  const longURL = urlDatabase[id].longURL;

  if (!longURL) {
    res.send("The tinyapp id you're lookin for does not exist");
    return;
  }

  res.redirect(longURL);
});

app.get("/login", (req, res) => {
  const userID = req.session.userID;

  if (userID) {
    res.redirect("/urls");
    return;
  }

  const templateVars = { users, userID };
  res.render("login", templateVars);
});

app.get("/register", (req, res) => {
  const userID = req.session.userID;
  
  if (userID) {
    res.redirect("/urls");
    return;
  }

  const templateVars = { users, userID };
  res.render("register", templateVars);
});

//post methods
app.post("/urls", (req, res) => {
  const userID = req.session.userID;
  const longURL = req.body.longURL;
  const randomString = generateRandomString();
  
  if (!userID) {
    res.send("Error: You cannot POST to shorten URLS because you are not logged in.");
    return;
  }
  
  urlDatabase[randomString] = {longURL, userID};
  res.redirect(`/urls/${randomString}`);
});

app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const userID = req.session.userID;
  const newURLName = req.body.newURLName;

  if (!urlDatabase[id]) {
    res.send("That URL id does not exist");
    return;
  }
  if (!userID) {
    res.send("You are not logged in.");
    return;
  }
  if (urlDatabase[id].userID !== userID) {
    res.send("You do not own this URL.");
    return;
  }

  urlDatabase[id].longURL = newURLName;
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  const userID = req.session.userID;

  if (!urlDatabase[id]) {
    res.send("That URL id does not exist");
    return;
  }
  if (!userID) {
    res.send("You are not logged in.");
    return;
  }
  if (urlDatabase[id].userID !== userID) {
    res.send("You do not own this URL.");
    return;
  }

  delete urlDatabase[id];
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const userByEmail = getUserByEmail(email, users);

  if (userByEmail) {
    if (!bcrypt.compareSync(password, userByEmail.hashedPassword)) {
      res.statusCode = 403;
      return res.send("Error: 403, invalid login information");
    }
    req.session.userID = userByEmail.ID;
    // res.cookie('userID', users[id].ID);
    res.redirect('/urls');
    return;
  }

  res.statusCode = 403;
  res.send("Error: 403, invalid login information");
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const ID = generateRandomString();
  const userByEmail = getUserByEmail(email, users);

  if (!email || !password) {
    res.statusCode = 400;
    res.send("Error 400, email or password fields are empty");
    return;
  }

  if (userByEmail) {
    res.statusCode = 400;
    res.send("Error 400, email already exists in our database");
    return;
  }

  users[ID] = { ID, email, hashedPassword };
  req.session.userID = ID;
  res.redirect("/urls");
});

//listener
app.listen(PORT, () => {
  console.log(`TinyApp app listening on port ${PORT}!`);
});
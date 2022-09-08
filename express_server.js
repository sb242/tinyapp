const morgan = require("morgan");
const express = require("express");
const cookieParser = require('cookie-parser');

const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs"); //set view engine

/*----<Middleware>----*/
app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true })); //middleware used for translating sent data into readable code, from a buffer(not human readable) to string

const generateRandomString = () => {
  const randomString = (Math.random() + 1).toString(36).substring(6);
  return randomString;
}

const urlsForUser = (id) => {
  const userURLS = {};
  for(let element in urlDatabase) {
    if(urlDatabase[element].userID === id) {
      userURLS[element] = urlDatabase[element];
    }
  }
  return userURLS;
}

const urlDatabase = {};
const users = {};

app.get("/", (req, res) => {
  if(req.cookies["userID"]) {
    res.redirect("/urls");
    return;
  }
  res.redirect("/login");
});

app.get("/urls", (req, res) => {
  const userID = req.cookies["userID"];
  const userURLS = urlsForUser(userID);
  
  if(!userID) {
    res.redirect("/login");
  }

  console.log("userURLS", userURLS);
  const templateVars = { urls: userURLS, users: users, user: userID };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if(!req.cookies["userID"]) {
    res.redirect("/login");
    return;
  }
  const templateVars = { users: users, user: req.cookies["userID"] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const id = req.params.id;
  
  if(!req.cookies["userID"]) {
    res.redirect("/login");
    return;
  }

  if(!urlDatabase[id]) {
    res.send("URL does not exist")
    return;
  }

  if(urlDatabase[id].userID !== req.cookies["userID"]) {
    res.send("That URL does not belong to you");
    return;
  }

  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id].longURL, users: users, user: req.cookies["userID"] };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;

  if(!longURL) {
    res.send("The tinyapp id you're lookin for does not exist");
    return;
  }
  res.redirect(longURL);
})

app.get("/login", (req, res) => {
  const userID = req.cookies["userID"]
  if(userID) {
    res.redirect("/urls");
    return;
  }
  const templateVars = { urls: urlDatabase, users: users, user: userID };
  res.render("login", templateVars);
})

app.get("/register", (req, res) => {
  if(req.cookies["userID"]) {
    res.redirect("/urls");
    return;
  }
  const templateVars = { urls: urlDatabase, users: users, user: req.cookies["userID"] };
  res.render("urls_register", templateVars);
});

app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const userID = req.cookies["userID"];

  if(!urlDatabase[id]) {
    res.send("That URL id does not exist");
    return;
  }
  if(!userID) {
    res.send("You are not logged in.");
    return;
  }
  if(urlDatabase[id].userID !== userID) {
    res.send("You do not own this URL.");
    return;
  }

  urlDatabase[req.params.id].longURL = req.body.newURLName;
  res.redirect("/urls");
});

app.post("/urls/:id/delete", (req, res) => {
  const id = req.params.id;
  const userID = req.cookies["userID"];

  if(!urlDatabase[id]) {
    res.send("That URL id does not exist");
    return;
  }
  if(!userID) {
    res.send("You are not logged in.");
    return;
  }
  if(urlDatabase[id].userID !== userID) {
    res.send("You do not own this URL.");
    return;
  }

  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  if(!req.cookies["userID"]) {
    res.send("Error: You cannot POST to shorten URLS because you are not logged in.");
    return;
  }
  console.log(req.body); // Log the POST request body to the console
  const randomString = generateRandomString();
  urlDatabase[randomString] = {longURL: req.body.longURL, userID: req.cookies["userID"]};
  console.log(urlDatabase);
  res.redirect(`/urls/${randomString}`); // Respond with 'Ok' (we will replace this)
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  
  for(let id in users) {
    if(users[id].email === email) {
      if(users[id].password !== password) {
        res.statusCode = 403;
        return res.send("Error: 403, invalid login information");
      }
      res.cookie('userID', users[id].ID);
      res.redirect('/urls');
      return;
    }
  }
  res.statusCode = 403;
  res.send("Error: 403, invalid login information");
})

app.post("/logout", (req, res) => {
  res.clearCookie("userID");
  res.redirect("/urls");
})

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if(email === "" || password === "") {
    res.statusCode = 400;
    return res.send("Error 400, email or password fields are empty");
  }
  for(let id in users) {
    if(users[id].email === email) {
      res.statusCode = 400;
      return res.send("Error 400, email already exists in our database");
    }
  }
  const ID = generateRandomString();
  users[ID] = { ID, email, password };
  res.cookie('userID', ID);
  console.log(users);
  res.redirect("/urls");
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
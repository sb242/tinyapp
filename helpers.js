const getUserByEmail = (email, database) => {
  for (let id in database) {
    if (database[id].email === email) {
      return database[id];
    }
  }
};

const urlsForUser = (id, urlDatabase) => {
  const userURLS = {};
  for (let element in urlDatabase) {
    if (urlDatabase[element].userID === id) {
      userURLS[element] = urlDatabase[element];
    }
  }
  return userURLS;
};

const generateRandomString = () => {
  const randomString = (Math.random() + 1).toString(36).substring(6);
  return randomString;
};

module.exports = { getUserByEmail, urlsForUser, generateRandomString };
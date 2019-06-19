const Account = require('../models/accounts');
const jwt = require('jwt-simple');

function tokenForUser(user) {
  // common to encode user id because it won't change, sub=subject, iat=issued at time
  const timestamp = new Date().getTime();
  return jwt.encode({sub: user.id, iat: timestamp}, process.env.SECRET); 
}

module.exports.signup = function (req, res, next) {
  const username = req.body.username
  const email = req.body.email
  const password = req.body.password
  // check if user already exists, otherwise create
  Account.findOrCreate({where: {email: email}, defaults: {
    email: email,
    username: username,
    password: password,
    balance: '0.0'
  }})
  .then(([user, created]) => {
      if (created) {
        return res.json({token: tokenForUser(user)});
      } else {
        return res.status(422).send({error: "username in use"});
      }
  })
  .catch(err => next(err))
}

// already authed just make a token with user id
module.exports.signin = function(req, res, next) {
  // REMEMBER passport done is called with the authed user object, since passport is
  // middleware it adds this object to req.user
  res.json({token:tokenForUser(req.user)});
};
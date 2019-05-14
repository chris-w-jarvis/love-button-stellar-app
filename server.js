// // server.js
// // where your node app starts

// // init project
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
require('dotenv').config()
const viewController = require('./controllers/view-controller')

const Auth = require('./controllers/authentication');
// this code just needs to run, its not used in this file but it sets up passport
// run before api router imports passport
const PassportService = require('./services/passport');

const Api = require('./api-router')

const passport = require('passport');

// setup passport, token not session (cookie) based
const requireAuth = passport.authenticate('jwt', {session: false, failureRedirect: "/login"});
const requireSignin = passport.authenticate('local', {session: false});

// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// VIEWS
app.get('/', function(req, res) {
  res.redirect('/about')
})
app.get('/about', function(req, res) {
  res.redirect('https://love-button.launchaco.com/')
})

app.get('/getStellarLumens', function(req, res) {
  res.sendFile(__dirname + '/views/getStellarLumens.html')
})

app.get('/getStartedCreators', function(req, res) {
  res.sendFile(__dirname + '/views/getStartedCreators.html')
})

app.get('/get-my-link/premium', function(req, res) {
  res.send("Not setup yet, email me at chris.at.love.button@gmail.com")
})

app.get('/login', function(req, res) {
    res.send("Login page")
})

app.get('/get-my-link', function(request, response) {
  response.sendFile(__dirname + '/views/getLink.html');
});

// TODO: remove
app.get('/userId', requireAuth, function(req, res) {
    res.send({id: req.user.accountBalanceId})
})

// render html for each url on /pages
app.get('/pages/:pageId', viewController)

// passport checks for correct username and password before auth controller gives you a token
app.post('/auth/signin', requireSignin, Auth.signin);
app.post('/auth/signup', Auth.signup);

// send all other requests to api router
Api(app)

// app.get('/get-my-link', function(req, res) {
//   res.send('getmy link')
// })

// turn on transaction listener
const stellarAccountListener = require('./listeners/fund-account-listener')

// listen for requests :)
const listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});

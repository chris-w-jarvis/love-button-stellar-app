// // server.js
// // where your node app starts

// // init project
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
require('dotenv').config()
const viewController = require('./controllers/view-controller')
const recoveryController = require('./controllers/recoveryController')
const validationService = require('./services/validations')

const Auth = require('./controllers/authentication');
// this code just needs to run, its not used in this file but it sets up passport
// run before api router imports passport
const PassportService = require('./services/passport');

const Api = require('./api-router')

const passport = require('passport');

// setup passport, token not session (cookie) based
const requireAuth = passport.authenticate('jwt', {session: false, failureRedirect: "/login"});
const requireSignin = passport.authenticate('local', {session: false});

// General Rate Limiter
const rateLimit = require("express-rate-limit")
const RedisStore = require("rate-limit-redis")
var Redis = require('ioredis')
var client = new Redis(process.env.REDIS_URL)
 

app.enable("trust proxy"); // only if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
 
const generalLimiter = rateLimit(
  {
    store: new RedisStore({
      client: client,
      prefix: 'grl'
    }),
    max: 60,
    message: "General rate limiter: 60 times per minute."
  }
);
 
//  apply to all requests
app.use(generalLimiter);

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

app.get('/fundMyAccount', function(req, res) {
  res.sendFile(__dirname + '/views/fundAccount.html')
})

app.get('/login', function(req, res) {
    res.sendFile(__dirname + '/views/login.html')
})

app.get('/signup', function(req, res) {
  res.sendFile(__dirname + '/views/signup.html')
})

app.get('/account', function(req, res) {
  res.sendFile(__dirname + '/views/account.html')
})

app.get('/accountRecovery', function(req, res) {
  res.sendFile(__dirname + '/views/accountRecovery.html')
})

app.get('/get-my-link', function(request, response) {
  response.sendFile(__dirname + '/views/getLink.html');
})

// render html for each url on /give
app.get('/give/:pageId', viewController)

// render html for recovery url
app.get('/reset/:token', recoveryController.renderPage)

// passport checks for correct username and password before auth controller gives you a token
app.post('/auth/signin', validationService.trim, requireSignin, Auth.signin);
app.post('/auth/signup', validationService.trim, validationService.signUp, Auth.signup);

// send all other requests to api router
Api(app)

// turn on transaction listener
const stellarAccountListener = require('./listeners/fund-account-listener')

// listen for requests :)
const listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});
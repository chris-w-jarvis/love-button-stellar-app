// // server.js
// // where your node app starts

// // init project
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const compression = require('compression')
const logger = require('./services/winston-logger')

require('dotenv').config()
const viewController = require('./controllers/view-controller')
const recoveryController = require('./controllers/recoveryController')
const validationService = require('./services/validations')

const Auth = require('./controllers/authentication');
// this code just needs to run, its not used in this file but it sets up passport
// run before api router imports passport
require('./services/passport');

const Api = require('./api-router')

const passport = require('passport');

// setup passport, token not session (cookie) based
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
app.use(compression())

// Setup template engine
const Mustache = require('mustache-express')
app.engine('html', Mustache())
app.set('views', __dirname + '/views')
app.set('view engine', 'html')

// VIEWS
app.get('/', function(req, res) {
  res.redirect('/about')
})
app.get('/about', function(req, res) {
  res.redirect('https://love-button.launchaco.com/')
})

app.get('/getStellarLumens', function(req, res) {
  res.render('getStellarLumens')
})

app.get('/getStartedCreators', function(req, res) {
  res.render('getStartedCreators')
})

app.get('/get-my-link/premium', function(req, res) {
  res.send("Not setup yet, email me at chris.at.love.button@gmail.com")
})

app.get('/fundMyAccount', function(req, res) {
  res.render('fundAccount')
})

app.get('/login', function(req, res) {
  res.render('login')
})

app.get('/signup', function(req, res) {
  res.render('signup')
})

app.get('/account', function(req, res) {
  res.render('account')
})

app.get('/accountRecovery', function(req, res) {
  res.render('accountRecovery')
})

app.get('/get-my-link', function(req, res) {
  res.render('getLink');
})

// render html for each url on /give
app.get('/give/:pageId', viewController)

// render html for recovery url
app.get('/reset/:token', recoveryController.renderPage)

// passport checks for correct username and password before auth controller gives you a token
app.post('/auth/signin', validationService.preSignin, requireSignin, Auth.signin);
app.post('/auth/signup', validationService.preSignup, validationService.signUp, Auth.signup);

// send all other requests to api router
Api(app)

// turn on transaction listener
require('./listeners/fund-account-listener')

// listen for requests :)
const listener = app.listen(process.env.PORT, function() {
  logger.log('info','Your app is listening on port '+ listener.address().port);
});
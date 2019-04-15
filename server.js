// server.js
// where your node app starts

// init project
require('dotenv').config()
const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const Model = require('./models/pages')
const viewController = require('./controllers/view-controller')
const Api = require('./api-router')

// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// Rate limiter
const rateLimit = require("express-rate-limit")
const RedisStore = require("rate-limit-redis")
var Redis = require('ioredis')
var client = new Redis(process.env.REDIS_URL)
 
app.enable("trust proxy"); // only if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
 
const generalLimiter = rateLimit(
  {
    store: new RedisStore({
      client: client
    }),
    windowMs: 60000, // 1 minute window
    max: 20, // start blocking after 20 requests
    message: "You can only hit this service 20 times per minute, this is to prevent money laundering."
  }
);
 
//  apply to all requests
app.use(generalLimiter);

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
  res.send("Not setup yet, email me at chris.at.love.button@gmail.com , it'll cost 10$")
})

app.get('/get-my-link', function(request, response) {
  response.sendFile(__dirname + '/views/getLink.html');
});

// render html for each url on /pages
app.get('/pages/:pageId', viewController)

// send all other requests to api router
Api(app)

// listen for requests :)
const listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});

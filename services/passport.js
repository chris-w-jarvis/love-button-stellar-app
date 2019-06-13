const passport = require('passport');
const Account = require('../models/accounts');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const LocalStrategy = require('passport-local');

// passport strategy (JwtStrategy) verify with username/pw
// passport strategy (ExtractJwt) verify with JWT
// passport strategy (local) authenticate with username and password (using bcrypt as middleware)

const localOptions = {
  usernameField: 'email',
  passwordField: 'password',
  session: false
}

const localLogin = new LocalStrategy(localOptions, function(email, password, done) {
    // verify, call done with user or call done with false
    Account.findOne({where: {email: email}}).then(account => {
      if (!account) return done(null, false);
      // compare passwords using bcrypt underneath
      return account.comparePassword(password, function(err, isMatch) {
        if (err) { return done(err); }
        if (!isMatch) { return done(null, false); }
  
        return done(null, account);
      });
    })
    .catch(err => done(err, false))
  });

  // setup options, we need to tell passport where to look for and how to decode jwt
const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromHeader('authorization'), // look for token in header 'authorization' (even if header starts with capital A
    secretOrKey: process.env.SECRET // what to decode with
  };
  
  // create strategy
  // passport runs this strategy when req contains a jwt (token property im guessing)
  // payload is the decoded jwt (which will have the sub (user id) and iat)
  const jwtLogin = new JwtStrategy(jwtOptions, function (payload, done) {
    // see if user id payload exists, if so call done with user object
    Account.findByPk(payload.sub).then(user => {
      if (user) return done (null, user); // authed
      return done(null, false); // not err, just not authed
    })
    .catch(err => {
        return done(err, false); // db error, not authed
    })
  });
  
  // give strategy to passport
  passport.use(jwtLogin);
  passport.use(localLogin);
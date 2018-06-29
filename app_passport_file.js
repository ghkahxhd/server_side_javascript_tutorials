var express = require('express');
var session = require('express-session');
var FileStore = require('session-file-store')(session);
var bodyParser = require('body-parser');
var bkfd2Password = require('pbkdf2-password');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var hasher = bkfd2Password();

var app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({
  secret: 'asdfu13ujk@!3',
  resave: false,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/count', function(req, res) {
  if(req.session.count) {
    req.session.count++;
  } else {
    req.session.count = 1;
  }
  res.send('count : '+req.session.count);
});

app.get('/auth/logout', function(req, res) {
  req.logout();
  req.session.save(function() {
    res.redirect('/welcome');
  });
});
app.get('/welcome', function(req, res) {
  if(req.user && req.user.displayName) {
    res.send(`
      <h1>Hello, ${req.user.displayName}</h1>
      <a href="/auth/logout">logout</a>
    `);
  } else {
    res.send(`
      <h1>Welcome</h1>
      <ul>
        <li><a href="/auth/login">Login</a></li>
        <li><a href="/auth/register">Register</a></li>
      </ul>
    `);
  }
});

var salt = 'asdf123sdaasdf';
var users = [
  {
    username: 'ghkahxhd',
    password: '7tH4WYL5tApbCZLzj2xKgV8N9IgMniomu546A68gs27JoBIbUX1lBJZmUIf08WjHa0zGu8iXHoTS7Hy6d7xOSfbllCf+nyF/dH0gkaFv7HWZCEld+iPNWtt+c64tKP508DCTQqWtS2YMsnjTGcnzRLdzzoIiGfhcnaBXtUqwrFE=',
    salt: 'ArqzFcX2q8VAICfPxD5dhQW+HklTYXmr8+I4x7676uWSJkvk7x+ZeWv61D1F65+CG5Aph4t9geJeo1WxLu4/Dg==',
    displayName: 'Ghkahxhd'
  },
  {
    username: 'ahrwkrn',
    password: 'ii7YNUE8RJ8pBWNTHsQdB1MO2U86YF+dT6MuWW8bj/0/OZsfkwnFdp3BM6X/xwQFHDNqYA5rZSNhbPA2VzhuAb/YHWuT9IlLt01I1V6I3p5JXBhbi1a/RQxbUNDJUHpnzGxcunqhpImGXxphlVdMT7M9j6HTxaojF8c1Pq6O0XE=',
    salt: 'iusIrASqtPHSYOioFNr0vYAeFGb7OpsjVv2SIEir6BZAhp8bS90p3PB4JYzMHaebgT2Q7jAJJVX/Gn0IXnMqZQ==',
    displayName: 'Ahrwkrn'
  }
];

app.post('/auth/register', function(req, res) {
  hasher({password:req.body.password}, function(err, pass, salt, hash) {
    var user = {
      username: req.body.username,
      password: hash,
      salt: salt,
      displayName: req.body.displayName
    };
    users.push(user);
    req.login(user, function(err) {
      req.session.save(function() {
        res.redirect('/welcome');
      });
    });
  });
});
app.get('/auth/register', function(req, res) {
  var output = `
    <h1>Register</h1>
    <form action="/auth/register" method="post">
      <p>
        <input type="text" name="username" placeholder="username">
      </p>
      <p>
        <input type="password" name="password" placeholder="password">
      </p>
      <p>
        <input type="text" name="displayName" placeholder="displayName">
      </p>
      <p>
        <input type="submit">
      </p>

    </form>
  `;
  res.send(output);
});

passport.serializeUser(function(user, done) {
  console.log('serializeUser', user);
  done(null, user.username);
});
passport.deserializeUser(function(id, done) {
  console.log('deserializeUser', id);
  for(var i=0; i<users.length; i++) {
    var user = users[i];
    if(user.username === id) {
      return done(null, user);
    }
  }
});
passport.use(new LocalStrategy(
  function(username, password, done) {
      var uname = username;
      var pwd = password;
      for(var i=0; i<users.length; i++) {
        var user = users[i];
        if(uname === user.username) {
          return hasher({password:pwd, salt:user.salt}, function(err, pass, salt, hash) {
            if(hash === user.password) {
              console.log('LocalStrategy', user);
              done(null, user);
            } else {
                done(null, false, {message: 'Incorrect password'});
            }
          });
        }
      }
      done(null, false, {message: 'Incorrect username'});
  }
));
app.post('/auth/login', passport.authenticate(
    'local',
    {
      successRedirect: '/welcome',
      failureRedirect: '/auth/login',
      failureFlash: false
    }
  )
);

app.get('/auth/login', function(req, res) {
  var output = `
    <h1>Login</h1>
    <form action="/auth/login" method="post">
      <p>
        <input type="text" name="username" placeholder="username">
      </p>
      <p>
        <input type="password" name="password" placeholder="password">
      </p>
      <p>
        <input type="submit">
      </p>

    </form>
  `;
  res.send(output);
})

app.listen(3003, function(){
  console.log('Connected 3003 port!');
});

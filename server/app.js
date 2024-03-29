const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const bodyParser = require('body-parser');
const Auth = require('./middleware/auth');
const cookieParser = require('./middleware/cookieParser');
const models = require('./models');

const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(cookieParser);
app.use(Auth.createSession);

app.get('/', 
  (req, res) => {
    res.render('index');
  });

app.get('/create', 
  (req, res) => {
    res.render('index');
  });

app.get('/links', 
  (req, res, next) => {
    models.Links.getAll()
      .then(links => {
        res.status(200).send(links);
      })
      .error(error => {
        res.status(500).send(error);
      });
  });

app.post('/links', (req, res, next) => {
  var url = req.body.url;
  if (!models.Links.isValidUrl(url)) {
    // send back a 404 if link is not valid
    return res.sendStatus(404);
  }

  return models.Links.get({ url })
    .then(link => {
      if (link) {
        throw link;
      }
      return models.Links.getUrlTitle(url);
    })
    .then(title => {
      return models.Links.create({
        url: url,
        title: title,
        baseUrl: req.headers.origin
      });
    })
    .then(results => {
      return models.Links.get({ id: results.insertId });
    })
    .then(link => {
      throw link;
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(link => {
      res.status(200).send(link);
    });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/
app.get('/login', (req, res) => {
  res.render('login.ejs');
});
app.get('/signup', (req, res) => {
  res.render('signup.ejs');
});

app.post('/signup', (req, res, next) => {
  // Check if the user exists, if it does not 
  // go ahead and create a new user record
  // and then redirect to index or sign up page
  
  models.Users.get({
    username: req.body.username
  }).then(user => {
    if (user) {
      throw false; // User exists
    }
  
    return models.Users.create(req.body);
  }).then( id => {
    var tempReq = req;
    var tempRes = res;
    // TODO: We can get the session hash here, we want to assign the new user ID to this session right here.
    throw true;
  }).catch(result => {
    if (result) {
      res.redirect('/');
    } else {
      res.redirect('/signup');
    }
  });
});

app.post('/login', (req, res, next) => {
  //check if user exists
  // check password
  // redirect to index or login page
  models.Users.get({
    username: req.body.username
  }).then(user => {
    if (!user) {
      throw false;
    } 
    throw models.Users.compare(req.body.password, user.password, user.salt);
  }).catch(result => {
    if (result) {
      res.redirect('/');//index?
    } else {
      res.redirect('/login');
    }
  });
});

// TODO: Create logout GET endpoint, which will assign the cookie a new session ID.


/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res, next) => {

  return models.Links.get({ code: req.params.code })
    .tap(link => {

      if (!link) {
        throw new Error('Link does not exist');
      }
      return models.Clicks.create({ linkId: link.id });
    })
    .tap(link => {
      return models.Links.update(link, { visits: link.visits + 1 });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error(error => {
      res.status(500).send(error);
    })
    .catch(() => {
      res.redirect('/');
    });
});

module.exports = app;

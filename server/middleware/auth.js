const models = require('../models');
const Promise = require('bluebird');

// Helper function to create a new session and to set the request and response.
// TODO: Associate a userID IF the user is logged in, depending on the current endpoint.
var newSessionPromise = function(req, res, next) {
  return models.Sessions.create() //create session
    .then(result => {
      
      // We want to get the hash so use the insert ID
      return models.Sessions.get({id: result.insertId});
    })
    .then(session => {
      var hash = session.hash;
      req.cookies['shortlyid'] = {value: hash};
      req.session = {hash};
      res.cookies = req.cookies; // Shallow copy, if bugs occur, copy the cookies object
      res.cookie('shortlyid', hash); // Also call res.cookie() so that the cookies may be found
      next();
    });
};

module.exports.createSession = (req, res, next) => {
  if (Object.keys(req.cookies).length === 0) { //if object is cookies object is empty
    newSessionPromise(req, res, next);
  } else {
    // got an id. Note that in request cookies it is not in a value property
    var hash = req.cookies.shortlyid;
    // id in DB
    models.Sessions.get({hash})
      .then(session => {
        if (session) {
          req.session = session;
          next();
        } else {
          newSessionPromise(req, res, next);
        }
      });
  }
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/


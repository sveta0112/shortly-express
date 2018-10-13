const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  //models.Users.get(id: req.body.id)
  //models.Sessions.create();
  var cookies = req.cookies; //cookies object
  if (Object.keys(cookies).length === 0) { //if object is cookies object is empty
    models.Sessions.create() //create body
      .then(result => {
        
        // We want to get the hash so use the insert ID
        return models.Sessions.get({id : result.insertId});
      })
      .then(session => {
        var hash = session.hash;
        cookies['shortlyid'] = {value: hash};
        res.cookies = cookies;
        req.session = {hash};
        next();
      });
  }
};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/


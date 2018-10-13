var cookie = require('cookie');
const parseCookies = (req, res, next) => {
  // get req.headers.cookies
  // parse into object unless there is no cookie
  var cookies = req.headers.cookie;
  req.cookies = cookies ? cookie.parse(cookies) : {};
  next();
};

module.exports = parseCookies;
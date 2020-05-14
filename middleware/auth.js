const jwt = require("jsonwebtoken");
const config = require("config"); // need secret from config

// middleware used passport before
// access to req and res cycle objects next moves on to the next piece of middleware

module.exports = function (req, res, next) {
  //Get token from header
  const token = req.header("x-auth-token"); // header key token is in

  //check if no token
  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  //Verify Token
  try {
    const decoded = jwt.verify(token, config.get("jwtSecret"));
    req.user = decoded.user; // user is in the payload of the token
    next();
  } catch (err) {
    res.status(401).json({ msg: "Invalid token" });
  }
}; //middle ware request

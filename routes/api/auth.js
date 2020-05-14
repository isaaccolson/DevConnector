const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const User = require("../../models/User");
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const config = require("config");
const bcrypt = require("bcryptjs");
const HOUR = 360000; //3600

// @route Get api/auth
// @desc Test route
// @acess Private...
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
}); //Protected: want to use auth add it in as a parameter

// @route   POST api/auth
// @desc    Auth user get token. Login...
// @acess   Public
router.post(
  "/",
  [
    check("email", "Include a vailed Email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  async (req, res) => {
    // need to label this async to use the try catch...
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      let user = await User.findOne({ email }); //gives us a promise back
      // see if user exists && match the user and password with bcrypt
      if (!user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid Credentials" }] }); // we want an array of errors to match the other error message up top
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(400)
          .json({ errors: [{ msg: "Invalid Credentials" }] }); // we want an array of errors to match the other error message up top
      }
      //create payload for user id
      const payload = {
        user: {
          id: user.id, // use abstraction so don't need to do _id for the mango db
        },
      };

      //sign token, pass in payload secret and expiration. call back get err or token. send token to client
      jwt.sign(
        payload,
        config.get("jwtSecret"),
        { expiresIn: HOUR },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      ); //needs a secret put it in config. optional option expires in
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

module.exports = router;

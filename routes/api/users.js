const express = require("express");
const router = express.Router();
const gravatar = require("gravatar"); // npm install gravatar
const bcrypt = require("bcryptjs"); // encryption salt
const jwt = require("jsonwebtoken");
const { check, validationResult } = require("express-validator");
const config = require("config");
const HOUR = 360000; //3600

const User = require("../../models/User"); //goind up two levels ../../

// @route   POST api/users
// @desc    Register user route
// @acess   Public
router.post(
  "/",
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Include a vailed Email").isEmail(),
    check(
      "password",
      "Please enter a password with 6 or more characters."
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    // need to label this async to use the try catch...
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      let user = await User.findOne({ email }); //gives us a promise back

      // see if user exists
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: "User already exists" }] }); // we want an array of errors to match the other error message up top
      }
      //get user's gravatar
      const avatar = gravatar.url(email, {
        s: "200",
        r: "pg",
        d: "mm", //uses a default gravatar
      });

      user = new User({
        name,
        email,
        avatar,
        password,
      });

      // encrypt password
      const salt = await bcrypt.genSalt(10); // creating a salt for the passoword with 10 rounds

      user.password = await bcrypt.hash(password, salt);

      await user.save();

      // return jswonwebtoken to login user right away
      // JWT is a token for users to use to access protected routes

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
      res.status(500).send("Server error");
    }
  }
);

module.exports = router;

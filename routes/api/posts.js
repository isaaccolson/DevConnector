const express = require("express");
const router = express.Router();

// @route Get api/posts
// @desc Test route
// @acess Public
router.get("/", (req, res) => res.send("Post route"));

module.exports = router;

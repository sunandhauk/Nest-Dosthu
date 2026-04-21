const express = require("express");
const router = express.Router();
const {
  googleAuthCallback,
  startGoogleAuth,
} = require("../controllers/userController");

router.get("/auth/google", startGoogleAuth);
router.get("/auth/google/callback", googleAuthCallback);

module.exports = router;

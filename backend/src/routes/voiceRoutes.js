const express = require("express");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const { features } = require("process");
const router = express.Router();

const privateKey = fs.readFileSync(
  path.join(__dirname, "../../Key 8_13_2026, 3_57_43 PM.pk"),
  "utf8",
);

router.post("/token", (req, res) => {
  const { roomId, username, role } = req.body;

  if (!roomId || !username || !role) {
    return res.status(400).json({
      error: "Missing session information",
    });
  }

  const roomName = `learn-ide-${roomId}`;
  const now = Math.floor(Date.now() / 1000);

  const payload = {
    aud: "jitsi",
    iss: "chat",
    sub: process.env.JAAS_APP_ID,

    room: roomName,

    nbf: now - 10,
    exp: now + 60 * 60,

    context: {
      user: {
        id: `${roomId}-${role}-${username}`,
        name: username,
        moderator: role === "teacher" ? "true" : "false",
      },

      features: {
        livestreaming: false,
        recording: false,
        transcription: false,
      },

      room: {
        regex: false,
      },
    },
  };

  const token = jwt.sign(payload, privateKey, {
    algorithm: "RS256",

    header: {
      kid: process.env.JAAS_KEY_ID,
      typ: "JWT",
    },
  });

  res.status(200).json({
    token,
    roomName,
  });
});

module.exports = router;

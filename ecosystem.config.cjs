module.exports = {
  apps : [{
    name   : "twitch-discord-webhook",
    script : "./index.js",
    env: {
      "PORT": 8081,
      "PROD": 1
    },
    "log_date_format" : "YYYY-MM-DD HH:mm Z"
  }]
}

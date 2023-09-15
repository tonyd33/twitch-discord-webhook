# twitch-discord-webhook

Simple script to forward messages when a streamer goes live on Twitch to Discord. Created because the bot that I was using paywalls
adding more than one streamer to send a notification for.

# Setup and usage

## Docker (recommended)

Using CLI:
```
docker run -d \
    -p 8080:8080 \
    -e TWITCH_CLIENT_ID= \
    -e TWITCH_CLIENT_SECRET= \
    -e DISCORD_WEBHOOK_URL= \
    -e DOMAIN= \
    -v $(pwd)/usernames.txt:/app/usernames.txt \
    tonyd33/twitch-discord-webhook
```

Using compose:

A [template docker compose file](docker-compose-template.yml) is provided.

## From source
```
npm i

# set up .env file. fill those in
cat <<EOF >.env
TWITCH_CLIENT_ID=
TWITCH_CLIENT_SECRET=
DISCORD_WEBHOOK_URL=
DISCORD_WEBHOOK_URL_TESTING=
EOF

# newline separated twitch usernames to subscribe to notifications
cat <<EOF >usernames.txt
streamer1
streamer2
EOF

# testing using ngrok and the testing discord webhook
PORT=1234 PROD=0 node index.js
# using pm2, start on port 8081 in production
pm2 start ecosystem.config.cjs
```

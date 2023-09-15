# twitch-discord-webhook

Simple script to forward messages when a streamer goes live on Twitch to Discord. Created because the bot that I was using paywalls
adding more than one streamer to send a notification for.

# Setup and usage

The list of Twitch streamers to subscribe to is stored in a plaintext file containing a list of usernames, separated by newlines.
Quickly create a file by:
```
cat <<EOF >usernames.txt
streamer1
streamer2
EOF
```

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

## From source/PM2

Fill in the `.env` file:
```
npm i
cat <<EOF >.env
TWITCH_CLIENT_ID=
TWITCH_CLIENT_SECRET=
DISCORD_WEBHOOK_URL=
DISCORD_WEBHOOK_URL_TESTING=
EOF
```

Test with `ngrok` and the test webhook URL:
```
# testing using ngrok and the testing discord webhook
PORT=1234 PROD=0 node index.js
```

Using `pm2` to daemonize:
```
pm2 start ecosystem.config.cjs
```

## Notes

It's hard to check if the application is running or working because it sends messages very infrequently
and it's dependent on Twitch sending a notification after a streamer actually goes live. For this reason,
I recommended running another instance with a list of consistent streamers in `heartbeat.txt` with a
Discord webhook URL pointing to a private channel to verify the application is alive.

import { AppTokenAuthProvider } from "@twurple/auth";
import { ApiClient } from "@twurple/api";
import { EventSubHttpListener, EnvPortAdapter } from "@twurple/eventsub-http";
import { NgrokAdapter } from "@twurple/eventsub-ngrok";
import {
    Webhook as DiscordWebhook,
    MessageBuilder,
} from "discord-webhook-node";
import crypto from "crypto";
import fsPromises from "fs/promises";
import * as dotenv from "dotenv";
dotenv.config();

const clientId = process.env["TWITCH_CLIENT_ID"];
const clientSecret = process.env["TWITCH_CLIENT_SECRET"];
// testing locally will use ngrok, prod will be behind reverse proxy
const prod = process.env["PROD"] || false;
const discordWebhookUrl = prod
    ? process.env["DISCORD_WEBHOOK_URL"]
    : process.env["DISCORD_WEBHOOK_URL_TESTING"];

const discordWebhook = new DiscordWebhook(discordWebhookUrl);

const authProvider = new AppTokenAuthProvider(clientId, clientSecret);
const apiClient = new ApiClient({ authProvider });

const adapter = prod
    ? new EnvPortAdapter({ apiClient, hostName: "twh.tonydu.me" })
    : new NgrokAdapter();
const secret = crypto.randomBytes(16).toString("hex");
const listener = new EventSubHttpListener({ apiClient, adapter, secret });

/*
 * These are the streams that we want to send notifications for.
 * List of usernames.
 */
async function getNotifyUsernames() {
    let usernames = [];
    try {
        const text = await fsPromises.readFile("./usernames.txt", "utf8");
        usernames = text.split("\n").filter((username) => !!username);
    } catch (err) {
        console.error(err);
    } finally {
        return usernames;
    }
}

/*
 * Subscribes to webhook for stream usernames and returns the subscriptions
 * for each user.
 * cb: (event) => void is invoked by the listener on receiving an event
 * event reference:
 * https://twurple.js.org/reference/eventsub-base/classes/EventSubStreamOnlineEvent.html
 */
async function subscribeToStreams(usernames, cb) {
    const users = await apiClient.users.getUsersByNames(usernames);
    console.log(users.map(({ id }) => id));
    const subscriptions = users.map(({ id }) =>
        listener.onStreamOnline(id, (e) => cb(e))
    );
    return subscriptions;
}

async function sendDiscordWebhook({
    username,
    gameName,
    title,
    thumbnailUrl,
    profilePictureUrl,
}) {
    const embed = new MessageBuilder()
        .setText(`${username} is live!`)
        .setTitle(title)
        .setURL(`https://www.twitch.tv/${username}`)
        .addField("Game", gameName)
        .setColor("#00b0f4")
        .setThumbnail(profilePictureUrl)
        .setDescription(`**${username} is live!**`)
        .setImage(thumbnailUrl);
    await discordWebhook.send(embed);
}

async function onStreamUp(e) {
    try {
        const [stream, user] = await Promise.all([
            e.getStream(),
            e.getBroadcaster(),
        ]);
        if (!stream || !user) {
            throw new Error("Error getting stream from twitch webhook event");
        }
        const { displayName: username } = user;
        const { gameName, title } = stream;
        // workaround a bug in twurple api
        const thumbnailUrl = stream.thumbnailUrl.replace(
            "-{width}x{height}",
            ""
        );
        const { profilePictureUrl } = user;
        sendDiscordWebhook({
            username,
            gameName,
            title,
            thumbnailUrl,
            profilePictureUrl,
        });
    } catch (err) {
        console.error(err);
    }
}

async function main() {
    console.log(`Starting in prod mode: ${prod}`)
    await apiClient.eventSub.deleteAllSubscriptions();
    const usernames = await getNotifyUsernames();
    const subscriptions = await subscribeToStreams(usernames, onStreamUp);
    const testCommands = await Promise.all(
        subscriptions.map((s) => s.getCliTestCommand())
    );
    console.log(`Try testing with\n${testCommands.join("\n")}`);
    listener.start();
}

await main();

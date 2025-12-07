require('dotenv').config();
const { Client, GatewayIntentBits, Collection, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { loadWishlist, saveWishlist } = require('./utils/storage');
const { getGamePrices } = require('./utils/ggdeals');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if (command.config && command.config.name) {
        client.commands.set(command.config.name, command);
        console.log(`Loaded command: ${command.config.name}`);
    }
}

const PREFIX = '!';

client.once('clientReady', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    
    client.user.setActivity("Jack's mum", { type: ActivityType.Playing });

    // Start the price checker
    const intervalMinutes = process.env.CHECK_INTERVAL_MINUTES || 30;
    console.log(`Starting price check interval: every ${intervalMinutes} minutes.`);
    checkPrices(); // Run once on startup
    setInterval(checkPrices, intervalMinutes * 60 * 1000);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);

    if (!command) return;

    try {
        await command.run(client, message, args);
    } catch (error) {
        console.error(error);
        message.reply('There was an error executing that command.');
    }
});

async function checkPrices() {
    console.log("Checking prices...");
    const wishlistChannelId = process.env.WISHLIST_CHANNEL_ID;
    if (!wishlistChannelId) {
        console.error("WISHLIST_CHANNEL_ID is not set in .env");
        return;
    }

    const channel = await client.channels.fetch(wishlistChannelId).catch(err => console.error("Could not fetch wishlist channel:", err));
    if (!channel) return;

    const wishlist = loadWishlist();
    if (wishlist.length === 0) return;

    const appIds = wishlist.map(g => g.appId);
    let ggData = {};
    
    try {
        // Fetch in chunks of 100
        for (let i = 0; i < appIds.length; i += 100) {
            const chunk = appIds.slice(i, i + 100);
            const prices = await getGamePrices(chunk);
            if (prices) Object.assign(ggData, prices);
        }
    } catch (e) {
        console.error("Error fetching GG.deals prices:", e);
        return;
    }

    let updated = false;

    for (const game of wishlist) {
        const data = ggData[game.appId];
        if (!data || !data.prices) continue;

        const retail = data.prices.currentRetail ? parseFloat(data.prices.currentRetail) : null;
        const keyshop = data.prices.currentKeyshops ? parseFloat(data.prices.currentKeyshops) : null;
        
        let currentLowest = null;
        let source = "";

        if (retail !== null) {
            currentLowest = retail;
            source = "Retail";
        }
        if (keyshop !== null && (currentLowest === null || keyshop < currentLowest)) {
            currentLowest = keyshop;
            source = "Keyshop";
        }

        if (currentLowest !== null && currentLowest !== game.lastKnownPrice) {
            const oldPrice = game.lastKnownPrice;
            game.lastKnownPrice = currentLowest;
            game.lastChecked = new Date().toISOString();
            updated = true;

            // Notify if price dropped
            if (currentLowest < oldPrice) {
                channel.send(`🚨 **Price Drop Alert!**\n**${game.name}** is now **£${currentLowest.toFixed(2)}** (${source})!\nWas: £${oldPrice.toFixed(2)}\n[View Deal](${data.url})`);
            }
        }
    }

    if (updated) {
        saveWishlist(wishlist);
    }
}

client.login(process.env.DISCORD_TOKEN);

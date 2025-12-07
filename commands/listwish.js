const { loadWishlist } = require('../utils/storage');
const { getGamePrices } = require('../utils/ggdeals');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    config: {
        name: 'listwish',
        description: 'List all games with prices from GG.deals',
        usage: '!listwish',
    },
    async run(bot, message, args) {
        const wishlist = loadWishlist();
        if (wishlist.length === 0) {
            return message.reply("The wishlist is empty.");
        }

        const statusMsg = await message.channel.send("🔄 Checking prices on GG.deals...");

        const embed = new EmbedBuilder()
            .setTitle('📋 Server Wishlist')
            .setColor(0x0099FF)
            .setDescription('Best prices from GG.deals:');

        // Collect all App IDs
        const appIds = wishlist.map(g => g.appId);
        
        // Fetch prices in chunks of 100 (API limit)
        let ggData = {};
        try {
            for (let i = 0; i < appIds.length; i += 100) {
                const chunk = appIds.slice(i, i + 100);
                const prices = await getGamePrices(chunk);
                if (prices) {
                    Object.assign(ggData, prices);
                }
            }
        } catch (e) {
            console.error("Error fetching GG.deals prices:", e);
            if (statusMsg.deletable) statusMsg.delete().catch(() => {});
            return message.reply("Failed to fetch prices from GG.deals.");
        }

        // Process games
        for (const game of wishlist) {
            let priceField = "Checking...";
            const data = ggData[game.appId];

            if (data && data.prices) {
                const retail = data.prices.currentRetail ? parseFloat(data.prices.currentRetail) : null;
                const keyshop = data.prices.currentKeyshops ? parseFloat(data.prices.currentKeyshops) : null;
                
                let bestPrice = null;
                let source = "";

                if (retail !== null) {
                    bestPrice = retail;
                    source = "Retail";
                }
                if (keyshop !== null && (bestPrice === null || keyshop < bestPrice)) {
                    bestPrice = keyshop;
                    source = "Keyshop";
                }

                if (bestPrice !== null) {
                    const tracked = game.lastKnownPrice;
                    let comparison = '';
                    if (bestPrice < tracked) {
                        comparison = ` 🔻 (was £${tracked})`;
                    } else if (bestPrice > tracked) {
                        comparison = ` 🔺 (was £${tracked})`;
                    }

                    priceField = `**Lowest: £${bestPrice.toFixed(2)}** (${source}) [View](${data.url})${comparison}\n`;
                    
                    if (retail !== null && keyshop !== null) {
                        priceField += `Retail: £${retail.toFixed(2)} | Keyshop: £${keyshop.toFixed(2)}`;
                    }
                } else {
                    priceField = `No current deals found. [View](${data.url})`;
                }
            } else {
                priceField = `Could not retrieve price data.`;
            }

            embed.addFields({ 
                name: game.name, 
                value: priceField, 
                inline: false 
            });
        }

        if (statusMsg.deletable) statusMsg.delete().catch(() => {});
        message.channel.send({ embeds: [embed] });
    }
}

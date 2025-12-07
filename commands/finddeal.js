const { searchGame } = require('../utils/steam');
const { getGamePrices } = require('../utils/ggdeals');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    config: {
        name: 'finddeal',
        description: 'Find the best deal for a game using GG.deals (GBP)',
        usage: '!finddeal <game name>',
    },
    async run(bot, message, args) {
        if (!args.length) return message.reply("Please provide a game name to search for.");

        const query = args.join(' ');
        const searchMsg = await message.channel.send(`🔍 Searching for "**${query}**"...`);

        try {
            // 1. Find the game on Steam to get the App ID
            const steamResult = await searchGame(query);
            
            if (!steamResult || !steamResult.id) {
                if (searchMsg.deletable) searchMsg.delete().catch(() => {});
                return message.reply(`Could not find "**${query}**" on Steam. GG.deals search requires a valid Steam App ID.`);
            }

            // 2. Get prices from GG.deals
            const ggPrices = await getGamePrices([steamResult.id]);
            const gameData = ggPrices ? ggPrices[steamResult.id] : null;

            if (!gameData) {
                if (searchMsg.deletable) searchMsg.delete().catch(() => {});
                return message.reply(`Found "**${steamResult.name}**" on Steam, but could not retrieve pricing from GG.deals.`);
            }

            // 3. Construct the response
            const prices = gameData.prices;
            const retailPrice = prices.currentRetail ? parseFloat(prices.currentRetail) : null;
            const keyshopPrice = prices.currentKeyshops ? parseFloat(prices.currentKeyshops) : null;
            const steamPrice = steamResult.price;

            // Determine best price
            let bestPrice = steamPrice;
            let bestSource = "Steam";

            if (retailPrice !== null && retailPrice < bestPrice) {
                bestPrice = retailPrice;
                bestSource = "Retail Store";
            }
            if (keyshopPrice !== null && keyshopPrice < bestPrice) {
                bestPrice = keyshopPrice;
                bestSource = "Keyshop";
            }

            // Create Embed
            const embed = new EmbedBuilder()
                .setTitle(gameData.title || steamResult.name)
                .setURL(gameData.url)
                .setThumbnail(`https://cdn.cloudflare.steamstatic.com/steam/apps/${steamResult.id}/header.jpg`)
                .setColor(bestPrice < steamPrice ? 0x00FF00 : 0x0099FF) // Green if deal found, Blue if Steam is best/same
                .addFields(
                    { name: '🏷️ Best Price', value: `**£${bestPrice.toFixed(2)}**\n*${bestSource}*`, inline: true },
                    { name: '🚂 Steam Price', value: `**£${steamPrice.toFixed(2)}**`, inline: true },
                );

            // Add comparison fields
            let comparisonValue = "";
            if (retailPrice !== null) comparisonValue += `🏪 **Retail**: £${retailPrice.toFixed(2)}\n`;
            if (keyshopPrice !== null) comparisonValue += `🔑 **Keyshop**: £${keyshopPrice.toFixed(2)}\n`;
            
            if (comparisonValue) {
                embed.addFields({ name: '📊 Market Comparison', value: comparisonValue, inline: false });
            }

            embed.addFields(
                { name: '🔗 Quick Links', value: `[View on GG.deals](${gameData.url}) • [View on Steam](${steamResult.url})`, inline: false }
            );
            
            embed.setFooter({ text: 'Powered by GG.deals & Steam', iconURL: 'https://gg.deals/favicon.ico' });
            embed.setTimestamp();

            if (searchMsg.deletable) searchMsg.delete().catch(() => {});
            message.channel.send({ embeds: [embed] });

        } catch (error) {
            console.error(error);
            if (searchMsg.deletable) searchMsg.delete().catch(() => {});
            message.reply("An error occurred while searching for deals.");
        }
    }
}

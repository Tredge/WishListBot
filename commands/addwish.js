const { getGameDetails, searchGame } = require('../utils/steam');
const { loadWishlist, saveWishlist } = require('../utils/storage');
const { getGamePrices } = require('../utils/ggdeals');

module.exports = {
    config: {
        name: 'addwish',
        description: 'Add a game to the wishlist',
        usage: '!addwish <AppID, URL, or Game Name>',
    },
    async run(bot, message, args) {
        if (!args.length) return message.reply("Please provide a Steam AppID, Store URL, or Game Name.");

        let appId = args[0];
        let isSearch = false;

        // 1. Try URL
        const urlMatch = appId.match(/app\/(\d+)/);
        if (urlMatch) {
            appId = urlMatch[1];
        }
        // 2. Try AppID (if single argument and numeric)
        else if (args.length === 1 && /^\d+$/.test(appId)) {
            // It's an AppID, do nothing
        }
        // 3. Assume Search
        else {
            isSearch = true;
            const query = args.join(' ');
            const searchMsg = await message.channel.send(`🔍 Searching for "**${query}**"...`);
            
            const searchResult = await searchGame(query);
            if (!searchResult) {
                if(searchMsg.deletable) searchMsg.delete().catch(() => {});
                return message.reply(`Could not find any game matching "**${query}**".`);
            }
            
            appId = String(searchResult.id);
            if(searchMsg.deletable) searchMsg.delete().catch(() => {});
            message.channel.send(`Found **${searchResult.name}** (ID: ${appId}). Adding to wishlist...`);
        }

        if (!/^\d+$/.test(appId)) {
            return message.reply("Invalid AppID. It must be a number.");
        }

        const wishlist = loadWishlist();
        if (wishlist.find(g => g.appId === appId)) {
            return message.reply("This game is already in the wishlist.");
        }

        // Get Steam details for name/metadata
        const details = await getGameDetails(appId, process.env.STEAM_REGION || 'gb');
        if (!details) {
            return message.reply("Could not find game on Steam. Check the AppID.");
        }

        // Get GG.deals price for accurate baseline
        let initialPrice = details.price;
        let source = "Steam";
        
        try {
            const ggPrices = await getGamePrices([appId]);
            const data = ggPrices ? ggPrices[appId] : null;
            
            if (data && data.prices) {
                const retail = data.prices.currentRetail ? parseFloat(data.prices.currentRetail) : null;
                const keyshop = data.prices.currentKeyshops ? parseFloat(data.prices.currentKeyshops) : null;
                
                let bestPrice = null;
                if (retail !== null) bestPrice = retail;
                if (keyshop !== null && (bestPrice === null || keyshop < bestPrice)) bestPrice = keyshop;

                if (bestPrice !== null && bestPrice < initialPrice) {
                    initialPrice = bestPrice;
                    source = "GG.deals";
                }
            }
        } catch (e) {
            console.error("Error fetching initial GG.deals price:", e);
        }

        const newItem = {
            appId: appId,
            name: details.name,
            lastKnownPrice: initialPrice,
            currency: details.currency,
            lastChecked: new Date().toISOString()
        };

        wishlist.push(newItem);
        saveWishlist(wishlist);

        message.reply(`✅ Added **${details.name}** to wishlist.\nCurrent Lowest Price: £${initialPrice.toFixed(2)} (${source})`);
    }
}

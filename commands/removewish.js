const { loadWishlist, saveWishlist } = require('../utils/storage');

module.exports = {
    config: {
        name: 'removewish',
        description: 'Remove a game from the wishlist',
        usage: '!removewish <AppID>',
    },
    async run(bot, message, args) {
        if (!args.length) return message.reply("Please provide the AppID or name of the game to remove.");

        const query = args.join(' ').toLowerCase();
        let wishlist = loadWishlist();
        let gameToRemove = null;

        // 1. Try to find by AppID (if single argument and numeric)
        if (args.length === 1 && /^\d+$/.test(args[0])) {
            gameToRemove = wishlist.find(g => g.appId === args[0]);
        }

        // 2. If not found by AppID, search by name
        if (!gameToRemove) {
            const matches = wishlist.filter(g => g.name.toLowerCase().includes(query));

            if (matches.length === 0) {
                return message.reply(`Could not find any game matching "**${args.join(' ')}**" in the wishlist.`);
            } else if (matches.length > 1) {
                // If exact match exists among multiples, prefer it
                const exactMatch = matches.find(g => g.name.toLowerCase() === query);
                if (exactMatch) {
                    gameToRemove = exactMatch;
                } else {
                    const list = matches.map(g => `• ${g.name} (ID: ${g.appId})`).join('\n');
                    return message.reply(`Found multiple games matching "**${args.join(' ')}**". Please be more specific or use the AppID:\n${list}`);
                }
            } else {
                gameToRemove = matches[0];
            }
        }

        // Perform removal
        if (gameToRemove) {
            const newWishlist = wishlist.filter(g => g.appId !== gameToRemove.appId);
            saveWishlist(newWishlist);
            message.reply(`🗑️ Removed **${gameToRemove.name}** (ID: ${gameToRemove.appId}) from wishlist.`);
        }
    }
}

const { saveWishlist, loadWishlist } = require('../utils/storage');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    config: {
        name: 'clearwish',
        description: 'Clears the entire wishlist',
        usage: '!clearwish',
    },
    async run(bot, message, args) {
        const wishlist = loadWishlist();
        
        if (wishlist.length === 0) {
            return message.reply("The wishlist is already empty!");
        }

        // Clear the wishlist
        saveWishlist([]);

        const embed = new EmbedBuilder()
            .setTitle('🗑️ Wishlist Cleared')
            .setColor(0xFF0000) // Red for destructive action
            .setDescription(`Successfully removed **${wishlist.length}** games from the wishlist.`)
            .setTimestamp();

        message.channel.send({ embeds: [embed] });
    }
}

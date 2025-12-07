const { EmbedBuilder } = require('discord.js');

module.exports = {
    config: {
        name: 'commands',
        description: 'Lists all available commands',
        usage: '!commands',
    },
    async run(bot, message, args) {
        const embed = new EmbedBuilder()
            .setTitle('🤖 Bot Commands')
            .setColor(0x0099FF)
            .setDescription('Here are the available commands you can use:')
            .setThumbnail(bot.user.displayAvatarURL())
            .setFooter({ text: 'Steam Wishlist Bot', iconURL: bot.user.displayAvatarURL() })
            .setTimestamp();

        // Sort commands alphabetically
        const sortedCommands = [...bot.commands.values()].sort((a, b) => 
            a.config.name.localeCompare(b.config.name)
        );

        sortedCommands.forEach(cmd => {
            embed.addFields({
                name: `🔹 !${cmd.config.name}`,
                value: `${cmd.config.description}\n\`${cmd.config.usage}\``,
                inline: false
            });
        });

        message.channel.send({ embeds: [embed] });
    }
}

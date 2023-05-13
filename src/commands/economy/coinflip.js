const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { getUser } = require("@schemas/User");
const { EMBED_COLORS, ECONOMY } = require("@root/config.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
    name: "coinflip",
    description: "bet your coins on a coin flip",
    category: "ECONOMY",
    botPermissions: ["EmbedLinks"],
    command: {
        enabled: true,
        usage: "<heads|tails> <amount>",
        minArgsCount: 2,
        aliases: ["cf"],
    },
    slashCommand: {
        enabled: true,
        options: [
            {
                name: "side",
                description: "choose heads or tails",
                required: true,
                type: ApplicationCommandOptionType.String,
                choices: [
                    { name: "heads", value: "heads" },
                    { name: "tails", value: "tails" },
                ],
            },
            {
                name: "coins",
                description: "number of coins to bet",
                required: true,
                type: ApplicationCommandOptionType.Integer,
            },
        ],
    },

    async messageRun(message, args) {
        const side = args[0].toLowerCase();
        const betAmount = parseInt(args[1]);

        if (!["heads", "tails"].includes(side)) return message.safeReply("You need to choose either 'heads' or 'tails'");
        if (isNaN(betAmount)) return message.safeReply("Bet amount needs to be a valid number input");

        const response = await coinflip(message.author, side, betAmount);
        await message.safeReply(response);
    },

    async interactionRun(interaction) {
        const side = interaction.options.getString("side");
        const betAmount = interaction.options.getInteger("coins");

        const response = await coinflip(interaction.user, side, betAmount);
        await interaction.followUp(response);
    },
};

async function coinflip(user, side, betAmount) {
    if (isNaN(betAmount)) return "Bet amount needs to be a valid number input";
    if (betAmount < 0) return "Bet amount cannot be negative";
    if (betAmount < 10) return "Bet amount cannot be less than 10";

    const userDb = await getUser(user);
    if (userDb.coins < betAmount)
        return `You do not have sufficient coins to bet!\n**Coin balance:** ${userDb.coins || 0}${ECONOMY.CURRENCY}`;

    const flipResult = Math.random() < 0.5 ? "heads" : "tails";
    const win = side === flipResult;
    const balance = win ? betAmount : -betAmount;

    userDb.coins += balance;
    await userDb.save();

    const embed = new EmbedBuilder()
        .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
        .setColor(EMBED_COLORS.TRANSPARENT)
        .setDescription(`**Coinflip Result:** ${flipResult.toUpperCase()}`)
        .setFooter({ text: win ? `You won: ${betAmount}${ECONOMY.CURRENCY}` : `You lost: ${betAmount}${ECONOMY.CURRENCY}\nUpdated Wallet balance: ${userDb?.coins}${ECONOMY.CURRENCY}` });

    return { embeds: [embed] };
}
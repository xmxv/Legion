const {
    EmbedBuilder,
    ApplicationCommandOptionType,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
} = require("discord.js");
const { getUser } = require("@schemas/User");
const { ECONOMY, EMBED_COLORS } = require("@root/config.js");

module.exports = {
    name: "crash",
    description: "Crash game with a 50% chance of failure",
    category: "ECONOMY",
    botPermissions: ["EmbedLinks"],
    command: {
        enabled: true,
        usage: "<amount>",
        minArgsCount: 1,
        aliases: [],
    },
    slashCommand: {
        enabled: true,
        options: [
            {
                name: "coins",
                description: "number of coins to bet",
                required: true,
                type: ApplicationCommandOptionType.Integer,
            },
        ],
    },

    async messageRun(message, args) {
        const betAmount = parseInt(args[0]);
        if (isNaN(betAmount)) return message.reply("Bet amount needs to be a valid number input");
        const response = await gamble(message, message.author, betAmount);
        await message.reply(response);
    },

    async interactionRun(interaction) {
        const betAmount = interaction.options.getInteger("coins");
        const response = await gamble(interaction, interaction.user, betAmount);
        await interaction.followUp(response);
    },
};

async function gamble(ctx, user, betAmount) {
    if (isNaN(betAmount)) return "Bet amount needs to be a valid number input";
    if (betAmount < 0) return "Bet amount cannot be negative";
    if (betAmount < 10) return "Bet amount cannot be less than 10";

    const userDb = await getUser(user);
    if (userDb.coins < betAmount)
        return `You do not have sufficient coins to play!\n**Coin balance:** ${userDb.coins || 0}${ECONOMY.CURRENCY}`;

    const crashResult = Math.random() < 0.5 ? "Failed" : "Success";
    const embedColor = Math.floor(Math.random() * 0xffffff);

    const embed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle("Crash Game")
        .setDescription(`Result: **${crashResult}**\n\n50% chance of failure.`);

    const continueButton = new ButtonBuilder()
        .setCustomId("continue")
        .setLabel("Continue")
        .setStyle(ButtonStyle.PRIMARY);

    const cashoutButton = new ButtonBuilder()
        .setCustomId("cashout")
        .setLabel("Cashout")
        .setStyle(ButtonStyle.SECONDARY);

    const actionRow = new ActionRowBuilder().addComponents([continueButton, cashoutButton]);

    const sentMessage = await ctx.send({ embeds: [embed], components: [actionRow] });

    const filter = (interaction) => interaction.user.id === user.id;

    const collector = sentMessage.createMessageComponentCollector({ filter, time: 60 * 1000 });

    collector.on("collect", async (interaction) => {
        await interaction.deferUpdate();

        if (interaction.customId === "continue") {
            // Handle the continue scenario here
            userDb.coins += betAmount;
            await userDb.save();
        } else if (interaction.customId === "cashout") {
            // Handle the cashout scenario here
            if (crashResult === "Success") {
                userDb.coins += betAmount;
                await userDb.save();
                embed.setDescription(`Result: **${crashResult}**\n\nYou successfully cashed out ${betAmount}${ECONOMY.CURRENCY}!`);
            } else {
                userDb.coins -= betAmount;
                await userDb.save();
                embed.setDescription(`Result: **${crashResult}**\n\nYou failed and lost ${betAmount}${ECONOMY.CURRENCY}.`);
            }
        }

        // Update the embed and remove the buttons
        embed.setFooter({ text: `Updated Wallet balance: ${userDb.coins}${ECONOMY.CURRENCY}` });
        await interaction.editReply({ embeds: [embed], components: [] });

        collector.stop();
    });


        collector.on("end", async () => {
            // Clean up the message after the collector ends
            const updatedEmbed = sentMessage.embeds[0].setFooter({ text: `Updated Wallet balance: ${userDb.coins}${ECONOMY.CURRENCY}` });
            await sentMessage.edit({ embeds: [updatedEmbed], components: [] });
        });

         return { content: "Crash game started!" };
    }
const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");
const { getJson } = require("@helpers/HttpUtils");
const { EMBED_COLORS } = require("@root/config");
const NekosLife = require("nekos.life");
const neko = new NekosLife();

const choices = ["hug", "kiss", "cuddle", "feed", "pat", "poke", "slap", "smug", "tickle", "wink"];

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
    name: "r",
    description: "anime reactions",
    enabled: true,
    category: "ANIME",
    cooldown: 5,
    command: {
        enabled: true,
        minArgsCount: 2,
        usage: "<reaction> <user>",
    },
    slashCommand: {
        enabled: true,
        options: [
            {
                name: "reaction",
                description: "reaction type",
                type: ApplicationCommandOptionType.String,
                required: true,
                choices: choices.map((ch) => ({ name: ch, value: ch })),
            },
            {
                name: "user",
                description: "user to interact with",
                type: ApplicationCommandOptionType.User,
                required: true,
            },
        ],
    },

    async messageRun(message, args) {
        const category = args[0].toLowerCase();
        const target = message.mentions.users.first();
        if (!choices.includes(category) || !target) {
            return message.safeReply(`Invalid choice or mention. Usage: \`!r <reaction> <user>\`\nAvailable reactions: ${choices.join(", ")}`);
        }

        const interactionMessage = `Dear ${target}, ${message.author} has sent you a ${category}!`;

        const embed = await genReaction(category, message.author, interactionMessage);
        await message.safeReply({ content: interactionMessage, embeds: [embed] });
    },

    async interactionRun(interaction) {
        const category = interaction.options.getString("reaction");
        const target = interaction.options.getUser("user");
        const interactionMessage = `Dear ${target}, ${interaction.user} has sent you a ${category}!`;

        const embed = await genReaction(category, interaction.user, interactionMessage);
        await interaction.followUp({ content: interactionMessage, embeds: [embed] });
    },
};

const genReaction = async (category, user, interactionMessage) => {
    try {
        let imageUrl;

        // some-random api
        if (category === "wink") {
            const response = await getJson("https://some-random-api.ml/animu/wink");
            if (!response.success) throw new Error("API error");
            imageUrl = response.data.link;
        }

        // neko api
        else {
            imageUrl = (await neko[category]()).url;
        }

        return new EmbedBuilder()
            .setImage(imageUrl)
            .setColor("Random")
            .setDescription(interactionMessage)
            .setFooter({ text: `Requested By ${user.tag}` });
    } catch (ex) {
        return new EmbedBuilder()
            .setColor(EMBED_COLORS.ERROR)
            .setDescription("Failed to fetch meme. Try again!")
            .setFooter({ text: `Requested By ${user.tag}` });
    }
};

const Discord = require('discord.js');

const CommandController = require('./commandController');

const BOT_TOKEN = process.env.BOT_TOKEN;

const client = new Discord.Client();

client.login(BOT_TOKEN);

client.on('ready', () => {
    console.log('Discord bot logged in');
    //console.log(`Logged in as ${client.user.tag}`);
});

client.on('message', msg => {
    let action;

    if (msg.content.startsWith('!')) {
        const controller = new CommandController(msg);

        return controller.process();
    }
});
const Discord = require('discord.js');

const BOT_TOKEN = 'NDI5Njk5Njk3MzcyODIzNTYz.DaFq_g.Czhh7zmqSht8VepWMvU1fKaytR8';

const client = new Discord.Client();

client.login(BOT_TOKEN);

client.on('ready', () => {
    console.log('Discord bot logged in');
    //console.log(`Logged in as ${client.user.tag}`);
});

client.on('message', msg => {
    let action;

    if (msg.content.startsWith('!')) console.log('command');
    /*
    if (msg.content === 'verify') action = verifyUser(msg.author);
    else if (msg.content === 'ping') action = Promise.resolve('pong');
    */

    if (action) action.then(response => msg.channel.send(response)).catch(err => msg.reply(err));
});

function verifyUser(user) {
    return user.fetchProfile().then(console.log).catch(console.log);
}
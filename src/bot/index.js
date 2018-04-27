const Discord = require('discord.js');

const CommandController = require('./commandController');

const BOT_TOKEN = process.env.BOT_TOKEN;
const ONE_HOUR_MS = 60000 * 60;

const client = new Discord.Client();

client.login(BOT_TOKEN);

client.on('ready', () => {
  console.log('Discord bot logged in');
  //console.log(`Logged in as ${client.user.tag}`);
  startIntervals();
});

client.on('message', msg => {
  let action;

  if (msg.content.startsWith('!')) {
    const controller = new CommandController(msg);

    return controller.process();
  }
});

function startIntervals() {
  // Random Guild Name
  const GUILD_NAMES = [
    'Smelly Whores',
    'Stinky Sluts',
    'The Flaccid Dicks',
    'The Gooch',
    'Ass Cheezers',
    'Puss Plumbers',
    'Stank Fiends',
    'Incest Anonymous',
    'Autofellatio Anonymous',
    'Wankin Warriors',
    'People With Aids',
    'Inbred Idiots',
    'Lost Hope Society',
    'Cutie Cuddle Bears',
    'Literal Fetuses',
    'The Kids Who Got Dropped',
  ];
  client.setInterval(() => {
    const randomGuildName = GUILD_NAMES[Math.floor(Math.random() * GUILD_NAMES.length)];
    client.guilds.first().setName(randomGuildName);
    console.log('Changed Guild name to ' + randomGuildName);
  }, ONE_HOUR_MS);

  // TODO: Random Insult
}
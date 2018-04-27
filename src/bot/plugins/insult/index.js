const axios = require('axios');

const SIX_HOUR_MS = 60000 * 60 * 6;

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

module.exports = {
  name: 'Insulter3000',
  description: 'For when you just don\'t like people.',
  rootCommand: 'insult',
  setup: client => {
    const guild = client.guilds.first();

    client.setInterval(() => {
      const channel = guild.channels.find('name', 'general');
      const randomGuildMember = guild.members.random();
      generateInsult().then(insult => channel.send(randomGuildMember + ' ' + insult));
    }, SIX_HOUR_MS);
  },
  process: (message, client) => {
    const user = message.mentions.members.first() || message.author;

    generateInsult().then(insult => message.channel.send(user + ' ' + insult));
  },
};

function generateInsult() {
  return axios.get('https://insult.mattbas.org/api/insult')
    .then(response => response.data);
}
const axios = require('axios');
const _ = require('lodash');

const API_KEY = process.env.API_KEY;

const STATS = {
  soloSeason: ['stats', 'p2'],
  duoSeason: ['stats', 'p10'],
  squadSeason: ['stats', 'p9'],

  soloLifetime: ['stats', 'curr p2'],
  duoLifetime: ['stats', 'curr p10'],
  squadLifetime: ['stats', 'curr p9'],

  lifetime: 'lifeTimeStats',

  lifetime: 'recentMatches',
};

module.exports = {
  name: 'Fortnite',
  description: 'A plugin for viewing Fortnite stats.',
  rootCommand: 'fortnite',
  process: (message, client) => {
    const command = message.content.slice(1).split(' ').slice(1);

    console.log(command);

    if (command.length === 0) message.channel.send(`${message.author} Fortnite commands: (TODO)`);
    else if (command[0] === 'kd') _getSeasonKD(command.slice(1), message);
    else {
      message.channel.send('Unknown command');
    }
  },
};

function _getSeasonKD(parameters, message) {
    let username = parameters[0] || message.author.username;
    const platform = parameters[1] || 'pc';

    getStats(username, platform).then(stats => {
      const soloSeasonKD = parseFloat(_.get(stats, STATS.soloSeason).kd.value);
      const duoSeasonKD = parseFloat(_.get(stats, STATS.duoSeason).kd.value);
      const squadSeasonKD = parseFloat(_.get(stats, STATS.squadSeason).kd.value);

      message.channel.send(`${message.author} ${username} K/D: ${average([soloSeasonKD, duoSeasonKD, squadSeasonKD])}`);
    });

    function average(numbers) {
      let sum = 0;
      for (let i = 0; i < numbers.length; i++) {
        sum += numbers[i];
      }
      return (sum/numbers.length).toPrecision(3);
    }

    function getStats(username, platform) {
      return axios.get(`https://api.fortnitetracker.com/v1/profile/${platform}/${username}`, {
        headers: {
          'TRN-Api-Key': API_KEY,
        }
      }).then(response => response.data);
    }
  }
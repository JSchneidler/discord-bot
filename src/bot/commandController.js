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

const INSULTS = [
  'You are a cunt',
  'Get fucked, whore',
  'Suck a cock, faggot',
  'Retard boy',
];

module.exports = class CommandController {
  constructor(message) {
    this.message = message;
    this.command = message.content.slice(1).split(' ');
  }

  process() {
    try {
      switch(this.command[0]) {
        case 'kd':
          return this._getKD(this.command.slice(1));
        case 'help':
          return this._help();
        case 'insult':
          return this._insult(this.command.slice(1));
        default:
          return Promise.reject(new Error('Unknown command'));
      }
    } catch (e) { console.log(e); return this._replyChannel('Could not process command'); }
  }

  _replyChannel(content) {
    return this.message.channel.send(content);
  }

  _help() {
    this._replyChannel('help');
  }

  _insult(parameters) {
    if (!this.message.mentions.members) throw new Error('No member mentioned for insult');
    console.log(this.message.mentions.members.first());
    const userID = this.message.mentions.members.first();
    const insult = INSULTS[Math.floor(Math.random() * INSULTS.length)]
    return this._replyChannel(`${userID} ${insult}`);
  }

  _getKD(parameters) {
    let username = parameters[0] || this.message.author.username;
    const platform = parameters[1] || 'pc';

    return axios.get(`https://api.fortnitetracker.com/v1/profile/${platform}/${username}`, {
      headers: {
        'TRN-Api-Key': API_KEY,
      }
    }).then(response => {
      const data = response.data;

      const soloSeasonKD = parseFloat(_.get(data, STATS.soloSeason).kd.value);
      const duoSeasonKD = parseFloat(_.get(data, STATS.duoSeason).kd.value);
      const squadSeasonKD = parseFloat(_.get(data, STATS.squadSeason).kd.value);

      return this._replyChannel(`${username} K/D: ${average([soloSeasonKD, duoSeasonKD, squadSeasonKD])}`);
    });

    function average(numbers) {
      let sum = 0;
      for (let i = 0; i < numbers.length; i++) {
        sum += numbers[i];
      }
      return (sum/numbers.length).toPrecision(3);
    }
  }
};
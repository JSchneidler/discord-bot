const ONE_HOUR_MS = 60000 * 60;

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
  name: 'Random Server Name',
  description: 'A plugin that sets the server name randomly.',
  setup: client => {
    client.setInterval(() => {
      const randomGuildName = GUILD_NAMES[Math.floor(Math.random() * GUILD_NAMES.length)];
      client.guilds.first().setName(randomGuildName);
      console.log('Changed Guild name to ' + randomGuildName);
    }, ONE_HOUR_MS);
  },
};
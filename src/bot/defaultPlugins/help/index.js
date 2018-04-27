module.exports = {
  name: 'Help',
  description: 'A help utility for discord-bot.',
  rootCommand: 'help',
  process: (message, client) => {
    console.log('Help plugin');
  },
};
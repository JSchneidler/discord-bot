module.exports = {
  name: 'Help',
  description: 'A help utility for discord-bot.',
  rootCommand: 'help',
  process: (message, client) => {
    message.channel.send(`${message.author} Help: (TODO)`);
  },
};
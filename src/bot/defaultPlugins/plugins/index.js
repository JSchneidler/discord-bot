module.exports = {
  name: 'Plugins',
  description: 'A utility for managing and viewing installed plugins.',
  rootCommand: 'plugins',
  process: (message, client) => {
    message.channel.send(`${message.author} Plugins: (TODO)`);
  },
};
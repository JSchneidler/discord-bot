module.exports = {
  name: 'Plugins',
  description: 'A utility for managing and viewing installed plugins.',
  rootCommand: 'plugins',
  process: (message, client) => {
    console.log('Plugin plugin');
  },
};
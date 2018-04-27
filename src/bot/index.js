const Discord = require('discord.js');

const loadPlugins = require('./loadPlugins');

const BOT_TOKEN = process.env.BOT_TOKEN;

const client = new Discord.Client();
const installedPlugins = {};
const rootCommands = {};

loadPlugins().then(plugins => {
  for (let i = 0; i < plugins.length; i++) {
    let install = true;
    const plugin = plugins[i];
    const rootCommand = plugin.rootCommand || undefined;

    // TODO: Handle already existing command
    if (rootCommand) {
      if (rootCommands[rootCommand]) {
        install = false;
        console.error(`Cannot install plugin ${plugin.name},${plugin.default ? ' default' : ''} root command '${plugin.rootCommand}' already exists.`);
      } else rootCommands[rootCommand] = plugin.process;
    }

    if (install) installedPlugins[plugin.name] = plugin;
  }

  client.login(BOT_TOKEN);
});

client.on('ready', () => {
  console.log('Discord bot logged in');
  //console.log(`Logged in as ${client.user.tag}`);

  for (let key in installedPlugins) {
    const plugin = installedPlugins[key];

    if (plugin.setup) plugin.setup(client);
  }
});

client.on('message', msg => {
  if (msg.content.startsWith('!')) {
    const rootCommand = msg.content.slice(1).split(' ')[0];
    if (!rootCommand) return msg.reply('Unknown command');
    rootCommands[rootCommand](msg, client);
  }
});
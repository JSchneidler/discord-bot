import Discord from 'discord.js'

async function init() {
  const BOT_TOKEN = process.env.BOT_TOKEN;
  if (!BOT_TOKEN) {
    throw Error('BOT_TOKEN not set')
  }

  const client = new Discord.Client();

  client.on('ready', () => {
    console.log(`Discord bot logged in as ${client.user?.tag}`);
  })

  await client.login(BOT_TOKEN);
}

init()
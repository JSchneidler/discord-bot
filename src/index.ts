import { Client, TextChannel } from 'discord.js'
import moment from 'moment'

import { allowedIds, channelId, serverId } from './config'
import ec2 from './ec2'

enum SlashCommands {
  Status = 'status',
  Start ='start',
  Extend = 'extend',
  Stop ='stop',
  Reboot ='reboot'
}

async function init() {
  const BOT_TOKEN = process.env.BOT_TOKEN
  if (!BOT_TOKEN) {
    throw Error('BOT_TOKEN not set')
  }

  const client = new Client()

  let botChannel: TextChannel

  client.on('ready', async () => {
    console.log(`Discord bot logged in as ${client.user?.tag}`)

    registerSlashCommands()
    botChannel = await getBotChannel()
  })

  // @ts-expect-error: No support for interactions yet
  client.ws.on('INTERACTION_CREATE', async interaction => {
    console.log(`User '${interaction.member.nick}' called command '${interaction.data.name}'`)

    // Fail out if user is not allowed to perform slash commands
    if (!allowedIds.includes(interaction.member.user.id)) {
      return
    }

    switch(interaction.data.name) {
      case SlashCommands.Status:
        await sendServerStatus()
        break
      case SlashCommands.Start:
        if (!ec2.isRunning()) {
          await ec2.startServer(interaction.data.options ? interaction.data.options[0].value : undefined)
          const shutdownTime = moment(ec2.getShutdownTime())
          botChannel?.send(`Valheim server started. Shutdown time: ${shutdownTime.format('LT')} (${shutdownTime.fromNow()})`)
        } else botChannel?.send('Valheim server already running')
        break
      case SlashCommands.Extend:
        if (ec2.isRunning()) {
          await ec2.extendServer(interaction.data.options ? interaction.data.options[0].value : undefined)
          const shutdownTime = moment(ec2.getShutdownTime())
          botChannel?.send(`New shutdown time: ${shutdownTime.format('LT')} (${shutdownTime.fromNow()})`)
        } else botChannel?.send('Valheim server not running')
        break
      case SlashCommands.Stop:
        if (ec2.isRunning()) {
          await ec2.stopServer()
          botChannel?.send('Valheim server stopped')
        } else botChannel?.send('Valheim server not running')
        break
      case SlashCommands.Reboot:
      if (ec2.isRunning()) {
        await ec2.rebootServer()
        const shutdownTime = moment(ec2.getShutdownTime())
        botChannel?.send(`Rebooting Valheim server. New shutdown time: ${shutdownTime.format('LT')} (${shutdownTime.fromNow()})`)
      } else botChannel?.send('Valheim server not running')
        break
    }
  })

  await client.login(BOT_TOKEN)

  function registerSlashCommands() {
    // @ts-expect-error: No support for slash commands yet
    client.api.applications(client.user.id).guilds(serverId).commands.post({
      data: {
        name: 'status',
        description: 'Get status of Valheim server'
      }
    })

    // @ts-expect-error: No support for slash commands yet
    client.api.applications(client.user.id).guilds(serverId).commands.post({
      data: {
        name: 'start',
        description: 'Start the Valheim server for a specified number of hours or 12 by default',
        options: [
          {
            name: 'duration',
            description: 'The number of hours to start or extend the server for',
            type: 4,
            required: false
          }
        ]
      }
    })

    // @ts-expect-error: No support for slash commands yet
    client.api.applications(client.user.id).guilds(serverId).commands.post({
      data: {
        name: 'extend',
        description: 'Postpone the Valheim server shutdown time for a specified number of hours or 6 by default',
        options: [
          {
            name: 'duration',
            description: 'The number of hours to start or extend the server for',
            type: 4,
            required: false
          }
        ]
      }
    })

    // @ts-expect-error: No support for slash commands yet
    client.api.applications(client.user.id).guilds(serverId).commands.post({
      data: {
        name: 'stop',
        description: 'Shutdown Valheim server'
      }
    })

    // @ts-expect-error: No support for slash commands yet
    client.api.applications(client.user.id).guilds(serverId).commands.post({
      data: {
        name: 'reboot',
        description: 'Reboot Valheim server'
      }
    })
  }

  // Assigns the primary channel that the bot will post responses to
  async function getBotChannel(): Promise<TextChannel> {
    const channel = await client.channels.fetch(channelId)
    if (channel.type === 'text') {
      return channel as TextChannel
    } else {
      throw Error('Bot channel is not a text channel')
    }
  }

  async function sendServerStatus() {
    const status = await ec2.fetchServerStatus()
    if (status) {
      const shutdownTime = moment(ec2.getShutdownTime())
      botChannel?.send(`Valheim server status: ${status.state}`)
      if (ec2.isRunning()) botChannel?.send(`Shutdown time: ${shutdownTime.format('LT')} (${shutdownTime.fromNow()})`)
    }
  }
}

init()
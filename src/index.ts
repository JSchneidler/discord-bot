import config from 'config'
import { Client, TextChannel } from 'discord.js'
import moment, { Moment } from 'moment-timezone'

import ec2 from './ec2'

enum SlashCommands {
  Status = 'status',
  Start ='start',
  Extend = 'extend',
  Stop ='stop',
  Reboot ='reboot',
}

let shutdownTimer: NodeJS.Timeout
let shutdownTime: Moment

async function init() {
  const BOT_TOKEN = process.env.BOT_TOKEN
  if (!BOT_TOKEN) {
    throw Error('BOT_TOKEN not set')
  }

  const state = await ec2.fetchServerState()
  setShutdownTime(moment(state.launched).add(12, 'hours'))

  const client = new Client()

  let botChannel: TextChannel

  client.on('ready', async () => {
    console.log(`Discord bot logged in as ${client.user?.tag}`)

    registerSlashCommands()
    botChannel = await getBotChannel()
    await sendServerStatus()
  })

  // @ts-expect-error: No support for interactions yet
  client.ws.on('INTERACTION_CREATE', async interaction => {
    const caller = `User '${interaction.member.nick || interaction.member.user.username}' called command '${interaction.data.name}'`
    console.log(caller)
    botChannel?.send(caller)

    // Fail out if user is not allowed to perform slash commands
    if (!config.get<Array<string>>('allowedIds').includes(interaction.member.user.id)) {
      return
    }

    switch(interaction.data.name) {
      case SlashCommands.Status:
        await sendServerStatus()
        break
      case SlashCommands.Start:
        if (!ec2.isRunning()) {
          await ec2.startServer()
          setShutdownTime(moment().add(interaction.data.options ? interaction.data.options[0].value : 12, 'hours'))
          botChannel?.send(`Valheim server started. Shutdown time: ${getFriendlyTime(shutdownTime)})`)
        } else botChannel?.send('Valheim server already running')
        break
      case SlashCommands.Extend:
        if (ec2.isRunning()) {
          setShutdownTime(moment().add(interaction.data.options ? interaction.data.options[0].value : 6, 'hours'))
          botChannel?.send(`New shutdown time: ${getFriendlyTime(shutdownTime)})`)
        } else botChannel?.send('Valheim server not running')
        break
      case SlashCommands.Stop:
        if (ec2.isRunning()) {
          clearTimeout(shutdownTimer)
          shutdownTime = moment()
          await ec2.stopServer()
          botChannel?.send('Valheim server stopped')
        } else botChannel?.send('Valheim server not running')
        break
      case SlashCommands.Reboot:
      if (ec2.isRunning()) {
        await ec2.rebootServer()
        setShutdownTime(moment().add(12, 'hours'))
        botChannel?.send(`Rebooting Valheim server. New shutdown time: ${getFriendlyTime(shutdownTime)})`)
      } else botChannel?.send('Valheim server not running')
        break
    }
  })

  await client.login(BOT_TOKEN)

  function registerSlashCommands() {
    // @ts-expect-error: No support for slash commands yet
    client.api.applications(client.user.id).guilds(config.get('serverId')).commands.post({
      data: {
        name: 'status',
        description: 'Get status of Valheim server'
      }
    })

    // @ts-expect-error: No support for slash commands yet
    client.api.applications(client.user.id).guilds(config.get('serverId')).commands.post({
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
    client.api.applications(client.user.id).guilds(config.get('serverId')).commands.post({
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
    client.api.applications(client.user.id).guilds(config.get('serverId')).commands.post({
      data: {
        name: 'stop',
        description: 'Shutdown Valheim server'
      }
    })

    // @ts-expect-error: No support for slash commands yet
    client.api.applications(client.user.id).guilds(config.get('serverId')).commands.post({
      data: {
        name: 'reboot',
        description: 'Reboot Valheim server'
      }
    })
  }

  // Assigns the primary channel that the bot will post responses to
  async function getBotChannel(): Promise<TextChannel> {
    const channel = await client.channels.fetch(config.get('channelId'))
    if (channel.type === 'text') {
      return channel as TextChannel
    } else {
      throw Error('Bot channel is not a text channel')
    }
  }

  async function sendServerStatus() {
    const status = await ec2.fetchServerState()
    if (status) {
      // botChannel?.send(`Valheim server (${status.ip}:2457) status: ${status.state}`)
      botChannel?.send(`Valheim server status: ${status.state}`)
      if (ec2.isRunning()) botChannel?.send(`Shutdown time: ${getFriendlyTime(shutdownTime)})`)
    }
  }
}

function setShutdownTime(newTime: Moment): void {
  if (shutdownTimer) clearTimeout(shutdownTimer)
  shutdownTime = newTime
  shutdownTimer = setTimeout(() => ec2.stopServer(), shutdownTime.diff(moment()))

  // TODO: Broadcast new shutdown time to Discord server
  console.log(`Server shutdown scheduled for ${shutdownTime.format('LT')} (${shutdownTime.fromNow()})`)
}

function getFriendlyTime(date: Moment) {
  return `${date.tz(config.get('timezone')).format('LT')} (${date.fromNow()}`
}

init()
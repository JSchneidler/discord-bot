import config from 'config'
import { Client } from 'discord.js'
import moment, { Moment } from 'moment-timezone'
import axios from 'axios'

import ec2 from './ec2'

enum SlashCommands {
  Status = 'status',
  Start ='start',
  Extend = 'extend',
  Stop ='stop',
  Reboot ='reboot',
}

enum InteractionResponseType {
  Pong = 1,
  ChannelMessageWithSource = 4,
  DeferredChannelMessageWithSource = 5,
}

let shutdownTimer: NodeJS.Timeout
let shutdownTime: Moment

async function init() {
  const BOT_TOKEN = process.env.BOT_TOKEN
  if (!BOT_TOKEN) {
    throw Error('BOT_TOKEN not set')
  }

  const state = await ec2.fetchServerState()
  if (state.running)
    setShutdownTime(moment().add(12, 'hours'))

  const client = new Client()

  client.on('ready', async () => {
    console.log(`Discord bot logged in as ${client.user?.tag}`)

    registerSlashCommands()
  })

  // @ts-expect-error: No support for interactions yet
  client.ws.on('INTERACTION_CREATE', async interaction => {
    const caller = `User '${interaction.member.nick || interaction.member.user.username}' called command '${interaction.data.name}'`
    console.log(caller)

    const isAllowedByRole = interaction.member.roles.includes(config.get<string>('allowedDiscordRole'))
    const isAllowedByUserId = config.get<Array<string>>('allowedDiscordUserIds').includes(interaction.member.user.id)

    // Silent exit out if user is not allowed to perform slash commands
    if (!(isAllowedByRole || isAllowedByUserId)) {
      return
    }

    const state = await ec2.fetchServerState()
    let response = ''

    switch(interaction.data.name) {
      case SlashCommands.Status:
        if (state) {
          response = `Valheim server (${state.ip + ':2457' || 'No IP'}) status: ${state.state}`
          if (state.running) response += `Shutdown time: ${getFriendlyTime(shutdownTime)})`
        }
        break
      case SlashCommands.Start:
        if (!state.running) {
          await ec2.startServer()
          setShutdownTime(moment().add(interaction.data.options ? interaction.data.options[0].value : 12, 'hours'))
          response = `Valheim server started. Shutdown time: ${getFriendlyTime(shutdownTime)})`
        } else
          response = 'Valheim server already running'
        break
      case SlashCommands.Extend:
        if (state.running) {
          setShutdownTime(moment().add(interaction.data.options ? interaction.data.options[0].value : 6, 'hours'))
          response = `New shutdown time: ${getFriendlyTime(shutdownTime)})`
        } else
          response = 'Valheim server not running'
        break
      case SlashCommands.Stop:
        if (state.running) {
          clearTimeout(shutdownTimer)
          shutdownTime = moment()
          await ec2.stopServer()
          response = 'Valheim server stopped'
        } else
          response = 'Valheim server not running'
        break
      case SlashCommands.Reboot:
      if (state.running) {
        await ec2.rebootServer()
        setShutdownTime(moment().add(12, 'hours'))
        response = `Rebooting Valheim server. New shutdown time: ${getFriendlyTime(shutdownTime)})`
      } else
        response = 'Valheim server not running'
        break
    }

    // Respond to interaction
    const url = `https://discord.com/api/v8/interactions/${interaction.id}/${interaction.token}/callback`
    await axios.post(url, {
      type: InteractionResponseType.ChannelMessageWithSource,
      data: {
        content: response
      }
    })
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
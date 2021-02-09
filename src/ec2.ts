import { DescribeInstancesCommand, EC2Client, InstanceStateName, RebootInstancesCommand, StartInstancesCommand, StopInstancesCommand } from '@aws-sdk/client-ec2'
import moment, { Moment } from 'moment'

import { ec2Region, ec2InstanceId } from './config'

interface EC2Status {
  state?: InstanceStateName,
  launched?: Date
}

class EC2 {
  private shutdownTimer?: NodeJS.Timeout
  private shutdownTime?: Moment
  private running = false
  private client = new EC2Client({
    region: ec2Region
  })

  constructor() {
    this.refreshServerState()
  }

  async fetchServerStatus(): Promise<EC2Status> {
    const response = await this.client.send(new DescribeInstancesCommand({ InstanceIds: [ec2InstanceId]} ))
    if (response.Reservations && response.Reservations[0] && response.Reservations[0].Instances && response.Reservations[0].Instances[0].State) {
      return {
        state: response.Reservations[0].Instances[0].State.Name as InstanceStateName,
        launched: response.Reservations[0].Instances[0].LaunchTime
      }
    } else {
      throw Error('Unable to fetch EC2 server status')
    }
  }

  async stopServer(): Promise<void> {
    if (this.running) {
      if (this.shutdownTimer) clearTimeout(this.shutdownTimer)

      await this.client.send(new StopInstancesCommand({ InstanceIds: [ec2InstanceId]} ))
      console.log('Valheim server stopped')
      await this.refreshServerState()
    }
  }

  async startServer(hours = 12): Promise<void> {
    if (!this.running) {
      this.setShutdownTime(moment().add(hours, 'hours'))

      await this.client.send(new StartInstancesCommand({ InstanceIds: [ec2InstanceId]} ))
      await this.refreshServerState()
    }
  }

  async extendServer(hours = 6): Promise<void> {
    if (this.running) {
      this.setShutdownTime(moment().add(hours, 'hours'))

      await this.refreshServerState()
    }
  }

  async rebootServer(): Promise<void> {
    this.setShutdownTime(moment().add(12, 'hours'))

    await this.client.send(new RebootInstancesCommand({ InstanceIds: [ec2InstanceId]} ))
    await this.refreshServerState()
  }

  public setShutdownTime(shutdownTime: Moment): void {
    if (this.shutdownTimer) clearTimeout(this.shutdownTimer)
    this.shutdownTime = shutdownTime
    this.shutdownTimer = setTimeout(this.stopServer, shutdownTime.diff(moment()))

    console.log(`Server shutdown scheduled for ${shutdownTime.format('LT')} (${shutdownTime.fromNow()})`)
  }

  public getShutdownTime() {
    return this.shutdownTime
  }

  public isRunning() {
    return this.running
  }

  private async refreshServerState() {
    const status = await this.fetchServerStatus()
    if (status.state === 'running' || status.state === 'pending') {
      this.running = true
      if (!this.shutdownTime) this.setShutdownTime(moment(status.launched).add(12, 'hours'))
    } else this.running = false
  }
}

export default new EC2()
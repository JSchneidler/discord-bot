import config from 'config'
import { DescribeInstancesCommand, EC2Client, InstanceStateName, RebootInstancesCommand, StartInstancesCommand, StopInstancesCommand } from '@aws-sdk/client-ec2'

interface EC2Status {
  state?: InstanceStateName,
  launched?: Date
}

class EC2 {
  private running = false
  private client = new EC2Client({
    region: config.get('ec2Region')
  })

  async fetchServerState(): Promise<EC2Status> {
    const response = await this.client.send(new DescribeInstancesCommand({ InstanceIds: [config.get('ec2InstanceId')]} ))

    if (response.Reservations && response.Reservations[0] && response.Reservations[0].Instances && response.Reservations[0].Instances[0].State) {
      const state = response.Reservations[0].Instances[0].State.Name as InstanceStateName
      if (state === 'running' || state === 'pending') {
        this.running = true
      } else this.running = false

      return {
        state,
        launched: response.Reservations[0].Instances[0].LaunchTime
      }
    } else {
      throw Error('Unable to fetch EC2 server status')
    }
  }

  async stopServer(): Promise<void> {
    if (this.running) {
      await this.client.send(new StopInstancesCommand({ InstanceIds: [config.get('ec2InstanceId')]} ))
      console.log('Valheim server stopped')
      // await this.fetchServerState()
    }
  }

  async startServer(): Promise<void> {
    if (!this.running) {
      await this.client.send(new StartInstancesCommand({ InstanceIds: [config.get('ec2InstanceId')]} ))
      console.log('Valheim server started')
      // await this.fetchServerState()
    }
  }

  async rebootServer(): Promise<void> {
    if (this.running) {
      await this.client.send(new RebootInstancesCommand({ InstanceIds: [config.get('ec2InstanceId')]} ))
      // await this.fetchServerState()
    }
  }

  public isRunning() {
    return this.running
  }
}

export default new EC2()
import config from 'config'
import { DescribeAddressesCommand, DescribeInstancesCommand, EC2Client, InstanceStateName, RebootInstancesCommand, StartInstancesCommand, StopInstancesCommand } from '@aws-sdk/client-ec2'

interface EC2Status {
  state?: InstanceStateName,
  ip?: string,
  launched?: Date
}

class EC2 {
  private running = false
  private client = new EC2Client({
    region: config.get('ec2Region')
  })

  async fetchServerState(): Promise<EC2Status> {
    const response = await this.client.send(new DescribeInstancesCommand({ InstanceIds: [config.get('ec2InstanceId')]} ))
    const elasticIp = await this.fetchElasticIp()

    if (response.Reservations && response.Reservations[0] && response.Reservations[0].Instances && response.Reservations[0].Instances[0].State) {
      const state = response.Reservations[0].Instances[0].State.Name as InstanceStateName
      if (state === 'running' || state === 'pending') {
        this.running = true
      } else this.running = false

      return {
        state,
        ip: elasticIp,
        launched: response.Reservations[0].Instances[0].LaunchTime
      }
    } else {
      throw Error('Unable to fetch EC2 server status')
    }
  }

  async stopServer(): Promise<void> {
    if (this.running) {
      await this.client.send(new StopInstancesCommand({ InstanceIds: [config.get('ec2InstanceId')]} ))
      this.running = false
      console.log('Valheim server stopped')
      // await this.fetchServerState()
    }
  }

  async startServer(): Promise<void> {
    if (!this.running) {
      await this.client.send(new StartInstancesCommand({ InstanceIds: [config.get('ec2InstanceId')]} ))
      this.running = true
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

  isRunning() {
    return this.running
  }

  private async fetchElasticIp() {
    const response = await this.client.send(new DescribeAddressesCommand({
      Filters: [
        {Name: 'instance-id', Values: [config.get('ec2InstanceId')]}
      ]
    }))

    if (response.Addresses) return response.Addresses[0].PublicIp
  }
}

export default new EC2()
import { Injectable } from '@nestjs/common'
import vaultAuthAws from 'vault-auth-aws'
import nodeVault from 'node-vault'

@Injectable()
export class AppService {
  async getHello() {
    return 'Hello'
  }
}

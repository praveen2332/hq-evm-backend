import {Body, Controller, Get, NotFoundException, Param, Post, ValidationPipe} from '@nestjs/common'
import {ApiTags} from '@nestjs/swagger'
import {WalletsService} from '../common/services/providers/wallets.service'
import {AuthWallet} from '../common/services/providers/wallet.entity'
import {AddressPipe} from '../common/pipes/address.pipe'
import {SignMessage} from '../common/constants'
import {CreateWalletDto} from './interfaces'
import {EmailService} from '../common/services/providers/email.service'
import {TwitterService} from '../common/services/providers/twitter.service'
import {Account} from '../common/services/account/account.entity'
import {AccountsService} from '../common/services/account/accounts.service'

@ApiTags('providers')
@Controller('providers')
export class ProvidersController {
  constructor(
    private accountsService: AccountsService,
    private walletsService: WalletsService,
    private emailService: EmailService,
    private twitterService: TwitterService
  ) {
  }

  @Get('wallet/:address')
  async get(@Param('address', new AddressPipe()) address: string) {
    const wallet = await this.walletsService.findOneByAddress(address)
    if (wallet) {
      wallet.nonce = `${SignMessage} (${wallet.nonce})`
      return wallet
    }

    throw new NotFoundException()
  }

  @Post('wallet')
  async post(@Body(new ValidationPipe()) createWalletDto: CreateWalletDto) {
    let wallet = await this.walletsService.findOneByAddress(createWalletDto.address)
    if (wallet) {
      wallet.nonce = `${SignMessage} (${wallet.nonce})`
      return wallet
    }
    const isNewAccount = true
    wallet = new AuthWallet()
    wallet.address = createWalletDto.address
    const nonce = this.walletsService.generateNonce()
    wallet.nonce = nonce

    const account = new Account()
    account.name = createWalletDto.address
    account.firstName = createWalletDto.firstName
    account.lastName = createWalletDto.lastName
    account.walletAccounts = [wallet]

    await this.walletsService.add(wallet)
    await this.accountsService.create(account)
    wallet.nonce = `${SignMessage} (${nonce})`

    return {...wallet, isNewAccount}
  }
}

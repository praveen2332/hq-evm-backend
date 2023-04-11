import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { recoverPersonalSignature } from 'eth-sig-util'
import { bufferToHex } from 'ethereumjs-util'
import { SignMessage } from '../common/constants'
import { jwtTokenHelper } from '../common/helpers/jwtToken.helper'
import { LoggerService } from '../common/logger/logger.service'
import { Account } from '../common/services/account/account.entity'
import { AccountsService } from '../common/services/account/accounts.service'
import { MembersService } from '../common/services/members/members.service'
import { AuthEmail } from '../common/services/providers/email.entity'
import { EmailService } from '../common/services/providers/email.service'
import { AuthTwitter } from '../common/services/providers/twitter.entity'
import { AuthWallet } from '../common/services/providers/wallet.entity'
import { WalletsService } from '../common/services/providers/wallets.service'
import { jwtConstants } from './constants'
import { EProvider, JwtPayload, LoginAuthDto, SignUpAuthDto } from './interfaces'

@Injectable()
export class AuthService {
  constructor(
    private walletsService: WalletsService,
    private emailService: EmailService,
    private accountsService: AccountsService,
    private membersService: MembersService,
    private jwtService: JwtService,
    private logger: LoggerService
  ) {}

  async login(authDto: LoginAuthDto): Promise<{ accessToken: string; account: Account } | null> {
    const { address, signature, token, provider = EProvider.EMAIL } = authDto
    let { account, auth } = await this.getAccount({
      address,
      token,
      provider
    })

    if (!account) {
      return null
    }

    try {
      if (provider === EProvider.EMAIL) {
        const jwtDecoded = await jwtTokenHelper.parseJWT(token)

        if (!jwtDecoded) {
          throw new BadRequestException('Token is not valid')
        }

        const accessToken = this.generateEmailAccessToken({
          verifierId: jwtDecoded.verifierId,
          authId: auth.id,
          accountId: account.id,
          provider: provider
        })
        return {
          accessToken,
          account
        }
      } else if (provider === EProvider.WALLET) {
        const msg = `${SignMessage} (${(auth as AuthWallet).nonce})`
        const msgBufferHex = bufferToHex(Buffer.from(msg, 'utf8'))
        const recoverAddress = recoverPersonalSignature({
          data: msgBufferHex,
          sig: signature
        })

        // The signature verification is successful if the address found with
        // sigUtil.recoverPersonalSignature matches the initial address
        if (address.toLowerCase() !== recoverAddress.toLowerCase()) {
          throw new BadRequestException('Signature is not valid')
        }

        const accessToken = this.generateWalletAccessToken({
          address,
          accountId: account.id,
          walletId: auth.id,
          provider: provider
        })
        return {
          accessToken,
          account
        }
      } else {
        throw new BadRequestException()
      }
    } catch (error) {
      this.logger.error(error)
      throw new UnauthorizedException('Invalid token')
    }
  }

  generateAccessToken(payload: JwtPayload) {
    return this.jwtService.sign(payload, { expiresIn: jwtConstants.tokenExpiration })
  }

  generateEmailAccessToken(params: { verifierId: string; authId: string; accountId: string; provider: EProvider }) {
    return this.generateAccessToken({
      address: '',
      verifierId: params.verifierId,
      authId: params.authId,
      accountId: params.accountId,
      walletId: '',
      provider: params.provider,
      organizationId: ''
    })
  }

  generateWalletAccessToken(params: { address: string; walletId: string; accountId: string; provider: EProvider }) {
    return this.generateAccessToken({
      address: params.address,
      verifierId: '',
      accountId: params.accountId,
      authId: '',
      walletId: params.walletId,
      provider: params.provider,
      organizationId: ''
    })
  }

  async signUp(authDto: SignUpAuthDto) {
    const signUpCred = await this.login(authDto)
    if (signUpCred) {
      return signUpCred
    }

    const { token, provider = EProvider.EMAIL } = authDto
    const jwtDecoded = await jwtTokenHelper.parseJWT(token)

    if (!jwtDecoded) {
      throw new BadRequestException('Token is not valid')
    }

    try {
      const newAccount = new Account()
      newAccount.firstName = authDto.firstName
      newAccount.lastName = authDto.lastName
      newAccount.image = jwtDecoded.profileImage

      if (provider === EProvider.EMAIL) {
        const emailAccount = new AuthEmail()
        emailAccount.email = jwtDecoded.email
        emailAccount.verifierId = jwtDecoded.verifierId
        newAccount.emailAccounts = [emailAccount]
        newAccount.name = jwtDecoded.email

        const createdEmailAccount = await this.emailService.create(emailAccount)
        const createdAccount = await this.accountsService.create(newAccount)

        const accessToken = this.generateEmailAccessToken({
          verifierId: jwtDecoded.verifierId,
          authId: createdEmailAccount.id,
          accountId: createdAccount.id,
          provider: provider
        })

        return {
          accessToken,
          account: createdAccount
        }
      } else if (provider === EProvider.WALLET) {
        const wallet = new AuthWallet()
        wallet.address = authDto.address
        const nonce = this.walletsService.generateNonce()
        wallet.nonce = nonce

        newAccount.walletAccounts = [wallet]
        newAccount.name = authDto.address
        await this.walletsService.add(wallet)
        await this.accountsService.create(newAccount)
        wallet.nonce = `${SignMessage} (${nonce})`
      } else {
        throw new BadRequestException('Unknown provider')
      }
    } catch (error) {
      this.logger.error(error)
      throw new UnauthorizedException('Invalid token')
    }
  }

  async getAccount(params: {
    address: string
    token: string
    provider: EProvider
  }): Promise<{ account: Account | null; auth: AuthEmail | AuthTwitter | AuthWallet | null }> {
    const { address, token, provider = EProvider.EMAIL } = params
    const empty = {
      account: null,
      auth: null
    }

    try {
      if (provider === EProvider.EMAIL) {
        const jwtDecoded = await jwtTokenHelper.parseJWT(token)

        if (!jwtDecoded) {
          throw new BadRequestException('Token is not valid')
        }

        const { verifierId } = jwtDecoded as any
        let auth = await this.emailService.findOne({ where: { verifierId } })
        if (!auth) {
          return empty
        }
        const account = await this.accountsService.findOne({ where: { emailAccounts: { id: auth.id } } })
        if (!account) {
          return empty
        }

        return {
          auth,
          account
        }
      } else if (provider === EProvider.WALLET) {
        const auth = await this.walletsService.findOneByAddress(address)
        if (!auth) {
          return empty
        }

        const account = await this.accountsService.findOne({ where: { walletAccounts: { id: auth.id } } })

        if (!account) {
          return empty
        }

        return {
          auth,
          account
        }
      }
    } catch (e) {
      this.logger.error(e, { params })
      throw new BadRequestException('Token is not valid')
    }
    throw new BadRequestException(`Unknown provider`)
  }
}

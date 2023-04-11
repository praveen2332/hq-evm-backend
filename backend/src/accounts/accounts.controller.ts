import {Body, Controller, Get, NotFoundException, Put, Req, UseGuards, ValidationPipe} from '@nestjs/common'
import {ApiBearerAuth, ApiTags} from '@nestjs/swagger'
import {AccountsService} from '../common/services/account/accounts.service'
import {UpdateAccountDto} from './interfaces'
import {JwtAuthGuard} from '../auth/jwt-auth.guard'
import {RolesService} from '../common/services/roles/roles.service'
import {EProvider, JwtPayload} from '../auth/interfaces'
import {JwtUser} from '../common/decorators/jwtUser/jwt-user.decorator';

@ApiTags('accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('accounts')
export class AccountsController {
  constructor(
    private rolesService: RolesService,
    private accountsService: AccountsService
  ) {
  }

  @Get()
  async getMyAccount(@Req() req) {
    return this.getMe(req.user)
  }

  @Get('me')
  async getMe(@JwtUser() user: JwtPayload) {
    const {accountId, authId, provider, walletId} = user
    const findOptions = []
    const relations = []
    switch (provider) {
      case EProvider.EMAIL:
        findOptions.push({id: accountId, emailAccounts: {id: authId}})
        relations.push('emailAccounts')
        break
      case EProvider.TWITTER:
        findOptions.push({id: accountId, twitterAccounts: {id: authId}})
        relations.push('twitterAccounts')
        break
      case EProvider.WALLET:
        findOptions.push({id: accountId, walletAccounts: {id: walletId}})
        relations.push('walletAccounts')
        break
    }
    return this.accountsService.findOne({where: findOptions, relations})
  }

  @Put('me')
  async updateMe(@Body(new ValidationPipe()) updateAccountDto: UpdateAccountDto, @JwtUser() user: JwtPayload) {
    const account = await this.accountsService.findOne({where: {id: user.accountId}})
    if (account) {
      account.firstName = updateAccountDto.firstName
      account.lastName = updateAccountDto.lastName
      account.image = updateAccountDto.image

      await this.accountsService.update(account)

      return account
    }

    throw new NotFoundException()
  }

  // @Put(':id')
  // async put(
  //   @Body(new ValidationPipe()) updateAccountDto: UpdateAccountDto,
  //   @Param('id', new ParseUUIDPipe()) id: string
  // ) {
  //   const account = await this.accountsService.findOne({where: {id}})
  //   if (account) {
  //     account.firstName = updateAccountDto.firstName
  //     account.lastName = updateAccountDto.lastName
  //     account.image = updateAccountDto.image
  //
  //     await this.accountsService.update(account)
  //
  //     return account
  //   }
  //
  //   throw new NotFoundException()
  // }

  // @Delete(':id')
  // async delete(@Param('id', new ParseUUIDPipe()) id: string) {
  //   const account = await this.accountsService.findOne({where: {id}})
  //   if (account) {
  //     return this.accountsService.softDelete(account.id)
  //   }
  //
  //   throw new NotFoundException()
  // }
}

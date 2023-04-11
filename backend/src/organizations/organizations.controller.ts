import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Req,
  UseGuards,
  ValidationPipe
} from '@nestjs/common'
import { ApiBearerAuth, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AuthService } from '../auth/auth.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CategoriesService } from '../categories/categories.service'
import { systemCategories } from '../common/constants'
import { NoAuth } from '../common/decorators/no-auth.decorator'
import { AccountsService } from '../common/services/account/accounts.service'
import { FiatCurrenciesService } from '../common/services/fiat-currencies/fiat-currencies.service'
import { CostBasisCalculationMethod } from '../common/services/gains-losses/interfaces'
import { OrganizationAddressesService } from '../common/services/general/organization-addresses.service'
import { MembersService } from '../common/services/members/members.service'
import { OrganizationSetting } from '../common/services/organization-settings/organization-setting.entity'
import { OrganizationSettingsService } from '../common/services/organization-settings/organization-settings.service'
import { Organization } from '../common/services/organizations/organization.entity'
import { OrganizationsService } from '../common/services/organizations/organizations.service'
import { RolesService } from '../common/services/roles/roles.service'
import { TimezonesService } from '../common/services/timezones/timezones.service'
import { WalletGroup } from '../common/services/wallet-groups/wallet-group.entity'
import { WalletGroupsService } from '../common/services/wallet-groups/wallet-groups.service'
import { ERole } from '../roles/interfaces'
import { CreateOrganizationDto, PublicOrganizationDto, UpdateOrganizationDto, ValidateAddressDto } from './interfaces'
import { CountriesService } from '../common/services/countries/countries.service'

@ApiTags('organizations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationsController {
  DEFAULT_WALLET_GROUP_NAME = `Default Group`

  constructor(
    private organizationsService: OrganizationsService,
    private memberService: MembersService,
    private categoriesService: CategoriesService,
    private authsService: AuthService,
    private accountsService: AccountsService,
    private rolesService: RolesService,
    private organizationAddressesService: OrganizationAddressesService,
    private walletGroupsService: WalletGroupsService,
    private organizationSettingsService: OrganizationSettingsService,
    private fiatCurrenciesService: FiatCurrenciesService,
    private timezonesService: TimezonesService,
    private countriesService: CountriesService
  ) {}

  @Get('me')
  @ApiResponse({ status: 200, type: [Organization] })
  async getMyOrganizations(@Req() req) {
    const { accountId } = req.user

    const findOptions = []
    findOptions.push({ members: { account: { id: accountId } } })

    const organizations = await this.organizationsService.find({
      where: findOptions,
      relations: ['members', 'members.role', 'members.role.permissions']
    })

    return organizations
  }

  @Get(':id/public')
  @NoAuth()
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, type: [PublicOrganizationDto] })
  async getPublicOrganization(@Param('id', new ParseUUIDPipe()) organizationId: string) {
    const organization = await this.organizationsService.findByPublicId(organizationId)

    if (organization) {
      return PublicOrganizationDto.map({ organization: organization })
    }

    throw new NotFoundException()
  }

  @Post(':id/public')
  @NoAuth()
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, type: [PublicOrganizationDto] })
  async getAndValidatePublicOrganization(
    @Param('id', new ParseUUIDPipe()) publicId: string,
    @Body(new ValidationPipe()) validateAddressDto: ValidateAddressDto
  ) {
    const organization = await this.organizationsService.findByPublicId(publicId)

    if (organization) {
      const isAddressValid = await this.organizationAddressesService.isWallet(
        validateAddressDto.address,
        organization.id
      )

      if (!isAddressValid) {
        throw new BadRequestException('Address is not valid')
      }

      return PublicOrganizationDto.map({ organization: organization })
    }

    throw new NotFoundException()
  }

  @Get('connect/:organizationId')
  @ApiResponse({ status: 200 })
  async connectOrganization(@Param('organizationId') organizationId: string, @Req() req) {
    const { verifierId, address, authId, walletId, accountId, provider, roles } = req.user

    const findOptions = []
    findOptions.push({ members: { account: { id: accountId } }, publicId: organizationId })

    const organization = await this.organizationsService.findOne({
      where: findOptions,
      relations: ['members']
    })

    if (!organization) {
      throw new ForbiddenException('Forbidden resource')
    }

    const account = await this.accountsService.findOne({ where: { id: accountId } })
    account.activeOrganizationId = organizationId
    await this.accountsService.create(account)

    const accessToken = this.authsService.generateAccessToken({
      verifierId,
      address,
      walletId,
      authId,
      accountId,
      provider,
      roles,
      organizationId
    })

    return {
      accessToken,
      organization
    }
  }

  @Get(':id')
  @ApiResponse({ status: 200, type: Organization })
  async get(@Param('id', new ParseUUIDPipe()) id: string) {
    const organization = await this.organizationsService.findByPublicId(id)
    if (organization) {
      return organization
    }

    throw new NotFoundException()
  }

  @Post()
  @ApiResponse({ status: 200, type: Organization })
  async create(@Body(new ValidationPipe()) createOrganizationDto: CreateOrganizationDto, @Req() req) {
    const { accountId } = req.user
    const organizations = await this.organizationsService.find({
      where: { members: { account: { id: accountId } }, name: createOrganizationDto.name },
      relations: ['members', 'members.role']
    })

    if (organizations.length) {
      throw new BadRequestException(
        'You have an organisation with the same name, please pick another name for this organisation'
      )
    }

    createOrganizationDto.members = []
    const account = await this.accountsService.findOne({ where: { id: accountId } })
    const role = await this.rolesService.findOne({ where: { name: ERole.Owner } })
    const member = await this.memberService.createNewMember({
      organization: null,
      account,
      role
    })
    createOrganizationDto.members.push(member)

    const organization = new Organization()

    organization.name = createOrganizationDto.name
    organization.type = createOrganizationDto.type
    organization.members = createOrganizationDto.members
    const newOrganization = await this.organizationsService.create(organization)

    // @TODO: should create system categories to new organizations
    systemCategories.forEach((category) =>
      this.categoriesService.create({
        name: category.name,
        type: category.type,
        description: category.descrition,
        code: category.code,
        organization: newOrganization
      })
    )
    const defaultWalletGroup = WalletGroup.create({
      name: this.DEFAULT_WALLET_GROUP_NAME,
      organizationId: newOrganization.id
    })
    await this.walletGroupsService.create(defaultWalletGroup)

    const currency = await this.fiatCurrenciesService.getDefault()
    const timezone = await this.timezonesService.getDefault()
    const country = await this.countriesService.getDefault()

    const setting = OrganizationSetting.create({
      organization: newOrganization,
      fiatCurrency: currency,
      costBasisMethod: CostBasisCalculationMethod.FIFO,
      timezone: timezone,
      country
    })

    await this.organizationSettingsService.create(setting)

    return newOrganization
  }

  @Put(':id')
  @ApiResponse({ status: 200, type: Organization })
  async update(@Body(new ValidationPipe()) updateOrganizationDto: UpdateOrganizationDto) {
    const organization = await this.organizationsService.findOne({
      where: { id: updateOrganizationDto.id }
    })
    if (organization) {
      organization.name = updateOrganizationDto.name
      organization.type = updateOrganizationDto.type
      return this.organizationsService.update(organization)
    }

    throw new NotFoundException()
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    const organization = await this.organizationsService.findOne({
      where: { id }
    })
    if (organization) {
      return this.organizationsService.softDelete(id)
    }

    throw new NotFoundException()
  }
}

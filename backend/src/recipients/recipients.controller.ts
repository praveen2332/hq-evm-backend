import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  ValidationPipe
} from '@nestjs/common'
import { ApiBearerAuth, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { PostgresErrorCode } from '../common/constants'
import { RequirePermissionAction, RequirePermissionResource } from '../common/decorators/permissions.decorator'
import { PermissionsGuard } from '../common/guards/permissions.guard'
import { RecipientAddress } from '../common/services/contacts/addresses/address.entity'
import { RecipientAddressesService } from '../common/services/contacts/addresses/addresses.service'
import { ContactProvidersService } from '../common/services/contacts/contacts/contacts.service'
import { RecipientContact } from '../common/services/contacts/contacts/recipient-contact.entity'
import { RecipientContactsService } from '../common/services/contacts/contacts/recipient-contact.service'
import { Recipient } from '../common/services/contacts/recipient.entity'
import { RecipientsService } from '../common/services/contacts/recipients.service'
import { OrganizationAddressesService } from '../common/services/general/organization-addresses.service'
import { OrganizationsService } from '../common/services/organizations/organizations.service'
import { TokensService } from '../common/services/tokens/tokens.service'
import { PaginationResponse } from '../core/interfaces'
import { Action, Resource } from '../permissions/interfaces'
import { CreateRecipientDto, RecipientQuery } from './interface'
import { CryptocurrenciesService } from '../common/services/cryptocurrencies/cryptocurrencies.service'

@ApiTags('recipients')
@ApiBearerAuth()
@RequirePermissionResource(Resource.RECIPIENTS)
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class RecipientsController {
  constructor(
    private organizationsService: OrganizationsService,
    private recipientAddressesService: RecipientAddressesService,
    private tokensService: TokensService,
    private contactProvidersService: ContactProvidersService,
    private recipientContactsService: RecipientContactsService,
    private recipientsService: RecipientsService,
    private organizationAddressesService: OrganizationAddressesService,
    private cryptocurrenciesService: CryptocurrenciesService
  ) {}

  @Get()
  @RequirePermissionAction(Action.READ)
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiResponse({ status: 200, type: PaginationResponse })
  async getAll(@Query() query: RecipientQuery, @Param('organizationId') organizationId: string) {
    return this.recipientsService.getRecipients(query, organizationId)
  }

  @Get('contact-provider')
  @ApiParam({ name: 'organizationId', type: 'string' })
  async getContactProviders() {
    return this.contactProvidersService.find({})
  }

  @Get(':id')
  @RequirePermissionAction(Action.READ)
  @ApiParam({ name: 'organizationId', type: 'string' })
  async getRecipient(@Param('id') id: string) {
    const recipient = await this.recipientsService.get(id, {
      relations: [
        'organization',
        'recipientContacts',
        'recipientAddresses',
        'recipientContacts.contactProvider',
        'recipientAddresses.token'
      ]
    })
    if (recipient) {
      return recipient
    }

    throw new NotFoundException()
  }

  @Post()
  @RequirePermissionAction(Action.CREATE)
  @ApiParam({ name: 'organizationId', type: 'string' })
  async createRecipient(
    @Body() createRecipientDto: CreateRecipientDto,
    @Param('organizationId') organizationId: string
  ) {
    const organization = await this.organizationsService.findByPublicId(organizationId)

    for (const wallet of createRecipientDto.wallets) {
      const validationResponse = await this.organizationAddressesService.getAddressLocation(
        wallet.address,
        wallet.blockchainId,
        organization.id
      )

      if (!!validationResponse) {
        throw new BadRequestException(`This address exists in '${validationResponse.message}'.`)
      }
    }

    try {
      const recipient = new Recipient()

      recipient.organization = organization
      recipient.organizationName = createRecipientDto.organizationName
      recipient.organizationAddress = createRecipientDto.organizationAddress
      recipient.type = createRecipientDto.type
      recipient.contactName = createRecipientDto.contactName
      recipient.deletedAt = null
      recipient.recipientAddresses = []
      recipient.recipientContacts = []

      createRecipientDto.wallets = [
        ...new Map(
          createRecipientDto.wallets.map((item) => [item.blockchainId + item.address.toLowerCase(), item])
        ).values()
      ]

      const numberOfWallets = createRecipientDto.wallets.length

      for (let i = 0; i < numberOfWallets; i++) {
        const recipientAddress = new RecipientAddress()
        recipientAddress.address = createRecipientDto.wallets[i].address
        const cryptocurrency = await this.cryptocurrenciesService.getBySymbol(
          createRecipientDto.wallets[i].cryptocurrencySymbol
        )
        if (!cryptocurrency) {
          throw new BadRequestException(
            `Cryptocurrency with symbol ${createRecipientDto.wallets[i].cryptocurrencySymbol} not found`
          )
        }
        const token = await this.tokensService.getBySymbol(cryptocurrency.symbol)

        recipientAddress.blockchainId = createRecipientDto.wallets[i].blockchainId
        recipientAddress.cryptocurrency = cryptocurrency
        recipientAddress.token = token

        await this.recipientAddressesService.create(recipientAddress)
        recipient.recipientAddresses.push(recipientAddress)
      }

      const numberOfContacts = createRecipientDto.contacts.length

      for (let i = 0; i < numberOfContacts; i++) {
        const contact = new RecipientContact()
        contact.content = createRecipientDto.contacts[i].content
        const contactProvider = await this.contactProvidersService.get(createRecipientDto.contacts[i].providerId)
        contact.contactProvider = contactProvider
        await this.recipientContactsService.create(contact)
        recipient.recipientContacts.push(contact)
      }

      await this.recipientsService.create(recipient)

      return recipient
    } catch (error) {
      console.log(error)
      if (
        error?.code === PostgresErrorCode.UniqueViolation ||
        error?.data?.code === PostgresErrorCode.UniqueViolation
      ) {
        throw new BadRequestException('Contact name already exists')
      }
      throw new InternalServerErrorException()
    }
  }

  @Put(':id')
  @ApiParam({ name: 'organizationId', type: 'string' })
  @ApiResponse({ status: 200, type: Recipient })
  @RequirePermissionAction(Action.UPDATE)
  async update(@Body(new ValidationPipe()) updateRecipientDto: CreateRecipientDto, @Param('id') id: string) {
    const recipient = await this.recipientsService.get(id, {
      relations: ['organization', 'recipientAddresses']
    })

    if (!recipient) {
      throw new NotFoundException('Can not find contact')
    }

    for (const wallet of updateRecipientDto.wallets) {
      const address = recipient.recipientAddresses.find(
        (address) =>
          address.blockchainId === wallet.blockchainId && address.address.toLowerCase() === wallet.address.toLowerCase()
      )
      if (address) {
        continue
      }

      const validationResponse = await this.organizationAddressesService.getAddressLocation(
        wallet.address,
        wallet.blockchainId,
        recipient.organization.id
      )

      if (!!validationResponse) {
        throw new BadRequestException(`This address exists in '${validationResponse.message}'.`)
      }
    }

    try {
      const recipient = await this.recipientsService.get(id)
      if (recipient) {
        recipient.contactName = updateRecipientDto.contactName
        recipient.organizationName = updateRecipientDto.organizationName
        recipient.organizationAddress = updateRecipientDto.organizationAddress
        recipient.type = updateRecipientDto.type
        recipient.updatedAt = new Date()
        recipient.recipientAddresses = []
        recipient.recipientContacts = []

        updateRecipientDto.wallets = [
          ...new Map(
            updateRecipientDto.wallets.map((item) => [item.blockchainId + item.address.toLowerCase(), item])
          ).values()
        ]

        const numberOfWallets = updateRecipientDto.wallets.length

        for (let i = 0; i < numberOfWallets; i++) {
          const recipientAddress = new RecipientAddress()
          recipientAddress.address = updateRecipientDto.wallets[i].address
          const cryptocurrency = await this.cryptocurrenciesService.getBySymbol(
            updateRecipientDto.wallets[i].cryptocurrencySymbol
          )
          if (!cryptocurrency) {
            throw new BadRequestException(
              `Cryptocurrency with symbol ${updateRecipientDto.wallets[i].cryptocurrencySymbol} not found`
            )
          }
          const token = await this.tokensService.getBySymbol(cryptocurrency.symbol)
          recipientAddress.blockchainId = updateRecipientDto.wallets[i].blockchainId
          recipientAddress.cryptocurrency = cryptocurrency
          recipientAddress.token = token ?? null

          await this.recipientAddressesService.create(recipientAddress)
          recipient.recipientAddresses.push(recipientAddress)
        }

        const numberOfContacts = updateRecipientDto.contacts.length

        for (let i = 0; i < numberOfContacts; i++) {
          const contact = new RecipientContact()
          contact.content = updateRecipientDto.contacts[i].content
          const contactProvider = await this.contactProvidersService.get(updateRecipientDto.contacts[i].providerId)
          contact.contactProvider = contactProvider
          await this.recipientContactsService.create(contact)
          recipient.recipientContacts.push(contact)
        }

        await this.recipientsService.update(recipient)

        return recipient
      }

      throw new NotFoundException()
    } catch (error) {
      if (error.status === HttpStatus.NOT_FOUND) {
        throw new NotFoundException()
      }
      if (error.status === HttpStatus.BAD_REQUEST) {
        throw new BadRequestException(error)
      }

      if (
        error?.code === PostgresErrorCode.UniqueViolation ||
        error?.data?.code === PostgresErrorCode.UniqueViolation
      ) {
        throw new BadRequestException('Contact name already exists')
      }

      throw new InternalServerErrorException()
    }
  }

  @Delete(':id')
  @RequirePermissionAction(Action.DELETE)
  @ApiParam({ name: 'organizationId', type: 'string' })
  async delete(@Param('id') id: string) {
    const recipient = await this.recipientsService.get(id)
    if (recipient) {
      return this.recipientsService.softDelete(recipient.id)
    }

    throw new NotFoundException()
  }
}

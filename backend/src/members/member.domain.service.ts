import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { ForbiddenException } from '@nestjs/common/exceptions/forbidden.exception'
import { IsNull, Not } from 'typeorm'
import { accessControlHelper } from '../common/helpers/access-control.helper'
import { ContactProvidersService } from '../common/services/contacts/contacts/contacts.service'
import { MemberAddress } from '../common/services/members/addresses/address.entity'
import { MemberAddressesService } from '../common/services/members/addresses/addresses.service'
import { MemberContact } from '../common/services/members/contacts/member-contact.entity'
import { MemberContactsService } from '../common/services/members/contacts/member-contact.service'
import { MemberProfileService } from '../common/services/members/member-profile.service'
import { Member } from '../common/services/members/member.entity'
import { MembersService } from '../common/services/members/members.service'
import { Role } from '../common/services/roles/role.entity'
import { RolesService } from '../common/services/roles/roles.service'
import { TokensService } from '../common/services/tokens/tokens.service'
import { PaginationResponse } from '../core/interfaces'
import { ERole } from '../roles/interfaces'
import { MemberDto, MemberQueryParams, MemberState, ProfileDto, UpdateProfileDto } from './index'
import { CryptocurrenciesService } from '../common/services/cryptocurrencies/cryptocurrencies.service'

@Injectable()
export class MemberDomainService {
  constructor(
    private membersService: MembersService,
    private memberProfileService: MemberProfileService,
    private memberContactsService: MemberContactsService,
    private memberAddressesService: MemberAddressesService,
    private contactProvidersService: ContactProvidersService,
    private rolesService: RolesService,
    private tokensService: TokensService,
    private cryptocurrenciesService: CryptocurrenciesService
  ) {}

  async getAllPagingDto(
    paginationParams: MemberQueryParams,
    params: {
      publicOrganizationId: string
    }
  ): Promise<PaginationResponse<MemberDto>> {
    const membersPaginationResponse = await this.membersService.getAllPaging(
      paginationParams,
      [],
      {
        organization: { publicId: params.publicOrganizationId },
        deletedAt: (paginationParams.state === MemberState.deactivated ? Not(IsNull()) : IsNull()) as any
      },
      ['organization', 'role', 'profile', 'account', 'account.walletAccounts', 'account.emailAccounts'],
      true
    )

    return {
      ...membersPaginationResponse,
      items: membersPaginationResponse.items.map((item) => MemberDto.map(item))
    }
  }

  async canUserModifyMember(param: { organizationId: string; currentUserRole: Role; memberId: string }) {
    const member = await this.getMemberByPublicId(param.organizationId, param.memberId, [
      'account',
      'role',
      'organization',
      'account.walletAccounts',
      'account.emailAccounts'
    ])

    if (!member) {
      throw new NotFoundException(`Can not find member`)
    }

    switch (param.currentUserRole.name) {
      case ERole.Owner: {
        if (member.role.name === ERole.Owner) {
          throw new ForbiddenException(`You are not allowed to modify this user`)
        }
        return member
      }
      case ERole.Admin: {
        if (member.role.name === ERole.Employee) {
          return member
        }
      }
    }
    throw new ForbiddenException(`You are not allowed to modify this user`)
  }

  private async getMemberByPublicId(organizationId: string, memberId: string, relations: string[]) {
    return this.membersService.findOne({
      where: {
        publicId: memberId,
        organization: {
          publicId: organizationId
        }
      },
      relations,
      withDeleted: true
    })
  }

  async getProfileMember(param: { organizationId: string; currentMember: Member; memberId: string }) {
    const member = await this.getMemberByPublicId(param.organizationId, param.memberId, [
      'role',
      'organization',
      'account',
      'profile',
      'profile.addresses',
      'profile.contacts',
      'profile.contacts.contactProvider'
    ])

    if (!member) {
      throw new NotFoundException(`Can not find member`)
    }

    if ([ERole.Admin, ERole.Owner].includes(param.currentMember.role.name)) {
      return member
    } else if (member.id === param.currentMember.id) {
      return member
    }

    throw new ForbiddenException(`Can not get access`)
  }

  async getMemberByAccount(organizationId: string, accountId: string) {
    return await this.membersService.findByAccount(organizationId, accountId, {
      account: {
        walletAccounts: true,
        emailAccounts: true
      },
      role: true
    })
  }

  async getMemberProfileByAccount(organizationId: string, accountId: string) {
    return await this.membersService.findByAccount(organizationId, accountId, {
      role: true,
      organization: true,
      account: true,
      profile: {
        addresses: {
          token: true,
          cryptocurrency: true
        },
        contacts: {
          contactProvider: true
        }
      }
    })
  }

  async updateRole(param: { role: ERole; member: Member }) {
    const role = await this.rolesService.getByName(param.role)
    if (!role) {
      throw new BadRequestException(`Can not find role`)
    }
    await this.membersService.update({
      id: param.member.id,
      role
    })

    return MemberDto.map({
      ...param.member,
      role
    })
  }

  async deactivate(member: Member, deactivatedBy: string) {
    const updatedMember = await this.membersService.update({
      id: member.id,
      deletedAt: new Date(),
      deletedBy: {
        id: deactivatedBy
      }
    })
    return MemberDto.map({
      ...member,
      ...updatedMember
    })
  }

  async activate(member: Member) {
    const updatedMember = await this.membersService.update({
      id: member.id,
      deletedAt: null,
      deletedBy: null
    })
    return MemberDto.map({
      ...member,
      ...updatedMember
    })
  }

  async updateProfile(member: Member, params: UpdateProfileDto): Promise<ProfileDto> {
    const addresses: MemberAddress[] = []
    const contacts: MemberContact[] = []

    for (const wallet of params.addresses) {
      const memberAddress = new MemberAddress()
      memberAddress.address = wallet.address
      const cryptocurrency = await this.cryptocurrenciesService.getBySymbol(wallet.cryptocurrencySymbol)
      if (!cryptocurrency) {
        throw new BadRequestException(`Can not find cryptocurrency ${wallet.cryptocurrencySymbol}`)
      }
      const token = await this.tokensService.getBySymbol(cryptocurrency.symbol)
      memberAddress.blockchainId = wallet.blockchainId
      memberAddress.cryptocurrency = cryptocurrency
      memberAddress.token = token ?? null

      await this.memberAddressesService.create(memberAddress)
      addresses.push(memberAddress)
    }

    for (const contact of params.contacts) {
      const memberContact = new MemberContact()
      memberContact.content = contact.content
      const provider = await this.contactProvidersService.get(contact.providerId)
      if (!provider) {
        throw new BadRequestException(`Can not find contact provider ${contact.providerId}`)
      }
      memberContact.contactProvider = provider
      await this.memberContactsService.create(memberContact)
      contacts.push(memberContact)
    }

    const memberProfile = await this.memberProfileService.update({
      ...member.profile,
      addresses,
      contacts
    })

    return ProfileDto.map({
      ...member,
      profile: memberProfile
    })
  }

  canUserUpdateRole(param: { currentUserRole: Role; changeToRole: ERole }) {
    if (!accessControlHelper.canUserSetRole(param)) {
      throw new ForbiddenException(`You are not allowed to set this role`)
    }
  }
}

import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BaseService } from '../../../core/base.service'
import { Account } from '../account/account.entity'
import { Organization } from '../organizations/organization.entity'
import { Role } from '../roles/role.entity'
import { MemberProfile } from './member-profile.entity'
import { Member } from './member.entity'
import { FindOptionsRelations } from 'typeorm/find-options/FindOptionsRelations'

@Injectable()
export class MembersService extends BaseService<Member> {
  constructor(
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
    @InjectRepository(MemberProfile)
    private memberProfileRepository: Repository<MemberProfile>
  ) {
    super(memberRepository)
  }

  async createNewMember(params: { role: Role; account: Account; organization: Organization }) {
    const profile = new MemberProfile()

    const newProfile = await this.memberProfileRepository.save(profile)
    const member = new Member()
    member.profile = newProfile
    member.role = params.role
    member.organization = params.organization
    member.account = params.account
    return this.create(member)
  }

  async getByOrganizationIdAndAccountId(organizationId: string, accountId: string, deletedOption: boolean = false) {
    return this.memberRepository.findOne({
      where: {
        account: {
          id: accountId
        },
        organization: {
          publicId: organizationId
        }
      },
      withDeleted: deletedOption
    })
  }

  async findByAccount(organizationId: string, accountId: string, relations: FindOptionsRelations<Member> = {}) {
    return this.findOne({
      where: {
        account: {
          id: accountId
        },
        organization: {
          publicId: organizationId
        }
      },
      relations
    })
  }

  getByOrganizationIdChainAndNameOrAddress(params: {
    organizationId: string
    blockchainId?: string
    nameOrAddress?: string
  }) {
    let query = 'organization.id = :organizationId'

    if (params.nameOrAddress) {
      query += ` AND (addresses.address ILIKE :search OR concat(account.firstName, ' ', account.lastName) ILIKE :search)`
    }

    if (params.blockchainId) {
      query += ' AND blockchain_id = :blockchainId'
    }

    const sql = this.memberRepository
      .createQueryBuilder('member')
      .leftJoinAndSelect('member.organization', 'organization')
      .leftJoinAndSelect('member.account', 'account')
      .leftJoinAndSelect('member.profile', 'profile')
      .leftJoinAndSelect('profile.addresses', 'addresses')
      .leftJoinAndSelect('addresses.token', 'token')
      .where(query, {
        organizationId: params.organizationId,
        search: `%${params.nameOrAddress}%`,
        blockchainId: params.blockchainId
      })
    return sql.getMany()
  }
}

import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { ILike, In, Repository } from 'typeorm'
import { BaseService } from '../../../core/base.service'
import { Invitation } from './invitation.entity'
import { InvitationStatus } from '../../../invitations/interface'

@Injectable()
export class InvitationsService extends BaseService<Invitation> {
  constructor(
    @InjectRepository(Invitation)
    private invitationsRepository: Repository<Invitation>
  ) {
    super(invitationsRepository)
  }

  async findActiveInvite(param: { email?: string | undefined; address?: string | undefined; organizationId: string }) {
    return this.findOne({
      where: {
        address: param.address ? ILike(param.address) : undefined,
        email: param.email ? ILike(param.email) : undefined,
        status: In([InvitationStatus.INVITED, InvitationStatus.ACTIVE]),
        organization: {
          publicId: param.organizationId
        }
      }
    })
  }

  async updateStatusForExpired() {
    const results = this.invitationsRepository
      .createQueryBuilder()
      .update()
      .set({
        status: InvitationStatus.EXPIRED
      })
      .where('status = :status and expired_at < NOW()', { status: InvitationStatus.INVITED })
      .execute()
    console.log(`updateStatusForExpired: `, { results })
  }
}

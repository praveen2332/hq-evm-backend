import { Controller, Get, NotFoundException, Param } from '@nestjs/common'
import { ApiBearerAuth, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { InvitationsService } from '../../common/services/invitations/invitations.service'
import { PublicInvitationDto } from './interface'
import { InvitationStatus } from '../interface'

@ApiTags('invite')
@ApiBearerAuth()
@Controller('invite')
export class InvitationsPublicController {
  constructor(private invitationsService: InvitationsService) {}

  @Get(':id')
  @ApiParam({ name: 'id', type: 'string' })
  @ApiResponse({ status: 200, type: PublicInvitationDto })
  async get(@Param('id') invitationId: string) {
    const invitation = await this.invitationsService.findOne({
      where: {
        publicId: invitationId,
        status: InvitationStatus.INVITED
      },
      relations: ['organization', 'role']
    })
    if (invitation) {
      return PublicInvitationDto.map({ invitation })
    }
    throw new NotFoundException()
  }
}

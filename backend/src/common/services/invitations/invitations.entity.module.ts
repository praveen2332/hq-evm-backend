import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Invitation } from './invitation.entity'
import { InvitationsService } from './invitations.service'

@Module({
  imports: [TypeOrmModule.forFeature([Invitation])],
  providers: [InvitationsService],
  exports: [TypeOrmModule, InvitationsService]
})
export class InvitationsEntityModule {}

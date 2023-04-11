import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MemberAddress } from './addresses/address.entity'
import { MemberAddressesService } from './addresses/addresses.service'
import { MemberProfile } from './member-profile.entity'
import { MemberProfileService } from './member-profile.service'
import { Member } from './member.entity'
import { MembersService } from './members.service'
import { MemberContactsService } from './contacts/member-contact.service'
import { MemberContact } from './contacts/member-contact.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Member, MemberAddress, MemberProfile, MemberContact])],
  providers: [MembersService, MemberAddressesService, MemberProfileService, MemberContactsService],
  exports: [TypeOrmModule, MembersService, MemberAddressesService, MemberProfileService, MemberContactsService]
})
export class MembersEntityModule {}

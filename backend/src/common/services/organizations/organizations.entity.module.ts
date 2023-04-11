import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Organization } from './organization.entity'
import { OrganizationsService } from './organizations.service'

@Module({
  imports: [TypeOrmModule.forFeature([Organization])],
  providers: [OrganizationsService],
  exports: [TypeOrmModule, OrganizationsService]
})
export class OrganizationsEntityModule {}

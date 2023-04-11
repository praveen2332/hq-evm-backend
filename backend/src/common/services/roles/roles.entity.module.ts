import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Role } from './role.entity'
import { RolesService } from './roles.service'

@Module({
  imports: [TypeOrmModule.forFeature([Role])],
  providers: [RolesService],
  exports: [TypeOrmModule, RolesService]
})
export class RolesEntityModule {}

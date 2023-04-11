import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { OrganizationSettingsService } from './organization-settings.service'
import { OrganizationSetting } from './organization-setting.entity'

@Module({
  imports: [TypeOrmModule.forFeature([OrganizationSetting])],
  controllers: [],
  providers: [OrganizationSettingsService],
  exports: [TypeOrmModule, OrganizationSettingsService]
})
export class OrganizationSettingsEntityModule {}

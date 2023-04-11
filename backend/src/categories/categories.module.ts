import { forwardRef, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '../auth/auth.module'
import { CategoriesController } from './categories.controller'
import { CategoriesService } from './categories.service'
import { Category } from './category.entity'
import { OrganizationsEntityModule } from '../common/services/organizations/organizations.entity.module'
import { AccountsEntityModule } from '../common/services/account/accounts.entity.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Category]),
    OrganizationsEntityModule,
    AccountsEntityModule,
    forwardRef(() => AuthModule)
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [TypeOrmModule, CategoriesService]
})
export class CategoriesModule {}

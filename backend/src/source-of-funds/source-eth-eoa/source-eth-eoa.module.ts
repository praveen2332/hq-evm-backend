import { forwardRef, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '../../auth/auth.module'
import { SourceEth } from './source-eth-eoa.entity'
import { SourceEthService } from './source-eth-eoa.service'

@Module({
  imports: [TypeOrmModule.forFeature([SourceEth]), forwardRef(() => AuthModule)],
  providers: [SourceEthService],
  exports: [TypeOrmModule, SourceEthService]
})
export class SourceEthModule {}

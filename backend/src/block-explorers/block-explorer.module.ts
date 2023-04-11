import { Module } from '@nestjs/common'
import { BlockExplorerAdapterFactory } from './block-explorer.adapter.factory'
import { ConfigModule } from '@nestjs/config'

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [],
  providers: [BlockExplorerAdapterFactory],
  exports: [BlockExplorerAdapterFactory]
})
export class BlockExplorerModule {}

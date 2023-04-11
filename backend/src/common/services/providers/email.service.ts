import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { BaseService } from '../../../core/base.service'
import { AuthEmail } from './email.entity'

@Injectable()
export class EmailService extends BaseService<AuthEmail> {
  constructor(
    @InjectRepository(AuthEmail)
    private emailRepository: Repository<AuthEmail>
  ) {
    super(emailRepository)
  }

  add(emailAccount: AuthEmail): Promise<AuthEmail> {
    return this.emailRepository.save(emailAccount)
  }

  findOneByEmail(email: string): Promise<AuthEmail> {
    return this.emailRepository.findOne({ where: { email }, relations: ['account'] })
  }
}

import { Injectable } from '@nestjs/common'

@Injectable()
export class LoggerService {
  log(message?: any, ...optionalParams: any[]): void {
    console.log(message, optionalParams)
  }

  error(message?: any, ...optionalParams: any[]): void {
    console.error(message, optionalParams)
  }
}

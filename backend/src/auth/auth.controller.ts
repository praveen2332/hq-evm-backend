import { Body, Controller, NotFoundException, Post, ValidationPipe } from '@nestjs/common'
import { AuthService } from './auth.service'
import { LoginAuthDto, SignUpAuthDto } from './interfaces'

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body(new ValidationPipe()) authDto: LoginAuthDto) {
    const authResult = await this.authService.login(authDto)
    if (!authResult) {
      throw new NotFoundException('Account does not exist')
    }
    return authResult
  }

  @Post('sign-up')
  async signUp(@Body(new ValidationPipe()) authDto: SignUpAuthDto) {
    const authResult = await this.authService.signUp(authDto)
    if (!authResult) {
      throw new NotFoundException('Account does not exist')
    }
    return authResult
  }
}

import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/org.decorator';
import { AuthService } from './auth.service';
import { ChallengeQueryDto } from './dto/challenge-query.dto';
import { TokenRequestDto } from './dto/token-request.dto';
import { UpdateMeDto } from './dto/update-me.dto';

@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // GET /auth/challenge?account=G... → XDR base64 challenge (SEP-10)
  @Public()
  @Get('challenge')
  generateChallenge(@Query() query: ChallengeQueryDto) {
    return this.authService.generateChallenge(query.account);
  }

  // POST /auth/token { transaction } → JWT de sesión
  @Public()
  @Post('token')
  @HttpCode(200)
  issueToken(@Body() body: TokenRequestDto) {
    return this.authService.verifyAndIssueToken(body.transaction, body.registration);
  }

  // POST /auth/refresh → JWT renovado (mismas claims)
  @Post('refresh')
  @HttpCode(200)
  refresh(@Headers('authorization') auth: string) {
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) {
      throw new UnauthorizedException({
        code: 'unauthorized',
        message: 'No token provided',
      });
    }
    return this.authService.refresh(token);
  }

  // GET /auth/me → perfil del usuario autenticado
  @Get('me')
  getMe(@CurrentUser() user: { sub: string }) {
    return this.authService.getMe(user.sub);
  }

  // PATCH /auth/me → actualizar nombre / teléfono del usuario
  @Patch('me')
  updateMe(@CurrentUser() user: { sub: string }, @Body() body: UpdateMeDto) {
    return this.authService.updateMe(user.sub, body);
  }
}

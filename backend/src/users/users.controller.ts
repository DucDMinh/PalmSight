import { Controller, Get, UseGuards } from '@nestjs/common';
import type { MeResponseDto } from '@palmsight/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { UserDocument } from '../schemas/user.schema';
import { UsersService } from './users.service';

@Controller('me')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  getMe(@CurrentUser() user: UserDocument): Promise<MeResponseDto> {
    return this.usersService.getMe(user);
  }
}

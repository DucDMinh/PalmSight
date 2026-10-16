import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import type {
  MeResponseDto,
  CreditTransactionListResponseDto,
} from "@palmsight/shared";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { UserDocument } from "../schemas/user.schema";
import { UsersService } from "./users.service";
import { CreditLedgerService } from "../credits/credit-ledger.service";

@Controller("me")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly creditLedgerService: CreditLedgerService
  ) {}

  @Get()
  getMe(@CurrentUser() user: UserDocument): Promise<MeResponseDto> {
    return this.usersService.getMe(user);
  }

  @Get("credit-transactions")
  getCreditTransactions(
    @CurrentUser() user: UserDocument,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string
  ): Promise<CreditTransactionListResponseDto> {
    return this.creditLedgerService.getTransactions(user._id, {
      cursor,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }
}

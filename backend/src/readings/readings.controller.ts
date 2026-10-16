import {
  Controller,
  Post,
  Get,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Headers,
  Res,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Response } from "express";
import { PaginationQueryDto } from "@palmsight/shared";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { ReadingsService } from "./readings.service";

@Controller("readings")
@UseGuards(JwtAuthGuard)
export class ReadingsController {
  constructor(private readonly readingsService: ReadingsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor("image", {
      limits: { fileSize: 8 * 1024 * 1024 },
    })
  )
  async createReading(
    @CurrentUser("sub") userId: string,
    @Headers("idempotency-key") idempotencyKey: string | undefined,
    @Body() body: any,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Res({ passthrough: true }) res: Response
  ) {
    const outcome = await this.readingsService.createReading(
      userId,
      idempotencyKey,
      body,
      file
    );

    if (outcome.idempotentReplayed) {
      res.setHeader("Idempotent-Replayed", "true");
    }

    return {
      reading: outcome.reading,
      creditBalance: outcome.creditBalance,
    };
  }

  @Get()
  async getReadings(
    @CurrentUser("sub") userId: string,
    @Query() query: PaginationQueryDto
  ) {
    return this.readingsService.getReadings(userId, query);
  }

  @Get(":id")
  async getReadingById(
    @CurrentUser("sub") userId: string,
    @Param("id") id: string
  ) {
    return this.readingsService.getReadingById(userId, id);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteReading(
    @CurrentUser("sub") userId: string,
    @Param("id") id: string
  ) {
    await this.readingsService.deleteReading(userId, id);
  }
}

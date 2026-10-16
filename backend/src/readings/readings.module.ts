import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Reading, ReadingSchema } from "../schemas/reading.schema";
import { User, UserSchema } from "../schemas/user.schema";
import { AuthModule } from "../auth/auth.module";
import { CreditsModule } from "../credits/credits.module";
import { AiModule } from "../ai/ai.module";
import { ImageProcessorService } from "./image-processor.service";
import { ReadingsService } from "./readings.service";
import { ReadingsController } from "./readings.controller";

@Module({
  imports: [
    AuthModule,
    CreditsModule,
    AiModule,
    MongooseModule.forFeature([
      { name: Reading.name, schema: ReadingSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [ReadingsController],
  providers: [ImageProcessorService, ReadingsService],
  exports: [ReadingsService, ImageProcessorService],
})
export class ReadingsModule {}

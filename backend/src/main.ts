import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const configService = app.get(ConfigService);

  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const publicBaseUrl = configService.get<string>('PUBLIC_BASE_URL', 'http://localhost:5173');
  const port = Number(configService.get<number | string>('API_PORT', 4000));

  const devOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:4000',
  ];

  app.enableCors({
    credentials: true,
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      if (nodeEnv === 'production') {
        if (origin === publicBaseUrl) {
          return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
      }

      // In development/test
      if (
        devOrigins.includes(origin) ||
        origin === publicBaseUrl ||
        /^https?:\/\/([a-zA-Z0-9-]+\.)*ngrok-free\.app(?::\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Authorization',
      'Content-Type',
      'Idempotency-Key',
      'Origin',
      'ngrok-skip-browser-warning',
      'X-Request-Id',
    ],
    exposedHeaders: [
      'Set-Cookie',
      'Retry-After',
      'Idempotent-Replayed',
      'X-Request-Id',
    ],
    maxAge: 86400,
  });

  app.use(cookieParser());
  app.useGlobalFilters(new ApiExceptionFilter());
  app.setGlobalPrefix('api/v1');
  app.enableShutdownHooks();

  await app.listen(port);
  logger.log(`PalmSight API is running on port ${port} in ${nodeEnv} mode`);
}

void bootstrap();

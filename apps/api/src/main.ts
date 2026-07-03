import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validar FRONTEND_URL en producción
  const frontendUrl = process.env.FRONTEND_URL;
  const isDev = process.env.NODE_ENV !== 'production';
  
  if (!frontendUrl && !isDev) {
    const msg = '❌ FATAL: FRONTEND_URL must be configured in production for CORS';
    console.error(msg);
    throw new Error(msg);
  }

  const allowed = (frontendUrl ?? 'http://localhost:3000')
    .split(',')
    .map((u) => u.trim());

  app.enableCors({
    origin: (origin, cb) => {
      if (!origin || allowed.includes(origin)) return cb(null, true);
      cb(new Error(`CORS: ${origin} not allowed`));
    },
    credentials: true,
  });

  console.log(`✅ CORS enabled for: ${allowed.join(', ')}`);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`[TrustBid API] running on http://localhost:${port}`);
}

bootstrap();

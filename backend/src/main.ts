import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validação global: aplica os decorators do class-validator em todos os DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // remove campos não declarados no DTO
      forbidNonWhitelisted: true, // retorna erro se vier campo não declarado
      transform: true, // converte tipos automaticamente (string → number, etc)
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // CORS: permite frontend Angular acessar
  app.enableCors({
    origin: 'http://localhost:4200',
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Backend rodando em http://localhost:${port}`);
}
bootstrap();
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // unneccessary field remove if not matched to dto 
      transform: true, // transform the data type as defined in the dto like string 2 comming from query parms transformed to number 2 if defined type in dto is number 
      forbidNonWhitelisted: true, //thows error when we get unneccessary fields instead on silently continue with request
    }),
  );

  const configService = app.get(ConfigService);

  const port = configService.get<number>('PORT') ?? 3000;
  const apiPrefix = configService.get<string>('API_PREFIX') ?? 'api';

  app.setGlobalPrefix(apiPrefix);

  await app.listen(port);
}
bootstrap();

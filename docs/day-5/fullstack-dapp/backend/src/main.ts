import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🔹 Enable CORS for Frontend Integration (Day 5)
  // Allow all origins during development
  app.enableCors({
    origin: true, // Allow all origins for development
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle("Simple Storage DApp API - Day 5 Full Stack")
    .setDescription(`
**NAMA:** TEGAR ANDRIYANSYAH
**NIM:** 231011402038

---
**Day 5 - Full Stack dApp Integration**
- Frontend: Next.js
- Backend: NestJS + viem
- Blockchain: Avalanche Fuji
    `)
    .setVersion("1.0")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Backend API running on http://localhost:${port}`);
  console.log(`📚 Swagger API docs available at http://localhost:${port}/api`);
}
bootstrap();

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { BrandsModule } from './brands/brands.module';
import { createTypeOrmOptions } from './database/typeorm.options';
import { ListingsModule } from './listings/listings.module';
import { ProfileModule } from './profile/profile.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: createTypeOrmOptions,
    }),
    AdminModule,
    UsersModule,
    AuthModule,
    BrandsModule,
    ListingsModule,
    ProfileModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

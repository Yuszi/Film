import { AuthModule } from '../../security/auth/auth.module.js';
import { DbPopulateController } from './db-populate.controller.js';
import { DbPopulateService } from './db-populate.service.js';
import { Film } from '../../film/entity/film.entity.js';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports: [TypeOrmModule.forFeature([Film]), AuthModule],
    controllers: [DbPopulateController],
    providers: [DbPopulateService],
    exports: [DbPopulateService],
})
export class DevModule {}

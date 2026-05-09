import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExameEntity } from './entities/exame.entity';
import { ExamesService } from './services/exames.service';
import { ExamesController } from './controllers/exames.controller';
import { PacientesModule } from '../pacientes/pacientes.module';

@Module({
  imports: [TypeOrmModule.forFeature([ExameEntity]), PacientesModule],
  controllers: [ExamesController],
  providers: [ExamesService],
})
export class ExamesModule {}
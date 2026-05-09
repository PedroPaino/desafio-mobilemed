import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PacienteEntity } from './entities/paciente.entity';
import { PacientesService } from './services/pacientes.service';
import { PacientesController } from './controllers/pacientes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PacienteEntity])],
  controllers: [PacientesController],
  providers: [PacientesService],
  exports: [PacientesService],
})
export class PacientesModule {}
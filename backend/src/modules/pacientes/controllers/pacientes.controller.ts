import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PacientesService } from '../services/pacientes.service';
import { CreatePacienteDto } from '../dtos/create-paciente.dto';
import { PaginationDto } from '../../../shared/dtos/pagination.dto';

@Controller('pacientes')
export class PacientesController {
  constructor(private readonly pacientesService: PacientesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePacienteDto) {
    return this.pacientesService.create(dto);
  }

  @Get()
  async findAll(@Query() pagination: PaginationDto) {
    return this.pacientesService.findAll(pagination);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.pacientesService.findById(id);
  }
}
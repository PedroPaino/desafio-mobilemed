import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Res,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { ExamesService } from '../services/exames.service';
import { CreateExameDto } from '../dtos/create-exame.dto';
import { PaginationDto } from '../../../shared/dtos/pagination.dto';

@Controller('exames')
export class ExamesController {
  constructor(private readonly examesService: ExamesService) {}

  @Post()
  async create(
    @Body() dto: CreateExameDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.examesService.create(dto);
    // 201 se foi criado agora, 200 se já existia (idempotência)
    res.status(result.created ? HttpStatus.CREATED : HttpStatus.OK);
    return result.exame;
  }

  @Get()
  async findAll(@Query() pagination: PaginationDto) {
    return this.examesService.findAll(pagination);
  }
}
import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError, DataSource } from 'typeorm';
import { ExameEntity } from '../entities/exame.entity';
import { CreateExameDto } from '../dtos/create-exame.dto';
import { PacientesService } from '../../pacientes/services/pacientes.service';
import {
  PaginationDto,
  PaginatedResponse,
} from '../../../shared/dtos/pagination.dto';

export interface CreateExameResult {
  exame: ExameEntity;
  created: boolean; // true = 201 (novo), false = 200 (já existia)
}

@Injectable()
export class ExamesService {
  private readonly logger = new Logger(ExamesService.name);

  constructor(
    @InjectRepository(ExameEntity)
    private readonly exameRepository: Repository<ExameEntity>,
    private readonly pacientesService: PacientesService,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateExameDto): Promise<CreateExameResult> {
    // 1. Valida que o paciente existe (cenário 6)
    try {
      await this.pacientesService.findById(dto.pacienteId);
    } catch {
      throw new BadRequestException(
        `Paciente com id ${dto.pacienteId} não encontrado`,
      );
    }

    // 2. Tenta inserir dentro de transação
    return this.dataSource.transaction(async (manager) => {
      try {
        const exame = manager.create(ExameEntity, {
          ...dto,
          dataRealizacao: new Date(dto.dataRealizacao),
        });
        const saved = await manager.save(exame);
        this.logger.log(
          `Exame criado: id=${saved.id}, key=${saved.idempotencyKey}`,
        );
        return { exame: saved, created: true };
      } catch (error) {
        // Idempotência: se já existe, retorna o existente (cenários 4 e 5)
        if (
          error instanceof QueryFailedError &&
          (error as any).errno === 1062
        ) {
          const existing = await manager.findOne(ExameEntity, {
            where: { idempotencyKey: dto.idempotencyKey },
          });
          if (!existing) {
            // Caso impossível na prática, mas defensivo
            throw error;
          }
          this.logger.log(
            `Idempotência: retornando exame existente id=${existing.id}, key=${existing.idempotencyKey}`,
          );
          return { exame: existing, created: false };
        }
        throw error;
      }
    });
  }

  async findAll(
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<ExameEntity>> {
    const page = pagination.page ?? 1;
    const pageSize = pagination.pageSize ?? 10;

    const [data, total] = await this.exameRepository.findAndCount({
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { criadoEm: 'DESC' },
      relations: ['paciente'],
    });

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
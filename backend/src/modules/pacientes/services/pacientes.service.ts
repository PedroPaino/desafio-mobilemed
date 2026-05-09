import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { PacienteEntity } from '../entities/paciente.entity';
import { CreatePacienteDto } from '../dtos/create-paciente.dto';
import {
  PaginationDto,
  PaginatedResponse,
} from '../../../shared/dtos/pagination.dto';

@Injectable()
export class PacientesService {
  constructor(
    @InjectRepository(PacienteEntity)
    private readonly pacienteRepository: Repository<PacienteEntity>,
  ) {}

  async create(dto: CreatePacienteDto): Promise<PacienteEntity> {
    try {
      const paciente = this.pacienteRepository.create({
        ...dto,
        dataNascimento: new Date(dto.dataNascimento),
      });
      return await this.pacienteRepository.save(paciente);
    } catch (error) {
      // Vai tratar violação de UNIQUE constraint do MySQL (errno 1062)
      if (
        error instanceof QueryFailedError &&
        (error as any).errno === 1062
      ) {
        throw new ConflictException(
          `Já existe um paciente com o documento ${dto.documento}`,
        );
      }
      throw error;
    }
  }

  async findAll(
    pagination: PaginationDto,
  ): Promise<PaginatedResponse<PacienteEntity>> {
    const page = pagination.page ?? 1;
    const pageSize = pagination.pageSize ?? 10;

    const [data, total] = await this.pacienteRepository.findAndCount({
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { criadoEm: 'DESC' },
    });

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findById(id: string): Promise<PacienteEntity> {
    const paciente = await this.pacienteRepository.findOne({ where: { id } });
    if (!paciente) {
      throw new NotFoundException(`Paciente com id ${id} não encontrado`);
    }
    return paciente;
  }
}
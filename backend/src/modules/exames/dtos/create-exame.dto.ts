import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsDateString,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ModalidadeDicom } from '../entities/exame.entity';

export class CreateExameDto {
  @IsNotEmpty({ message: 'idempotencyKey é obrigatória' })
  @IsString()
  @MinLength(8, { message: 'idempotencyKey deve ter no mínimo 8 caracteres' })
  @MaxLength(100)
  idempotencyKey: string;

  @IsNotEmpty({ message: 'Modalidade é obrigatória' })
  @IsEnum(ModalidadeDicom, {
    message:
      'Modalidade inválida. Use: CR, CT, DX, MG, MR, NM, OT, PT, RF, US, XA',
  })
  modalidade: ModalidadeDicom;

  @IsNotEmpty({ message: 'Descrição é obrigatória' })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  descricao: string;

  @IsNotEmpty({ message: 'Data de realização é obrigatória' })
  @IsDateString()
  dataRealizacao: string;

  @IsNotEmpty({ message: 'pacienteId é obrigatório' })
  @IsUUID('4', { message: 'pacienteId deve ser um UUID válido' })
  pacienteId: string;
}
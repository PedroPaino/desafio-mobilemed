import {
  IsString,
  IsEmail,
  IsDateString,
  IsOptional,
  IsNotEmpty,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreatePacienteDto {
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @IsString()
  @MinLength(3, { message: 'Nome deve ter no mínimo 3 caracteres' })
  @MaxLength(255)
  nome: string;

  @IsNotEmpty({ message: 'Documento é obrigatório' })
  @IsString()
  @MinLength(11, { message: 'Documento deve ter no mínimo 11 caracteres' })
  @MaxLength(20)
  documento: string;

  @IsNotEmpty({ message: 'Data de nascimento é obrigatória' })
  @IsDateString({}, { message: 'Data de nascimento deve estar no formato YYYY-MM-DD' })
  dataNascimento: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefone?: string;
}
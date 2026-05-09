export interface Paciente {
  id: string;
  nome: string;
  documento: string;
  dataNascimento: string;
  email?: string;
  telefone?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CreatePacienteDto {
  nome: string;
  documento: string;
  dataNascimento: string;
  email?: string;
  telefone?: string;
}
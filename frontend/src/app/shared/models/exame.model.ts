import { Paciente } from './paciente.model';

export enum ModalidadeDicom {
  CR = 'CR',
  CT = 'CT',
  DX = 'DX',
  MG = 'MG',
  MR = 'MR',
  NM = 'NM',
  OT = 'OT',
  PT = 'PT',
  RF = 'RF',
  US = 'US',
  XA = 'XA',
}

export interface Exame {
  id: string;
  idempotencyKey: string;
  modalidade: ModalidadeDicom;
  descricao: string;
  dataRealizacao: string;
  pacienteId: string;
  paciente?: Paciente;
  criadoEm: string;
}

export interface CreateExameDto {
  idempotencyKey: string;
  modalidade: ModalidadeDicom;
  descricao: string;
  dataRealizacao: string;
  pacienteId: string;
}
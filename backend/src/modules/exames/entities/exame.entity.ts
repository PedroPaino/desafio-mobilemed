import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { PacienteEntity } from '../../pacientes/entities/paciente.entity';

export enum ModalidadeDicom {
  CR = 'CR', // Computed Radiography
  CT = 'CT', // Computed Tomography
  DX = 'DX', // Digital Radiography
  MG = 'MG', // Mammography
  MR = 'MR', // Magnetic Resonance
  NM = 'NM', // Nuclear Medicine
  OT = 'OT', // Other
  PT = 'PT', // Positron Emission Tomography
  RF = 'RF', // Radio Fluoroscopy
  US = 'US', // Ultrasound
  XA = 'XA', // X-Ray Angiography
}

@Entity('exames')
@Index('idx_idempotency_key', ['idempotencyKey'], { unique: true })
export class ExameEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 100,
    name: 'idempotency_key',
    unique: true,
  })
  idempotencyKey: string;

  @Column({
    type: 'enum',
    enum: ModalidadeDicom,
  })
  modalidade: ModalidadeDicom;

  @Column({ type: 'varchar', length: 500 })
  descricao: string;

  @Column({ type: 'datetime', name: 'data_realizacao' })
  dataRealizacao: Date;

  @Column({ type: 'uuid', name: 'paciente_id' })
  pacienteId: string;

  @ManyToOne(() => PacienteEntity, { eager: false })
  @JoinColumn({ name: 'paciente_id' })
  paciente?: PacienteEntity;

  @CreateDateColumn({ name: 'criado_em' })
  criadoEm: Date;
}
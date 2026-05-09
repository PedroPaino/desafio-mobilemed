import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ExamesService } from '../../services/exames.service';
import { PacientesService } from '../../../pacientes/services/pacientes.service';
import { ModalidadeDicom } from '../../../../shared/models/exame.model';
import { Paciente } from '../../../../shared/models/paciente.model';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

@Component({
  selector: 'app-cadastrar-exame',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './cadastrar-exame.component.html',
  styleUrl: './cadastrar-exame.component.scss',
})
export class CadastrarExameComponent implements OnInit {
  private fb = inject(FormBuilder);
  private examesService = inject(ExamesService);
  private pacientesService = inject(PacientesService);
  private router = inject(Router);

  state = signal<SubmitState>('idle');
  errorMessage = signal('');
  pacientes = signal<Paciente[]>([]);

  modalidades = Object.values(ModalidadeDicom);

  form = this.fb.nonNullable.group({
    pacienteId: ['', Validators.required],
    modalidade: ['', Validators.required],
    descricao: ['', [Validators.required, Validators.minLength(3)]],
    dataRealizacao: ['', Validators.required],
    idempotencyKey: [this.generateKey(), [Validators.required, Validators.minLength(8)]],
  });

  ngOnInit() {
    this.pacientesService.findAll(1, 100).subscribe({
      next: (res) => this.pacientes.set(res.data),
      error: () => this.pacientes.set([]),
    });
  }

  private generateKey(): string {
    return `exame-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }

  regenerateKey() {
    this.form.patchValue({ idempotencyKey: this.generateKey() });
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.state.set('submitting');
    this.errorMessage.set('');

    const payload = this.form.getRawValue();
    const dto = {
      ...payload,
      modalidade: payload.modalidade as ModalidadeDicom,
      dataRealizacao: new Date(payload.dataRealizacao).toISOString(),
    };

    this.examesService.create(dto).subscribe({
      next: () => {
        this.state.set('success');
        setTimeout(() => this.router.navigate(['/exames']), 1000);
      },
      error: (err) => {
        const msg = err.error?.message;
        this.errorMessage.set(
          Array.isArray(msg) ? msg.join(', ') : msg || 'Erro ao cadastrar exame'
        );
        this.state.set('error');
      },
    });
  }

  hasError(field: string, error: string): boolean {
    const control = this.form.get(field);
    return !!(control?.touched && control?.hasError(error));
  }

  isInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control?.touched && control?.invalid);
  }
}

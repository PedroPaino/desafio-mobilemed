import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PacientesService } from '../../services/pacientes.service';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

@Component({
  selector: 'app-cadastrar-paciente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './cadastrar-paciente.component.html',
  styleUrl: './cadastrar-paciente.component.scss',
})
export class CadastrarPacienteComponent {
  private fb = inject(FormBuilder);
  private pacientesService = inject(PacientesService);
  private router = inject(Router);

  state = signal<SubmitState>('idle');
  errorMessage = signal('');

  form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    documento: ['', [Validators.required, Validators.minLength(11)]],
    dataNascimento: ['', Validators.required],
    email: ['', Validators.email],
    telefone: [''],
  });

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
      email: payload.email || undefined,
      telefone: payload.telefone || undefined,
    };

    this.pacientesService.create(dto).subscribe({
      next: () => {
        this.state.set('success');
        setTimeout(() => this.router.navigate(['/pacientes']), 1000);
      },
      error: (err) => {
        const msg = err.error?.message;
        this.errorMessage.set(
          Array.isArray(msg) ? msg.join(', ') : msg || 'Erro ao cadastrar paciente'
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

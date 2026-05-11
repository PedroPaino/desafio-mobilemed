import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
    documento: ['', [Validators.required, Validators.pattern(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)]],
    dataNascimento: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    telefone: ['', Validators.required],
  });

  formatCpf(event: Event) {
    const input = event.target as HTMLInputElement;
    let v = input.value.replace(/\D/g, '').slice(0, 11);
    if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    else if (v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    this.form.get('documento')!.setValue(v, { emitEvent: false });
    input.value = v;
  }

  formatTelefone(event: Event) {
    const input = event.target as HTMLInputElement;
    let v = input.value.replace(/\D/g, '').slice(0, 11);
    if (v.length === 11) v = v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    else if (v.length >= 7) v = v.replace(/(\d{2})(\d{4,5})(\d{0,4})/, '($1) $2-$3');
    else if (v.length >= 3) v = v.replace(/(\d{2})(\d{1,5})/, '($1) $2');
    else if (v.length > 0) v = `(${v}`;
    this.form.get('telefone')!.setValue(v, { emitEvent: false });
    input.value = v;
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.state.set('submitting');
    this.errorMessage.set('');

    const raw = this.form.getRawValue();
    const dto = {
      nome: raw.nome,
      documento: raw.documento.replace(/\D/g, ''),
      dataNascimento: raw.dataNascimento,
      email: raw.email,
      telefone: raw.telefone.replace(/\D/g, ''),
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

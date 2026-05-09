import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PacientesService } from '../../services/pacientes.service';
import { Paciente } from '../../../../shared/models/paciente.model';

type LoadState = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-listar-pacientes',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './listar-pacientes.component.html',
  styleUrl: './listar-pacientes.component.scss',
})
export class ListarPacientesComponent implements OnInit {
  private pacientesService = inject(PacientesService);

  pacientes = signal<Paciente[]>([]);
  total = signal(0);
  page = signal(1);
  pageSize = signal(10);
  totalPages = signal(0);
  state = signal<LoadState>('idle');
  errorMessage = signal('');

  ngOnInit() {
    this.carregar();
  }

  carregar() {
    this.state.set('loading');
    this.errorMessage.set('');

    this.pacientesService.findAll(this.page(), this.pageSize()).subscribe({
      next: (response) => {
        this.pacientes.set(response.data);
        this.total.set(response.total);
        this.totalPages.set(response.totalPages);
        this.state.set('success');
      },
      error: (err) => {
        this.errorMessage.set(
          err.error?.message || 'Erro ao carregar pacientes. Verifique sua conexão.'
        );
        this.state.set('error');
      },
    });
  }

  proximaPagina() {
    if (this.page() < this.totalPages()) {
      this.page.update((p) => p + 1);
      this.carregar();
    }
  }

  paginaAnterior() {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
      this.carregar();
    }
  }
}
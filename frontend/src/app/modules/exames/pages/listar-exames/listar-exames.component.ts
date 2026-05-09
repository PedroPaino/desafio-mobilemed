import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ExamesService } from '../../services/exames.service';
import { Exame } from '../../../../shared/models/exame.model';

type LoadState = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-listar-exames',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './listar-exames.component.html',
  styleUrl: './listar-exames.component.scss',
})
export class ListarExamesComponent implements OnInit {
  private examesService = inject(ExamesService);

  exames = signal<Exame[]>([]);
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

    this.examesService.findAll(this.page(), this.pageSize()).subscribe({
      next: (response) => {
        this.exames.set(response.data);
        this.total.set(response.total);
        this.totalPages.set(response.totalPages);
        this.state.set('success');
      },
      error: (err) => {
        this.errorMessage.set(
          err.error?.message || 'Erro ao carregar exames. Verifique sua conexão.'
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

import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'pacientes', pathMatch: 'full' },
  {
    path: 'pacientes',
    loadComponent: () =>
      import('./modules/pacientes/pages/listar-pacientes/listar-pacientes.component')
        .then((m) => m.ListarPacientesComponent),
  },
  {
    path: 'pacientes/novo',
    loadComponent: () =>
      import('./modules/pacientes/pages/cadastrar-paciente/cadastrar-paciente.component')
        .then((m) => m.CadastrarPacienteComponent),
  },
  {
    path: 'exames',
    loadComponent: () =>
      import('./modules/exames/pages/listar-exames/listar-exames.component')
        .then((m) => m.ListarExamesComponent),
  },
  {
    path: 'exames/novo',
    loadComponent: () =>
      import('./modules/exames/pages/cadastrar-exame/cadastrar-exame.component')
        .then((m) => m.CadastrarExameComponent),
  },
  { path: '**', redirectTo: 'pacientes' },
];

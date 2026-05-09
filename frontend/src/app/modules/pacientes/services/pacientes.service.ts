import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Paciente, CreatePacienteDto } from '../../../shared/models/paciente.model';
import { PaginatedResponse } from '../../../shared/models/pagination.model';

@Injectable({ providedIn: 'root' })
export class PacientesService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:3000/pacientes';

  create(dto: CreatePacienteDto): Observable<Paciente> {
    return this.http.post<Paciente>(this.baseUrl, dto);
  }

  findAll(page: number = 1, pageSize: number = 10): Observable<PaginatedResponse<Paciente>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<PaginatedResponse<Paciente>>(this.baseUrl, { params });
  }
}
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Exame, CreateExameDto } from '../../../shared/models/exame.model';
import { PaginatedResponse } from '../../../shared/models/pagination.model';

@Injectable({ providedIn: 'root' })
export class ExamesService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:3000/exames';

  create(dto: CreateExameDto): Observable<Exame> {
    return this.http.post<Exame>(this.baseUrl, dto);
  }

  findAll(page: number = 1, pageSize: number = 10): Observable<PaginatedResponse<Exame>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<PaginatedResponse<Exame>>(this.baseUrl, { params });
  }
}
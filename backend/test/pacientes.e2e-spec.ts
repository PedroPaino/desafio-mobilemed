import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { createTestApp } from './test-utils';

describe('Pacientes (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const setup = await createTestApp();
    app = setup.app;
    dataSource = setup.dataSource;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /pacientes', () => {
    it('Cenário 1: deve criar paciente com dados válidos e retornar 201', async () => {
      const response = await request(app.getHttpServer())
        .post('/pacientes')
        .send({
          nome: 'João Silva',
          documento: '11111111111',
          dataNascimento: '1990-01-01',
          email: 'joao@example.com',
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.nome).toBe('João Silva');
      expect(response.body.documento).toBe('11111111111');
      expect(response.body.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
      );
    });

    it('Cenário 2: deve retornar 409 ao criar paciente com documento duplicado', async () => {
      await request(app.getHttpServer())
        .post('/pacientes')
        .send({
          nome: 'Maria',
          documento: '22222222222',
          dataNascimento: '1985-05-20',
        })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post('/pacientes')
        .send({
          nome: 'Outra Maria',
          documento: '22222222222',
          dataNascimento: '1990-01-01',
        })
        .expect(409);

      expect(response.body.message).toContain('22222222222');
    });

    it('deve retornar 400 com dados inválidos (nome curto)', async () => {
      const response = await request(app.getHttpServer())
        .post('/pacientes')
        .send({
          nome: 'Ab',
          documento: '33333333333',
          dataNascimento: '1990-01-01',
        })
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/Nome deve ter no mínimo 3/),
        ]),
      );
    });

    it('deve retornar 400 com email inválido', async () => {
      await request(app.getHttpServer())
        .post('/pacientes')
        .send({
          nome: 'Pedro Santos',
          documento: '44444444444',
          dataNascimento: '1990-01-01',
          email: 'email-invalido',
        })
        .expect(400);
    });
  });

  describe('GET /pacientes', () => {
    beforeAll(async () => {
      for (let i = 0; i < 15; i++) {
        await request(app.getHttpServer())
          .post('/pacientes')
          .send({
            nome: `Paciente ${i}`,
            documento: `5${i.toString().padStart(10, '0')}`,
            dataNascimento: '1990-01-01',
          });
      }
    });

    it('Cenário 8: deve listar pacientes paginados', async () => {
      const response = await request(app.getHttpServer())
        .get('/pacientes?page=1&pageSize=10')
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(10);
      expect(response.body.page).toBe(1);
      expect(response.body.pageSize).toBe(10);
      expect(response.body.total).toBeGreaterThanOrEqual(15);
      expect(response.body.totalPages).toBeGreaterThanOrEqual(2);
    });

    it('deve retornar segunda página corretamente', async () => {
      const response = await request(app.getHttpServer())
        .get('/pacientes?page=2&pageSize=10')
        .expect(200);

      expect(response.body.page).toBe(2);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });
});

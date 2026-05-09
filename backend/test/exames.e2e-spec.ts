import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { createTestApp } from './test-utils';

describe('Exames (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let pacienteId: string;

  beforeAll(async () => {
    const setup = await createTestApp();
    app = setup.app;
    dataSource = setup.dataSource;

    const res = await request(app.getHttpServer())
      .post('/pacientes')
      .send({
        nome: 'Paciente Teste',
        documento: '99999999999',
        dataNascimento: '1990-01-01',
      });
    pacienteId = res.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /exames', () => {
    it('Cenário 3: deve criar exame com idempotencyKey nova → 201', async () => {
      const response = await request(app.getHttpServer())
        .post('/exames')
        .send({
          idempotencyKey: 'key-cenario-3',
          modalidade: 'CT',
          descricao: 'Tomografia computadorizada',
          dataRealizacao: '2026-05-10T10:00:00Z',
          pacienteId,
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.modalidade).toBe('CT');
      expect(response.body.idempotencyKey).toBe('key-cenario-3');
    });

    it('Cenário 4: deve retornar 200 com mesmo exame ao reenviar mesma idempotencyKey', async () => {
      const payload = {
        idempotencyKey: 'key-cenario-4',
        modalidade: 'MR',
        descricao: 'Ressonância magnética',
        dataRealizacao: '2026-05-10T10:00:00Z',
        pacienteId,
      };

      const first = await request(app.getHttpServer())
        .post('/exames')
        .send(payload)
        .expect(201);

      const second = await request(app.getHttpServer())
        .post('/exames')
        .send(payload)
        .expect(200);

      expect(second.body.id).toBe(first.body.id);
      expect(second.body.idempotencyKey).toBe('key-cenario-4');
    });

    it('Cenário 5 ⭐: 10 requisições simultâneas com mesma key → 1 exame persistido', async () => {
      const payload = {
        idempotencyKey: 'key-cenario-5-concorrencia',
        modalidade: 'US',
        descricao: 'Ultrassom abdominal',
        dataRealizacao: '2026-05-10T10:00:00Z',
        pacienteId,
      };

      const promises = Array(10)
        .fill(null)
        .map(() =>
          request(app.getHttpServer()).post('/exames').send(payload),
        );

      const responses = await Promise.all(promises);

      responses.forEach((r) => {
        expect([200, 201]).toContain(r.status);
      });

      const ids = responses.map((r) => r.body.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(1);

      const dbCount = await dataSource.query(
        `SELECT COUNT(*) as count FROM exames WHERE idempotency_key = ?`,
        ['key-cenario-5-concorrencia'],
      );
      expect(Number(dbCount[0].count)).toBe(1);
    });

    it('Cenário 6: deve retornar 400 ao criar exame com paciente inexistente', async () => {
      const response = await request(app.getHttpServer())
        .post('/exames')
        .send({
          idempotencyKey: 'key-cenario-6',
          modalidade: 'CT',
          descricao: 'Teste',
          dataRealizacao: '2026-05-10T10:00:00Z',
          pacienteId: '550e8400-e29b-41d4-a716-446655440000',
        })
        .expect(400);

      expect(response.body.message).toContain('não encontrado');
    });

    it('Cenário 11: deve retornar 400 com modalidade DICOM inválida', async () => {
      await request(app.getHttpServer())
        .post('/exames')
        .send({
          idempotencyKey: 'key-cenario-11',
          modalidade: 'ZZ',
          descricao: 'Teste',
          dataRealizacao: '2026-05-10T10:00:00Z',
          pacienteId,
        })
        .expect(400);
    });

    it('deve aceitar todas as modalidades DICOM válidas', async () => {
      const modalidades = [
        'CR', 'CT', 'DX', 'MG', 'MR', 'NM', 'OT', 'PT', 'RF', 'US', 'XA',
      ];

      for (const m of modalidades) {
        await request(app.getHttpServer())
          .post('/exames')
          .send({
            idempotencyKey: `key-modalidade-${m}`,
            modalidade: m,
            descricao: `Exame ${m}`,
            dataRealizacao: '2026-05-10T10:00:00Z',
            pacienteId,
          })
          .expect(201);
      }
    });
  });

  describe('GET /exames', () => {
    it('Cenário 7: deve listar exames paginados', async () => {
      const response = await request(app.getHttpServer())
        .get('/exames?page=1&pageSize=5')
        .expect(200);

      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
      expect(response.body.page).toBe(1);
      expect(response.body.pageSize).toBe(5);
      expect(response.body.total).toBeGreaterThan(0);
    });
  });
});

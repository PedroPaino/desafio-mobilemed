# Desafio MobileMed — Cadastro de Pacientes e Exames com Modalidades DICOM

Aplicação fullstack para registro e consulta de pacientes e exames médicos, com foco em **idempotência sob concorrência**, transações ACID e experiência de navegação consistente mesmo em situações de reenvio de requisição ou acessos simultâneos.

## Stack

**Backend:** NestJS 11 + TypeORM + MySQL 8 + Jest + Supertest
**Frontend:** Angular 17+ (standalone components, signals, reactive forms)
**Infra:** Docker Compose para o MySQL

## Pré-requisitos

- Node.js 20+
- Docker Desktop rodando
- npm

## Como rodar

```bash
# 1. Subir o MySQL
docker compose up -d

# 2. Criar banco de testes (uma vez só)
docker exec -it mobilemed-mysql mysql -uroot -proot \
  -e "CREATE DATABASE IF NOT EXISTS mobilemed_test; GRANT ALL ON mobilemed_test.* TO 'app'@'%'; FLUSH PRIVILEGES;"

# 3. Backend
cd backend
npm install
cp .env.example .env  # se ainda não existe um .env
npm run start:dev
# → http://localhost:3000

# 4. Frontend (em outro terminal)
cd frontend
npm install
ng serve
# → http://localhost:4200
```

## Como rodar os testes

```bash
cd backend

# Testes e2e (incluindo concorrência)
npm run test:e2e

# Cobertura
npm run test:e2e -- --coverage
```

**Resultado atual:** 13/13 testes passando, cobertura de **95.12% em statements** nos services e controllers.

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/pacientes` | Cadastra paciente. 201 sucesso, 409 documento duplicado, 400 validação |
| GET | `/pacientes?page=1&pageSize=10` | Lista paginada |
| POST | `/exames` | Cadastra exame idempotente. 201 novo, **200 idempotente**, 400 paciente inexistente/modalidade inválida |
| GET | `/exames?page=1&pageSize=10` | Lista paginada com paciente relacionado |

### Modalidades DICOM suportadas

`CR`, `CT`, `DX`, `MG`, `MR`, `NM`, `OT`, `PT`, `RF`, `US`, `XA`

## Decisões de arquitetura

### 1. Idempotência sob concorrência

A regra é simples: **uma `idempotencyKey` não pode gerar dois exames, nem mesmo com 1000 requisições simultâneas chegando ao mesmo tempo**.

Considerei três abordagens:

**(a) Verificação aplicação — SELECT-then-INSERT.** Recusada. Tem race condition clássica de TOCTOU (Time of Check, Time of Use): duas requisições podem passar no SELECT antes que qualquer INSERT seja persistido, e ambas inserem.

**(b) Lock distribuído (ex: Redis `SET NX`).** Funciona, mas adiciona infraestrutura externa e ainda assim precisa de UNIQUE constraint como rede de segurança. Para essa carga, complexidade desnecessária.

**(c) UNIQUE INDEX no banco + transação + handler de erro 1062.** ✅ **Escolhida.**

O fluxo está em `exames.service.ts`:

```typescript
return this.dataSource.transaction(async (manager) => {
  try {
    const saved = await manager.save(exame);
    return { exame: saved, created: true };  // 201
  } catch (error) {
    if (error instanceof QueryFailedError && error.errno === 1062) {
      const existing = await manager.findOne(ExameEntity, {
        where: { idempotencyKey: dto.idempotencyKey },
      });
      return { exame: existing, created: false };  // 200
    }
    throw error;
  }
});
```

**Por que funciona sob concorrência:** o `UNIQUE INDEX` no MySQL serializa as inserções no nível do banco. Mesmo com N requests chegando no mesmo milissegundo, apenas UMA passa no INSERT. As outras falham com `errno 1062`, caem no catch, fazem SELECT e retornam o exame original.

**Como provei isso:** o teste `exames.e2e-spec.ts` dispara 10 requisições com `Promise.all` usando a mesma key e verifica via `SELECT COUNT(*) FROM exames WHERE idempotency_key = ?` que apenas **1 registro** foi persistido. O teste roda contra MySQL real (não mock), garantindo o comportamento ponta a ponta.

### 2. Arquitetura simplificada por camadas (não Clean Architecture canônica)

A vaga pede Clean Architecture. Optei por uma versão **simplificada** com separação clara em camadas:

```
src/modules/<feature>/
  entities/      ← TypeORM entity (modelo de domínio + persistência)
  dtos/          ← validação de entrada (class-validator)
  services/      ← regra de negócio
  controllers/   ← HTTP (fino, só roteia para service)
```

**Trade-off honesto:** não criei interfaces `IRepository` com implementações separadas, ports/adapters, ou DTOs de domínio separados dos de transporte. Isso seria *over-engineering* para um CRUD com 2 entidades.

A próxima iteração natural seria extrair a interface do repositório para o domínio, permitindo trocar TypeORM por outra implementação sem mexer no service. Numa aplicação real com lógica de negócio mais complexa, faria isso desde o início.

### 3. Defesa em profundidade na validação

A validação acontece em **três camadas**, intencionalmente redundantes:

1. **Frontend (Reactive Forms):** feedback visual imediato, evita requests desnecessários
2. **DTO + class-validator no controller:** rejeita payload malformado antes de chegar ao service (400)
3. **Banco (UNIQUE constraint, enum, NOT NULL):** última linha de defesa

Mesmo que duas camadas falhem por bug, a terceira ainda protege a integridade dos dados.

### 4. UUID v4 para IDs

Auto-increment vaza informação (quantos registros existem) e dificulta sincronização entre sistemas. UUID v4 é seguro, padrão em sistemas distribuídos, e gerado pelo TypeORM (`@PrimaryGeneratedColumn('uuid')`).

## Estrutura do projeto

```
desafio-mobilemed/
├── docker-compose.yml          # MySQL
├── backend/
│   ├── src/
│   │   ├── config/             # databaseConfig
│   │   ├── modules/
│   │   │   ├── pacientes/      # entity, dto, service, controller, module
│   │   │   └── exames/         # entity, dto, service, controller, module
│   │   ├── shared/dtos/        # PaginationDto, PaginatedResponse
│   │   ├── app.module.ts
│   │   └── main.ts             # bootstrap + ValidationPipe + CORS
│   └── test/
│       ├── test-utils.ts       # helper para criar app de teste
│       ├── pacientes.e2e-spec.ts
│       └── exames.e2e-spec.ts  # inclui teste de concorrência
└── frontend/
    └── src/app/
        ├── shared/models/      # Paciente, Exame, PaginatedResponse
        ├── core/               # interceptors (preparado para evolução)
        └── modules/
            ├── pacientes/      # services + pages (listar, cadastrar)
            └── exames/         # services + pages (listar, cadastrar)
```

## Cenários de teste cobertos

| # | Cenário | Como foi validado |
|---|---------|-------------------|
| 1 | Criar paciente válido | e2e `pacientes.e2e-spec.ts` |
| 2 | CPF duplicado → 409 | e2e |
| 3 | Exame com idempotencyKey nova → 201 | e2e |
| 4 | Reenvio mesma key → 200 com mesmo id | e2e |
| 5 | **10 requests simultâneas → 1 exame** ⭐ | e2e com `Promise.all` + COUNT no banco |
| 6 | Paciente inexistente → 400 | e2e |
| 7 | Listar exames paginado | e2e |
| 8 | Listar pacientes paginado | e2e |
| 9 | Loading no frontend | Componentes com signal `state: 'loading'` exibem spinner |
| 10 | Erro de rede + retry | Componentes com signal `state: 'error'` exibem mensagem + botão "Tentar novamente" |
| 11 | Modalidade DICOM inválida | e2e + `@IsEnum(ModalidadeDicom)` no DTO |
| 12 | Validação visual | Reactive Forms + `markAllAsTouched` + classes CSS condicionais |
| 13 | **Cobertura ≥ 80%** | **95.12% statements, 94.59% lines, 93.33% funcs** nos services e controllers |

## O que NÃO foi feito (e por quê)

- **Redis:** mencionado nos requisitos como opcional. O fluxo de idempotência não precisa de Redis quando o UNIQUE constraint do banco resolve atomicamente. Adicionaria Redis em duas situações reais: (a) cache de listagens de alta frequência, (b) rate limiting na API.
- **Migrations explícitas:** uso `synchronize: true` em desenvolvimento por simplicidade. Em produção isso é **proibido** porque pode destruir dados — a abordagem correta é gerar migrations com `typeorm migration:generate`.
- **NestJS testes unitários isolados (com mocks):** priorizei testes e2e contra MySQL real porque eles capturam comportamento que mocks não capturam — especialmente o `errno 1062` que sustenta a idempotência. Testes unitários com `jest.Mocked<Repository>` seriam o próximo passo para acelerar feedback local.
- **Frontend tests com TestBed:** entrega focou em ponta a ponta no backend (que tem mais regra de negócio); testes de componente Angular ficariam numa segunda iteração.
- **Autenticação/autorização:** fora de escopo.
- **Healthcheck endpoint:** recomendado em produção (`/health` retornando status do banco), fora do escopo.

## Comentário final

O coração técnico do desafio é o **Cenário 5** (idempotência sob concorrência). O resto é CRUD bem feito com validação em camadas.

A solução final é deliberadamente simples: confia no banco para serializar o INSERT via UNIQUE, captura a exceção específica do MySQL (`errno 1062`), e retorna o registro existente. Isso é mais robusto que lógica em aplicação, mais simples que lock distribuído, e provadamente correto via teste de concorrência com 10 requisições simultâneas que confirmam, por contagem no banco, que apenas 1 registro foi persistido.
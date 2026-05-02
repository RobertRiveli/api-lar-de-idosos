# Administracao de medicamentos - Guia para o frontend

Este documento descreve como implementar telas e servicos de frontend relacionados a administracoes de medicamentos e como consumir a API de `medication-administrations`.

## Visao geral

As rotas de administracao de medicamentos sao protegidas por token JWT. O backend identifica a empresa pelo token do usuario autenticado, entao o frontend nao deve enviar `companyId` no payload nem na URL.

Fluxo principal:

- o admin cria uma prescricao em `POST /prescriptions`;
- o backend calcula os horarios a partir de `firstScheduledAt` e `intervalHours`;
- o backend cria automaticamente varias administracoes com status inicial `PENDING`;
- cuidadores e admins listam as administracoes e marcam como `ADMINISTERED`, `REFUSED`, `MISSED` ou `CANCELED`, conforme permissao.

Funcionalidades disponiveis:

- listar administracoes do dia;
- listar administracoes de um residente;
- buscar detalhes de uma administracao;
- marcar uma administracao como administrada;
- marcar uma administracao como recusada;
- marcar uma administracao como perdida/nao administrada;
- cancelar uma administracao;
- criar administracao manual apenas como dose avulsa, correcao ou excecao administrativa.

## Base da API

Exemplo em ambiente local:

```txt
http://localhost:<PORT>
```

O valor de `PORT` vem da variavel de ambiente `PORT` usada pelo backend.

## Autenticacao

Todas as rotas de administracao de medicamentos exigem token JWT.

O token deve ser o valor retornado no login em:

```txt
data.token
```

Formato obrigatorio do header:

```http
Authorization: Bearer jwt.token.aqui
```

Exemplo de configuracao com Axios:

```js
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
```

## Permissoes

| Acao | Roles permitidas |
| ---- | ---------------- |
| Listar administracoes | `admin`, `caregiver` |
| Buscar detalhes | `admin`, `caregiver` |
| Marcar como administrada | `admin`, `caregiver` |
| Marcar como recusada | `admin`, `caregiver` |
| Marcar como perdida | `admin`, `caregiver` |
| Cancelar administracao | `admin` |
| Criar administracao manual | `admin` |

O frontend deve ocultar ou bloquear botoes de cancelamento e criacao manual para usuarios que nao sejam `admin`.

## Status

Status retornados pela API:

| Status | Significado | Estado final |
| ------ | ----------- | ------------ |
| `PENDING` | Administracao prevista e ainda nao concluida. | Nao |
| `ADMINISTERED` | Medicamento administrado. | Sim |
| `REFUSED` | Residente recusou o medicamento. | Sim |
| `MISSED` | Medicamento nao foi administrado/perdido. | Sim |
| `CANCELED` | Administracao cancelada por admin. | Sim |

Somente administracoes com status `PENDING` podem ser alteradas pelas rotas de status.

## Modelo de administracao

Campos retornados nas listagens e detalhes:

| Campo | Tipo | Descricao |
| ----- | ---- | --------- |
| `id` | string | ID da administracao. |
| `scheduledAt` | string | Data e hora previstas em formato ISO. |
| `administeredAt` | string ou `null` | Data e hora real da administracao. |
| `status` | string | `PENDING`, `ADMINISTERED`, `REFUSED`, `MISSED` ou `CANCELED`. |
| `resident` | object | Dados basicos do residente: `id` e `fullName`. |
| `medication` | object | Dados basicos do medicamento: `id`, `genericName`, `brandName`. |
| `measurementUnit` | object | Dados da unidade: `id`, `name`, `abbreviation`. |
| `prescription` | object | Dados da prescricao: `id`, `dosage`, `route`, `frequency`. |
| `caregiver` | object ou `null` | Cuidador que marcou o status, quando existir. |
| `notes` | string ou `null` | Observacoes gerais. |
| `reason` | string ou `null` | Justificativa para recusada, perdida ou cancelada. |
| `createdAt` | string | Retornado apenas no detalhe por ID. |
| `updatedAt` | string | Retornado apenas no detalhe por ID. |

Exemplo de item:

```json
{
  "id": "uuid-da-administracao",
  "scheduledAt": "2026-05-02T08:00:00.000Z",
  "administeredAt": null,
  "status": "PENDING",
  "resident": {
    "id": "uuid-do-residente",
    "fullName": "Joao da Silva"
  },
  "medication": {
    "id": "uuid-do-medicamento",
    "genericName": "Dipirona",
    "brandName": "Novalgina"
  },
  "measurementUnit": {
    "id": "uuid-da-unidade",
    "name": "miligrama",
    "abbreviation": "mg"
  },
  "prescription": {
    "id": "uuid-da-prescricao",
    "dosage": "500",
    "route": "oral",
    "frequency": "a cada 8 horas"
  },
  "caregiver": null,
  "notes": null,
  "reason": null
}
```

## Como as administracoes sao criadas automaticamente

A criacao normal acontece quando o frontend chama `POST /prescriptions`. O frontend nao precisa criar manualmente as administracoes do fluxo comum.

Campos da prescricao usados no calculo:

| Campo | Descricao |
| ----- | --------- |
| `firstScheduledAt` | Primeiro horario previsto da agenda. |
| `intervalHours` | Intervalo, em horas, entre uma administracao e a proxima. |
| `startDate` | Data a partir da qual horarios podem ser gerados. |
| `endDate` | Data final da prescricao. Quando `null`, o backend gera 7 dias. |

Exemplo:

```json
{
  "firstScheduledAt": "2026-05-02T08:00:00.000Z",
  "intervalHours": 8,
  "startDate": "2026-05-02T00:00:00.000Z",
  "endDate": "2026-05-03T23:59:59.000Z"
}
```

Horarios gerados:

```txt
2026-05-02T08:00:00.000Z
2026-05-02T16:00:00.000Z
2026-05-03T00:00:00.000Z
2026-05-03T08:00:00.000Z
2026-05-03T16:00:00.000Z
```

## Listar administracoes do dia

Use esta rota para montar a agenda diaria dos cuidadores.

### Endpoint

```http
GET /medication-administrations/today
Authorization: Bearer <token>
```

### Query params

| Parametro | Tipo | Obrigatorio | Descricao |
| --------- | ---- | ----------- | --------- |
| `status` | string | Nao | Filtra por `PENDING`, `ADMINISTERED`, `REFUSED`, `MISSED` ou `CANCELED`. |

Exemplo:

```http
GET /medication-administrations/today?status=PENDING
```

### Exemplo com Axios

```js
export async function listTodayMedicationAdministrations(filters = {}) {
  const { data } = await api.get("/medication-administrations/today", {
    params: filters,
  });

  return data.data;
}
```

### Resposta de sucesso

Status HTTP:

```http
200 OK
```

Body:

```json
{
  "success": true,
  "message": "Administrações de medicamentos listadas com sucesso.",
  "data": [
    {
      "id": "uuid-da-administracao",
      "scheduledAt": "2026-05-02T08:00:00.000Z",
      "administeredAt": null,
      "status": "PENDING",
      "resident": {
        "id": "uuid-do-residente",
        "fullName": "Joao da Silva"
      },
      "medication": {
        "id": "uuid-do-medicamento",
        "genericName": "Dipirona",
        "brandName": "Novalgina"
      },
      "measurementUnit": {
        "id": "uuid-da-unidade",
        "name": "miligrama",
        "abbreviation": "mg"
      },
      "prescription": {
        "id": "uuid-da-prescricao",
        "dosage": "500",
        "route": "oral",
        "frequency": "a cada 8 horas"
      },
      "caregiver": null,
      "notes": null,
      "reason": null
    }
  ]
}
```

## Listar administracoes por residente

Use esta rota para montar historico ou agenda de um residente especifico.

### Endpoint

```http
GET /residents/:residentId/medication-administrations
Authorization: Bearer <token>
```

### Parametros de rota

| Parametro | Tipo | Obrigatorio | Descricao |
| --------- | ---- | ----------- | --------- |
| `residentId` | string | Sim | ID do residente. |

### Query params

| Parametro | Tipo | Obrigatorio | Descricao |
| --------- | ---- | ----------- | --------- |
| `startDate` | string | Nao | Data/hora inicial em formato ISO. |
| `endDate` | string | Nao | Data/hora final em formato ISO. |
| `status` | string | Nao | Filtra por status. |

Exemplo:

```http
GET /residents/uuid-do-residente/medication-administrations?startDate=2026-05-01T00:00:00.000Z&endDate=2026-05-07T23:59:59.000Z&status=PENDING
```

### Exemplo com Axios

```js
export async function listResidentMedicationAdministrations(
  residentId,
  filters = {},
) {
  const { data } = await api.get(
    `/residents/${residentId}/medication-administrations`,
    {
      params: filters,
    },
  );

  return data.data;
}
```

### Comportamento da API

A API valida se o residente existe, esta ativo e pertence a empresa do usuario autenticado. Se `endDate` for menor que `startDate`, a API retorna erro de validacao.

## Buscar administracao por ID

Use esta rota para abrir uma tela de detalhes, modal ou drawer de uma administracao.

### Endpoint

```http
GET /medication-administrations/:id
Authorization: Bearer <token>
```

### Parametros de rota

| Parametro | Tipo | Obrigatorio | Descricao |
| --------- | ---- | ----------- | --------- |
| `id` | string | Sim | ID da administracao. |

### Exemplo com Axios

```js
export async function getMedicationAdministrationById(id) {
  const { data } = await api.get(`/medication-administrations/${id}`);

  return data.data;
}
```

### Resposta de sucesso

O detalhe retorna os mesmos campos das listagens, com `createdAt` e `updatedAt`.

```json
{
  "success": true,
  "message": "Administração de medicamento encontrada com sucesso.",
  "data": {
    "id": "uuid-da-administracao",
    "scheduledAt": "2026-05-02T08:00:00.000Z",
    "administeredAt": null,
    "status": "PENDING",
    "resident": {
      "id": "uuid-do-residente",
      "fullName": "Joao da Silva"
    },
    "medication": {
      "id": "uuid-do-medicamento",
      "genericName": "Dipirona",
      "brandName": "Novalgina"
    },
    "measurementUnit": {
      "id": "uuid-da-unidade",
      "name": "miligrama",
      "abbreviation": "mg"
    },
    "prescription": {
      "id": "uuid-da-prescricao",
      "dosage": "500",
      "route": "oral",
      "frequency": "a cada 8 horas"
    },
    "caregiver": null,
    "notes": null,
    "reason": null,
    "createdAt": "2026-05-02T10:30:00.000Z",
    "updatedAt": "2026-05-02T10:30:00.000Z"
  }
}
```

## Marcar como administrado

Use esta rota quando o medicamento foi administrado ao residente.

### Endpoint

```http
PATCH /medication-administrations/:id/administer
Content-Type: application/json
Authorization: Bearer <token>
```

### Payload

```json
{
  "administeredAt": "2026-05-02T08:10:00.000Z",
  "notes": "Administrado com agua."
}
```

`administeredAt` e opcional. Se nao for enviado, o backend usa a data/hora atual. `notes` tambem e opcional.

### Exemplo com Axios

```js
export async function administerMedicationAdministration(id, form = {}) {
  const { data } = await api.patch(
    `/medication-administrations/${id}/administer`,
    {
      administeredAt: form.administeredAt?.toISOString(),
      notes: form.notes?.trim() || undefined,
    },
  );

  return data.data;
}
```

### Resposta de sucesso

```json
{
  "success": true,
  "message": "Medicamento marcado como administrado com sucesso.",
  "data": {
    "id": "uuid-da-administracao",
    "status": "ADMINISTERED",
    "scheduledAt": "2026-05-02T08:00:00.000Z",
    "administeredAt": "2026-05-02T08:10:00.000Z",
    "reason": null
  }
}
```

## Marcar como recusado

Use esta rota quando o residente recusou o medicamento.

### Endpoint

```http
PATCH /medication-administrations/:id/refuse
Content-Type: application/json
Authorization: Bearer <token>
```

### Payload

```json
{
  "reason": "Residente recusou o medicamento.",
  "notes": "Tentativa feita as 08:05."
}
```

`reason` e obrigatorio. `notes` e opcional.

### Exemplo com Axios

```js
export async function refuseMedicationAdministration(id, form) {
  const { data } = await api.patch(
    `/medication-administrations/${id}/refuse`,
    {
      reason: form.reason.trim(),
      notes: form.notes?.trim() || undefined,
    },
  );

  return data.data;
}
```

### Resposta de sucesso

```json
{
  "success": true,
  "message": "Medicamento marcado como recusado com sucesso.",
  "data": {
    "id": "uuid-da-administracao",
    "status": "REFUSED",
    "scheduledAt": "2026-05-02T08:00:00.000Z",
    "administeredAt": null,
    "reason": "Residente recusou o medicamento."
  }
}
```

## Marcar como perdido

Use esta rota quando o medicamento nao foi administrado por indisponibilidade, esquecimento, impossibilidade operacional ou outra justificativa.

### Endpoint

```http
PATCH /medication-administrations/:id/miss
Content-Type: application/json
Authorization: Bearer <token>
```

### Payload

```json
{
  "reason": "Medicamento nao estava disponivel.",
  "notes": "Administracao nao realizada."
}
```

`reason` e obrigatorio. `notes` e opcional.

### Exemplo com Axios

```js
export async function missMedicationAdministration(id, form) {
  const { data } = await api.patch(
    `/medication-administrations/${id}/miss`,
    {
      reason: form.reason.trim(),
      notes: form.notes?.trim() || undefined,
    },
  );

  return data.data;
}
```

### Resposta de sucesso

```json
{
  "success": true,
  "message": "Medicamento marcado como perdido com sucesso.",
  "data": {
    "id": "uuid-da-administracao",
    "status": "MISSED",
    "scheduledAt": "2026-05-02T08:00:00.000Z",
    "administeredAt": null,
    "reason": "Medicamento nao estava disponivel."
  }
}
```

## Cancelar administracao

Use esta rota para cancelamento administrativo. Apenas usuarios `admin` podem cancelar.

### Endpoint

```http
PATCH /medication-administrations/:id/cancel
Content-Type: application/json
Authorization: Bearer <token>
```

### Payload

```json
{
  "reason": "Prescricao foi suspensa pelo medico.",
  "notes": "Cancelamento realizado pelo administrador."
}
```

`reason` e obrigatorio. `notes` e opcional.

### Exemplo com Axios

```js
export async function cancelMedicationAdministration(id, form) {
  const { data } = await api.patch(
    `/medication-administrations/${id}/cancel`,
    {
      reason: form.reason.trim(),
      notes: form.notes?.trim() || undefined,
    },
  );

  return data.data;
}
```

### Resposta de sucesso

```json
{
  "success": true,
  "message": "Administração de medicamento cancelada com sucesso.",
  "data": {
    "id": "uuid-da-administracao",
    "status": "CANCELED",
    "scheduledAt": "2026-05-02T08:00:00.000Z",
    "administeredAt": null,
    "reason": "Prescricao foi suspensa pelo medico."
  }
}
```

## Criar administracao manual

Use esta rota apenas para dose avulsa, correcao ou excecao administrativa. O fluxo normal deve criar administracoes automaticamente pelo `POST /prescriptions`.

### Endpoint

```http
POST /medication-administrations/manual
Content-Type: application/json
Authorization: Bearer <token>
```

### Payload

```json
{
  "prescriptionId": "uuid-da-prescricao",
  "residentId": "uuid-do-residente",
  "scheduledAt": "2026-05-02T14:00:00.000Z",
  "notes": "Dose avulsa autorizada pelo admin."
}
```

### Campos do cadastro manual

| Campo | Tipo | Obrigatorio | Regra |
| ----- | ---- | ----------- | ----- |
| `prescriptionId` | string | Sim | UUID de uma prescricao ativa da empresa do usuario. |
| `residentId` | string | Sim | UUID de um residente ativo da empresa do usuario. |
| `scheduledAt` | string | Sim | Data e hora em formato ISO com timezone. |
| `notes` | string | Nao | Observacoes gerais com no maximo 1000 caracteres. |

### Exemplo com Axios

```js
export async function createManualMedicationAdministration(form) {
  const { data } = await api.post("/medication-administrations/manual", {
    prescriptionId: form.prescriptionId,
    residentId: form.residentId,
    scheduledAt: form.scheduledAt.toISOString(),
    notes: form.notes?.trim() || undefined,
  });

  return data.data;
}
```

### Resposta de sucesso

```json
{
  "success": true,
  "message": "Administração manual de medicamento criada com sucesso.",
  "data": {
    "id": "uuid-da-administracao",
    "status": "PENDING",
    "scheduledAt": "2026-05-02T14:00:00.000Z",
    "administeredAt": null,
    "reason": null
  }
}
```

## Normalizacao de datas

Envie datas em formato ISO com timezone. O formato recomendado e:

```txt
2026-05-02T08:00:00.000Z
```

Se a tela usar `input type="date"` e `input type="time"`, converta antes de enviar:

```js
const toIsoDateTime = ({ date, time }) => {
  if (!date || !time) return "";

  return new Date(`${date}T${time}:00`).toISOString();
};
```

Evite enviar datas sem timezone, como `2026-05-02T08:00:00`, porque navegadores e ambientes podem interpretar o valor de forma diferente.

## Erros comuns

Formato padrao de erro:

```json
{
  "success": false,
  "message": "Dados de entrada inválidos",
  "errors": {
    "scheduledAt": "scheduledAt deve estar em formato ISO"
  },
  "errorType": "VALIDATION_ERROR"
}
```

Mensagens comuns:

| Campo | Mensagem possivel | Como tratar no frontend |
| ----- | ----------------- | ----------------------- |
| `token` | `Token não fornecido` ou `Token inválido` | Redirecionar para login. |
| `role` | `Apenas administradores podem criar administrações manualmente` | Ocultar criacao manual para nao admins. |
| `role` | `Apenas administradores podem cancelar administrações` | Ocultar cancelamento para nao admins. |
| `id` | `id deve ser um UUID válido` | Validar rota/acao antes de chamar a API. |
| `residentId` | `residentId deve ser um UUID válido` | Validar selecao do residente. |
| `resident` | `Residente não encontrado` | Recarregar residentes ou voltar para listagem. |
| `prescription` | `Prescrição não encontrada` | Recarregar prescricoes do residente. |
| `prescriptionId` | `Prescrição inativa não pode gerar novas administrações` | Usar apenas prescricoes ativas. |
| `residentId` | `Prescrição informada não pertence ao residente informado` | Recarregar prescricoes do residente selecionado. |
| `scheduledAt` | `scheduledAt deve estar em formato ISO` | Converter data/hora para ISO. |
| `administeredAt` | `administeredAt deve estar em formato ISO` | Converter data/hora para ISO. |
| `reason` | `Justificativa é obrigatória para medicamento recusado` | Exigir justificativa no modal de recusa. |
| `reason` | `Justificativa é obrigatória para medicamento perdido` | Exigir justificativa no modal de perdido. |
| `reason` | `Justificativa é obrigatória para cancelar administração` | Exigir justificativa no modal de cancelamento. |
| `status` | `Apenas administrações pendentes podem ser alteradas` | Desabilitar acoes para status finais. |

## Sugestao de service no frontend

```js
import { api } from "./api";

const trimOrUndefined = (value) => {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
};

export async function listTodayMedicationAdministrations(filters = {}) {
  const { data } = await api.get("/medication-administrations/today", {
    params: filters,
  });

  return data.data;
}

export async function listResidentMedicationAdministrations(
  residentId,
  filters = {},
) {
  const { data } = await api.get(
    `/residents/${residentId}/medication-administrations`,
    { params: filters },
  );

  return data.data;
}

export async function getMedicationAdministrationById(id) {
  const { data } = await api.get(`/medication-administrations/${id}`);

  return data.data;
}

export async function administerMedicationAdministration(id, form = {}) {
  const { data } = await api.patch(
    `/medication-administrations/${id}/administer`,
    {
      administeredAt: form.administeredAt?.toISOString(),
      notes: trimOrUndefined(form.notes),
    },
  );

  return data.data;
}

export async function refuseMedicationAdministration(id, form) {
  const { data } = await api.patch(
    `/medication-administrations/${id}/refuse`,
    {
      reason: form.reason.trim(),
      notes: trimOrUndefined(form.notes),
    },
  );

  return data.data;
}

export async function missMedicationAdministration(id, form) {
  const { data } = await api.patch(
    `/medication-administrations/${id}/miss`,
    {
      reason: form.reason.trim(),
      notes: trimOrUndefined(form.notes),
    },
  );

  return data.data;
}

export async function cancelMedicationAdministration(id, form) {
  const { data } = await api.patch(
    `/medication-administrations/${id}/cancel`,
    {
      reason: form.reason.trim(),
      notes: trimOrUndefined(form.notes),
    },
  );

  return data.data;
}

export async function createManualMedicationAdministration(form) {
  const { data } = await api.post("/medication-administrations/manual", {
    prescriptionId: form.prescriptionId,
    residentId: form.residentId,
    scheduledAt: form.scheduledAt.toISOString(),
    notes: trimOrUndefined(form.notes),
  });

  return data.data;
}
```

## Estados recomendados de UI

Para telas de administracao de medicamentos, trate pelo menos estes estados:

- carregando agenda do dia;
- carregando historico do residente;
- carregando detalhes da administracao;
- listagem vazia;
- filtro por status;
- confirmacao antes de marcar como administrado;
- modal com justificativa obrigatoria para recusar;
- modal com justificativa obrigatoria para marcar como perdido;
- modal com justificativa obrigatoria para cancelar;
- botoes de acao desabilitados quando `status !== "PENDING"`;
- botao de cancelamento visivel apenas para `admin`;
- formulario manual visivel apenas para `admin`;
- erro de validacao exibindo mensagens de `errors`;
- erro `NOT_FOUND` quando administracao, residente ou prescricao nao existir;
- erro de autenticacao direcionando o usuario para login quando fizer sentido.

## Checklist de implementacao

- Configurar o header `Authorization` com o JWT.
- Usar `POST /prescriptions` como fluxo principal para gerar administracoes automaticamente.
- Usar `GET /medication-administrations/today` para a agenda diaria.
- Usar `GET /residents/:residentId/medication-administrations` para agenda/historico do residente.
- Usar `GET /medication-administrations/:id` para detalhe.
- Permitir acoes de status somente quando `status` for `PENDING`.
- Exigir `reason` para `REFUSED`, `MISSED` e `CANCELED`.
- Converter datas para ISO antes de enviar.
- Usar `data.data` como retorno das rotas deste modulo.
- Tratar `errors` por campo em formularios e modais.

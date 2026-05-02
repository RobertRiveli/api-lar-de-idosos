# Prescriptions - Guia para o frontend

Este documento descreve como implementar as telas e servicos de frontend relacionados a prescricoes medicas e como consumir a API de `prescriptions`.

## Visao geral

As rotas de prescricoes sao protegidas por token JWT. O backend identifica a empresa pelo token do usuario autenticado, entao o frontend nao deve enviar `companyId` no payload nem na URL.

Funcionalidades disponiveis:

- cadastrar prescricao para um residente da empresa do usuario autenticado;
- gerar automaticamente as administracoes futuras de medicamento apos o cadastro da prescricao;
- listar prescricoes ativas da empresa;
- listar prescricoes ativas de um residente especifico;
- buscar os detalhes de uma prescricao ativa;
- editar uma prescricao ativa;
- desativar uma prescricao, usando exclusao logica (`isActive: false`).

## Base da API

Exemplo em ambiente local:

```txt
http://localhost:<PORT>
```

O valor de `PORT` vem da variavel de ambiente `PORT` usada pelo backend.

## Autenticacao

Todas as rotas de prescricoes exigem token JWT.

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

## Modelo de prescricao

Campos retornados pela API:

| Campo               | Tipo             | Descricao                                                       |
| ------------------- | ---------------- | --------------------------------------------------------------- |
| `id`                | string           | ID da prescricao.                                               |
| `companyId`         | string           | ID da empresa vinculada a prescricao.                           |
| `residentId`        | string           | ID do residente vinculado a prescricao.                         |
| `medicationId`      | string           | ID do medicamento vinculado a prescricao.                       |
| `measurementUnitId` | string           | ID da unidade de medida vinculada a prescricao.                 |
| `resident`          | object           | Dados basicos do residente: `id` e `fullName`.                  |
| `medication`        | object           | Dados basicos do medicamento: `id`, `genericName`, `brandName`. |
| `measurementUnit`   | object           | Dados basicos da unidade: `id`, `name`, `abbreviation`.         |
| `dosage`            | string           | Quantidade prescrita, por exemplo `500`.                        |
| `route`             | string           | Via de administracao, por exemplo `oral`.                       |
| `frequency`         | string           | Texto exibivel da frequencia, por exemplo `a cada 8 horas`.     |
| `intervalHours`     | number           | Intervalo usado pelo backend para calcular administracoes.       |
| `firstScheduledAt`  | string           | Primeiro horario previsto para administracao em formato ISO.     |
| `prescribedBy`      | string           | Nome do profissional que prescreveu.                            |
| `startDate`         | string           | Data inicial em formato ISO na resposta.                        |
| `endDate`           | string ou `null` | Data final em formato ISO ou `null`.                            |
| `isActive`          | boolean          | Indica se a prescricao esta ativa.                              |
| `createdAt`         | string           | Data de criacao do registro.                                    |
| `updatedAt`         | string           | Data da ultima atualizacao do registro.                         |

## Dados auxiliares para montar formulario

Para cadastrar ou editar uma prescricao, a tela geralmente precisa carregar tres listas:

| Campo do formulario | Endpoint recomendado     | Valor salvo no payload |
| ------------------- | ------------------------ | ---------------------- |
| Residente           | `GET /residents`         | `resident.id`          |
| Medicamento         | `GET /medications`       | `medication.id`        |
| Unidade de medida   | `GET /measurement-units` | `measurementUnit.id`   |

O backend valida essas relacoes:

- `residentId` deve existir, estar ativo e pertencer a empresa do usuario autenticado;
- `medicationId` deve existir, estar ativo e pertencer a empresa do usuario autenticado;
- `measurementUnitId` deve existir e estar ativo;
- o usuario so acessa prescricoes relacionadas a residentes da propria empresa.

## Normalizacao recomendada

O frontend deve enviar somente os campos aceitos pela API. Evite incluir `companyId`, `isActive`, `createdAt`, `updatedAt`, `caregiverId`, `status` ou objetos aninhados no payload.

Envie `startDate`, `endDate` e `firstScheduledAt` em formato ISO com timezone. O formato mais simples e seguro e UTC:

```txt
2026-05-02T08:00:00.000Z
```

Se a tela usar `input type="date"` e `input type="time"`, junte os valores e converta para ISO antes de montar o payload.

```js
const emptyToUndefined = (value) => {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
};

const emptyToNull = (value) => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

const toIsoDateTime = ({ date, time = "00:00" }) => {
  if (!date) return "";

  return new Date(`${date}T${time}:00`).toISOString();
};

const normalizePrescriptionPayload = (form) => ({
  residentId: form.residentId,
  medicationId: form.medicationId,
  measurementUnitId: form.measurementUnitId,
  dosage: form.dosage.trim(),
  route: form.route.trim(),
  frequency: form.frequency.trim(),
  intervalHours: Number(form.intervalHours),
  firstScheduledAt: toIsoDateTime({
    date: form.firstScheduledDate,
    time: form.firstScheduledTime,
  }),
  prescribedBy: form.prescribedBy.trim(),
  startDate: toIsoDateTime({ date: form.startDate }),
  endDate: form.endDate
    ? toIsoDateTime({ date: form.endDate, time: "23:59" })
    : undefined,
});

const normalizePrescriptionUpdatePayload = (form) => ({
  residentId: form.residentId,
  medicationId: form.medicationId,
  measurementUnitId: form.measurementUnitId,
  dosage: form.dosage.trim(),
  route: form.route.trim(),
  frequency: form.frequency.trim(),
  intervalHours: Number(form.intervalHours),
  firstScheduledAt: form.firstScheduledAt?.toISOString(),
  prescribedBy: form.prescribedBy.trim(),
  startDate: form.startDate?.toISOString(),
  endDate: emptyToNull(form.endDate),
});
```

Para edicao parcial, envie apenas os campos alterados. Para limpar `endDate`, envie `null`.

Importante: a criacao de uma prescricao tambem cria automaticamente registros em `MedicationAdministration`. Por isso `intervalHours` e `firstScheduledAt` sao obrigatorios no cadastro.

## Cadastrar prescricao

Use esta funcao para criar uma nova prescricao associada a um residente da empresa do usuario autenticado.

### Endpoint

```http
POST /prescriptions
Content-Type: application/json
Authorization: Bearer <token>
```

### Permissao

Somente usuarios com `role` igual a `admin` podem cadastrar prescricoes.

Ao cadastrar uma prescricao, o backend cria a `Prescription` e gera automaticamente as administracoes futuras em `MedicationAdministration`, dentro da mesma transaction. Se a geracao das administracoes falhar, a prescricao tambem nao sera salva.

### Payload

Contrato atual da API:

```json
{
  "residentId": "uuid-do-residente",
  "medicationId": "uuid-do-medicamento",
  "measurementUnitId": "uuid-da-unidade",
  "dosage": "500",
  "route": "oral",
  "frequency": "a cada 8 horas",
  "intervalHours": 8,
  "firstScheduledAt": "2026-05-02T08:00:00.000Z",
  "prescribedBy": "Dr. Carlos Mendes",
  "startDate": "2026-05-02T00:00:00.000Z",
  "endDate": null
}
```

### Campos do cadastro

| Campo               | Tipo             | Obrigatorio | Regra                                                                    |
| ------------------- | ---------------- | ----------- | ------------------------------------------------------------------------ |
| `residentId`        | string           | Sim         | Residente ativo da empresa do usuario.                                   |
| `medicationId`      | string           | Sim         | Medicamento ativo da empresa do usuario.                                 |
| `measurementUnitId` | string           | Sim         | Unidade de medida ativa.                                                 |
| `dosage`            | string           | Sim         | Nao pode ser vazio.                                                      |
| `route`             | string           | Sim         | Nao pode ser vazio.                                                      |
| `frequency`         | string           | Sim         | Nao pode ser vazio.                                                      |
| `intervalHours`     | number           | Sim         | Inteiro maior que zero. Usado para calcular proximas administracoes.     |
| `firstScheduledAt`  | string           | Sim         | Primeiro horario previsto em formato ISO com timezone.                   |
| `prescribedBy`      | string           | Sim         | Nao pode ser vazio.                                                      |
| `startDate`         | string           | Sim         | Data inicial em formato ISO com timezone.                                |
| `endDate`           | string ou `null` | Nao         | Data final em formato ISO; nao pode ser menor que `startDate`.           |

Regras da geracao automatica:

- se `endDate` existir, o backend gera administracoes de `firstScheduledAt` ate `endDate`;
- se `endDate` for `null`, o backend gera apenas os proximos 7 dias a partir de `firstScheduledAt`;
- nenhuma administracao e gerada antes de `startDate`;
- cada administracao criada inicia com `status: PENDING`, `caregiverId: null`, `administeredAt: null`, `reason: null` e `notes: null`;
- o backend nao cria horarios duplicados para a mesma combinacao de `prescriptionId` e `scheduledAt`.

### Cuidados com timezone e datas

Use sempre ISO com timezone no payload. Se o usuario escolher `08:00` no horario local da interface, converta esse horario para ISO antes de enviar. O backend salva e calcula os proximos horarios usando instantes UTC, somando `intervalHours` em horas reais.

Evite enviar datas sem timezone, como `2026-05-02 08:00` ou `2026-05-02T08:00:00`, porque diferentes navegadores e ambientes podem interpretar esses valores de forma diferente.

Quando `endDate` for `null`, o backend usa uma janela de 7 dias. Nesse caso, `periodEnd` representa o limite final da janela, e nao necessariamente o ultimo horario gerado.

### Exemplo com fetch

```js
async function createPrescription(form) {
  const token = localStorage.getItem("accessToken");

  const payload = normalizePrescriptionPayload(form);

  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/prescriptions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return data.data;
}
```

### Exemplo com Axios

```js
export async function createPrescription(form) {
  const { data } = await api.post(
    "/prescriptions",
    normalizePrescriptionPayload(form),
  );

  return data.data;
}
```

### Resposta de sucesso

Status HTTP:

```http
201 Created
```

Body:

```json
{
  "success": true,
  "message": "Prescrição criada com sucesso.",
  "data": {
    "prescription": {
      "id": "uuid-da-prescricao",
      "companyId": "uuid-da-empresa",
      "residentId": "uuid-do-residente",
      "medicationId": "uuid-do-medicamento",
      "measurementUnitId": "uuid-da-unidade",
      "dosage": "500",
      "route": "oral",
      "frequency": "a cada 8 horas",
      "intervalHours": 8,
      "firstScheduledAt": "2026-05-02T08:00:00.000Z",
      "prescribedBy": "Dr. Carlos Mendes",
      "startDate": "2026-05-02T00:00:00.000Z",
      "endDate": null,
      "isActive": true,
      "createdAt": "2026-05-02T10:30:00.000Z",
      "updatedAt": "2026-05-02T10:30:00.000Z",
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
      }
    },
    "generatedAdministrations": {
      "count": 21,
      "periodStart": "2026-05-02T08:00:00.000Z",
      "periodEnd": "2026-05-09T08:00:00.000Z"
    }
  }
}
```

## Listar prescricoes

Use esta funcao para montar uma listagem geral de prescricoes ativas da empresa do usuario autenticado.

### Endpoint

```http
GET /prescriptions
Authorization: Bearer <token>
```

### Comportamento da API

A API retorna apenas prescricoes com:

- `companyId` igual ao da empresa do token;
- `isActive` igual a `true`;
- residente ativo e pertencente a empresa do usuario autenticado.

A ordenacao atual e por `startDate` em ordem decrescente.

### Exemplo com Axios

```js
export async function listPrescriptions() {
  const { data } = await api.get("/prescriptions");

  return data.prescriptions;
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
  "prescriptions": [
    {
      "id": "uuid-da-prescricao",
      "companyId": "uuid-da-empresa",
      "residentId": "uuid-do-residente",
      "medicationId": "uuid-do-medicamento",
      "measurementUnitId": "uuid-da-unidade",
      "dosage": "500",
      "route": "oral",
      "frequency": "a cada 8 horas",
      "intervalHours": 8,
      "firstScheduledAt": "2026-05-02T08:00:00.000Z",
      "prescribedBy": "Dr. Carlos Mendes",
      "startDate": "2026-05-01T00:00:00.000Z",
      "endDate": null,
      "isActive": true,
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
      }
    }
  ]
}
```

Quando nao houver prescricoes ativas, a API retorna:

```json
{
  "success": true,
  "prescriptions": []
}
```

## Listar prescricoes por residente

Use esta funcao na tela de detalhes do residente ou em uma aba de prescricoes do prontuario.

### Endpoint

```http
GET /residents/:residentId/prescriptions
Authorization: Bearer <token>
```

### Parametros de rota

| Parametro    | Tipo   | Obrigatorio | Descricao        |
| ------------ | ------ | ----------- | ---------------- |
| `residentId` | string | Sim         | ID do residente. |

### Comportamento da API

Antes de listar, a API confirma se o residente existe, esta ativo e pertence a empresa do usuario autenticado. Se o residente for de outra empresa, estiver inativo ou nao existir, a resposta sera `Residente não encontrado`.

### Exemplo com Axios

```js
export async function listPrescriptionsByResident(residentId) {
  const { data } = await api.get(`/residents/${residentId}/prescriptions`);

  return data.prescriptions;
}
```

## Buscar prescricao por ID

Use esta funcao quando o usuario selecionar uma prescricao especifica na listagem ou quando uma tela de detalhes receber o `id` pela rota do frontend.

### Endpoint

```http
GET /prescriptions/:id
Authorization: Bearer <token>
```

### Parametros de rota

| Parametro | Tipo   | Obrigatorio | Descricao         |
| --------- | ------ | ----------- | ----------------- |
| `id`      | string | Sim         | ID da prescricao. |

### Comportamento da API

A API retorna a prescricao somente quando ela esta ativa e pertence a empresa do usuario autenticado. O vinculo de empresa e validado pela propria prescricao e pelo residente associado.

Se a prescricao nao existir, pertencer a outra empresa ou estiver inativa, a API retorna `Prescrição não encontrada`.

### Exemplo com Axios

```js
export async function getPrescriptionById(id) {
  const { data } = await api.get(`/prescriptions/${id}`);

  return data.prescription;
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
  "prescription": {
    "id": "uuid-da-prescricao",
    "companyId": "uuid-da-empresa",
    "residentId": "uuid-do-residente",
    "medicationId": "uuid-do-medicamento",
    "measurementUnitId": "uuid-da-unidade",
    "dosage": "500",
    "route": "oral",
    "frequency": "a cada 8 horas",
    "intervalHours": 8,
    "firstScheduledAt": "2026-05-02T08:00:00.000Z",
    "prescribedBy": "Dr. Carlos Mendes",
    "startDate": "2026-05-01T00:00:00.000Z",
    "endDate": null,
    "isActive": true,
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
    }
  }
}
```

## Editar prescricao

Use esta funcao para salvar alteracoes em uma prescricao ativa.

A edicao usa `PATCH`, entao o payload pode ser parcial. Envie apenas os campos alterados. O frontend nao deve enviar `companyId`, `isActive`, `createdAt`, `updatedAt` ou objetos aninhados.

### Endpoint

```http
PATCH /prescriptions/:id
Content-Type: application/json
Authorization: Bearer <token>
```

### Parametros de rota

| Parametro | Tipo   | Obrigatorio | Descricao         |
| --------- | ------ | ----------- | ----------------- |
| `id`      | string | Sim         | ID da prescricao. |

### Payload

Exemplo de edicao parcial:

```json
{
  "dosage": "750",
  "frequency": "a cada 12 horas"
}
```

Exemplo para encerrar uma prescricao:

```json
{
  "endDate": "2026-05-15T23:59:59.000Z"
}
```

Exemplo para limpar a data final:

```json
{
  "endDate": null
}
```

### Comportamento da API

A API edita a prescricao somente quando ela esta ativa e pertence a empresa do usuario autenticado.

Quando o payload alterar `residentId`, `medicationId` ou `measurementUnitId`, o backend valida novamente as relacoes. Se `endDate` for enviado, ele nao pode ser menor que `startDate`. `firstScheduledAt` tambem nao pode ser menor que `startDate` nem maior que `endDate`, quando `endDate` existir. Em edicao parcial, essas comparacoes consideram os valores ja cadastrados quando eles nao vierem no payload.

Atencao: a geracao automatica de `MedicationAdministration` acontece na criacao da prescricao. Alteracoes posteriores na prescricao nao recalculam administracoes ja criadas.

### Exemplo com Axios

```js
export async function updatePrescription(id, partialForm) {
  const { data } = await api.patch(`/prescriptions/${id}`, partialForm);

  return data.prescription;
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
  "message": "Prescrição atualizada com sucesso",
  "prescription": {
    "id": "uuid-da-prescricao",
    "dosage": "750",
    "route": "oral",
    "frequency": "a cada 12 horas",
    "prescribedBy": "Dr. Carlos Mendes",
    "startDate": "2026-05-01T00:00:00.000Z",
    "endDate": null,
    "isActive": true,
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
    }
  }
}
```

## Desativar prescricao

Use esta funcao quando o usuario confirmar a remocao/desativacao de uma prescricao.

A delecao e logica: o backend nao remove o registro do banco. Ele apenas atualiza `isActive` para `false`. Depois disso, a prescricao deixa de aparecer nas listagens e tambem nao e retornada pela busca por ID.

### Endpoint

```http
DELETE /prescriptions/:id
Authorization: Bearer <token>
```

### Parametros de rota

| Parametro | Tipo   | Obrigatorio | Descricao         |
| --------- | ------ | ----------- | ----------------- |
| `id`      | string | Sim         | ID da prescricao. |

### Exemplo com Axios

```js
export async function deactivatePrescription(id) {
  const { data } = await api.delete(`/prescriptions/${id}`);

  return data.prescription;
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
  "message": "Prescrição desativada com sucesso",
  "prescription": {
    "id": "uuid-da-prescricao",
    "isActive": false,
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
    }
  }
}
```

## Respostas de erro

### Token ausente, invalido ou expirado

Status HTTP:

```http
400 Bad Request
```

Body para token ausente:

```json
{
  "success": false,
  "message": "Dados de entrada inválidos",
  "errors": {
    "token": "Token não fornecido"
  },
  "errorType": "VALIDATION_ERROR"
}
```

Body para token invalido:

```json
{
  "success": false,
  "message": "Dados de entrada inválidos",
  "errors": {
    "token": "Token inválido"
  },
  "errorType": "VALIDATION_ERROR"
}
```

### Erro de validacao

Status HTTP:

```http
400 Bad Request
```

Body:

```json
{
  "success": false,
  "message": "Dados de entrada inválidos",
  "errors": {
    "dosage": "Dosagem é obrigatória"
  },
  "errorType": "VALIDATION_ERROR"
}
```

Mensagens possiveis:

| Campo               | Mensagem possivel                                  |
| ------------------- | -------------------------------------------------- |
| `role`              | `Apenas administradores podem cadastrar prescrições` |
| `residentId`        | `residentId deve ser um UUID válido`               |
| `medicationId`      | `medicationId deve ser um UUID válido`             |
| `measurementUnitId` | `measurementUnitId deve ser um UUID válido`        |
| `dosage`            | `Dosagem é obrigatória`                            |
| `route`             | `Forma de consumo é obrigatória`                   |
| `frequency`         | `Frequência é obrigatória`                         |
| `intervalHours`     | `intervalHours é obrigatório`                      |
| `intervalHours`     | `intervalHours deve ser um número inteiro`         |
| `intervalHours`     | `intervalHours deve ser maior que zero`            |
| `firstScheduledAt`  | `firstScheduledAt é obrigatório`                   |
| `firstScheduledAt`  | `firstScheduledAt deve estar em formato ISO`       |
| `firstScheduledAt`  | `firstScheduledAt não pode ser menor que startDate` |
| `firstScheduledAt`  | `firstScheduledAt não pode ser maior que endDate`  |
| `prescribedBy`      | `Prescritor é obrigatório`                         |
| `startDate`         | `startDate é obrigatório`                          |
| `startDate`         | `startDate deve estar em formato ISO`              |
| `endDate`           | `endDate deve estar em formato ISO`                |
| `endDate`           | `endDate não pode ser menor que startDate`         |
| `prescription`      | `Informe ao menos um campo para atualizar`         |

### Registro relacionado nao encontrado

Status HTTP:

```http
404 Not Found
```

Body para residente nao encontrado:

```json
{
  "success": false,
  "message": "Residente não encontrado",
  "errors": {
    "resident": "Residente não encontrado"
  },
  "errorType": "NOT_FOUND"
}
```

Outras mensagens possiveis:

| Campo             | Mensagem possivel                  |
| ----------------- | ---------------------------------- |
| `prescription`    | `Prescrição não encontrada`        |
| `medication`      | `Medicamento não encontrado`       |
| `measurementUnit` | `Unidade de medida não encontrada` |

## Sugestao de service no frontend

```js
import { api } from "./api";

const emptyToUndefined = (value) => {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
};

const emptyToNull = (value) => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

const toIsoDateTime = ({ date, time = "00:00" }) => {
  if (!date) return "";

  return new Date(`${date}T${time}:00`).toISOString();
};

export function normalizePrescriptionPayload(form) {
  return {
    residentId: form.residentId,
    medicationId: form.medicationId,
    measurementUnitId: form.measurementUnitId,
    dosage: form.dosage.trim(),
    route: form.route.trim(),
    frequency: form.frequency.trim(),
    intervalHours: Number(form.intervalHours),
    firstScheduledAt: toIsoDateTime({
      date: form.firstScheduledDate,
      time: form.firstScheduledTime,
    }),
    prescribedBy: form.prescribedBy.trim(),
    startDate: toIsoDateTime({ date: form.startDate }),
    endDate: form.endDate
      ? toIsoDateTime({ date: form.endDate, time: "23:59" })
      : undefined,
  };
}

export function normalizePrescriptionUpdatePayload(form) {
  return {
    residentId: form.residentId,
    medicationId: form.medicationId,
    measurementUnitId: form.measurementUnitId,
    dosage: form.dosage.trim(),
    route: form.route.trim(),
    frequency: form.frequency.trim(),
    intervalHours: form.intervalHours ? Number(form.intervalHours) : undefined,
    firstScheduledAt: form.firstScheduledAt?.toISOString(),
    prescribedBy: form.prescribedBy.trim(),
    startDate: form.startDate?.toISOString(),
    endDate: emptyToNull(form.endDate),
  };
}

export async function createPrescription(form) {
  const { data } = await api.post(
    "/prescriptions",
    normalizePrescriptionPayload(form),
  );

  return data.data;
}

export async function listPrescriptions() {
  const { data } = await api.get("/prescriptions");

  return data.prescriptions;
}

export async function listPrescriptionsByResident(residentId) {
  const { data } = await api.get(`/residents/${residentId}/prescriptions`);

  return data.prescriptions;
}

export async function getPrescriptionById(id) {
  const { data } = await api.get(`/prescriptions/${id}`);

  return data.prescription;
}

export async function updatePrescription(id, partialPayload) {
  const { data } = await api.patch(`/prescriptions/${id}`, partialPayload);

  return data.prescription;
}

export async function deactivatePrescription(id) {
  const { data } = await api.delete(`/prescriptions/${id}`);

  return data.prescription;
}
```

## Estados recomendados de UI

Para as telas de prescricoes, trate pelo menos estes estados:

- carregando durante o envio do formulario;
- carregando durante a busca da listagem geral;
- carregando durante a busca das prescricoes de um residente;
- carregando durante a busca dos detalhes de uma prescricao selecionada;
- carregando os dados auxiliares de residentes, medicamentos e unidades de medida;
- confirmacao antes de desativar uma prescricao;
- sucesso com a mensagem `Prescrição criada com sucesso.`;
- exibicao opcional da quantidade de administracoes geradas em `data.generatedAdministrations.count`;
- sucesso com a mensagem `Prescrição atualizada com sucesso`;
- sucesso com a mensagem `Prescrição desativada com sucesso`;
- listagem vazia quando `prescriptions` vier como array vazio;
- erro de validacao exibindo a mensagem do campo retornado em `errors`;
- erro `NOT_FOUND` quando residente, medicamento, unidade de medida ou prescricao nao estiver disponivel para a empresa do usuario;
- erro de autenticacao/token direcionando o usuario para login quando fizer sentido.

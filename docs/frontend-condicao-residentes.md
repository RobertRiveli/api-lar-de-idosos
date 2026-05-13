# Condicoes de Residentes - Guia para o frontend

Este documento descreve como implementar telas e servicos de frontend relacionados ao vinculo entre residentes e condicoes de saude, consumindo a API de `resident-conditions`.

## Visao geral

As rotas de condicoes de residentes sao protegidas por token JWT. O backend identifica a empresa pelo token do usuario autenticado, entao o frontend nao deve enviar `companyId` no payload nem na URL.

Funcionalidades disponiveis:

- vincular uma condicao de saude a um residente;
- listar as condicoes de saude vinculadas a um residente;
- remover uma condicao de saude vinculada a um residente.

## Base da API

Exemplo em ambiente local:

```txt
http://localhost:<PORT>
```

O valor de `PORT` vem da variavel de ambiente `PORT` usada pelo backend.

## Autenticacao

Todas as rotas exigem token JWT.

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

## Modelo de condicao do residente

Campos retornados pela API:

| Campo               | Tipo             | Descricao                                                |
| ------------------- | ---------------- | -------------------------------------------------------- |
| `id`                | string           | ID do vinculo entre residente e condicao de saude.       |
| `residentId`        | string           | ID do residente vinculado.                               |
| `healthConditionId` | string           | ID da condicao de saude vinculada.                       |
| `observations`      | string ou `null` | Observacoes livres sobre a condicao naquele residente.   |
| `healthCondition`   | object           | Dados da condicao: `id`, `name` e `category`.            |
| `resident`          | object           | Em algumas respostas, dados basicos: `id` e `fullName`.  |

Exemplo de objeto:

```json
{
  "id": "uuid-do-vinculo",
  "residentId": "uuid-do-residente",
  "healthConditionId": "uuid-da-condicao",
  "observations": "Evitar alimentos com amendoim.",
  "healthCondition": {
    "id": "uuid-da-condicao",
    "name": "Alergia alimentar",
    "category": "Alergia"
  },
  "resident": {
    "id": "uuid-do-residente",
    "fullName": "Ana Maria"
  }
}
```

## Dados auxiliares para montar formulario

Para vincular uma condicao a um residente, a tela geralmente precisa carregar:

| Campo do formulario | Endpoint recomendado             | Valor salvo no payload |
| ------------------- | -------------------------------- | ---------------------- |
| Residente           | `GET /residents`                 | `resident.id`          |
| Condicao de saude   | `GET /health-conditions`         | `condition.id`         |
| Condicoes atuais    | `GET /residents/:id/conditions`  | usado para listagem    |

Observacoes importantes:

- `GET /health-conditions` atualmente exige usuario `admin`;
- `POST /resident-conditions` exige usuario `admin`;
- `DELETE /resident-conditions/:id` exige usuario `admin`;
- `GET /residents/:residentId/conditions` exige apenas usuario autenticado;
- o backend valida se o residente existe, esta ativo e pertence a empresa do token.

## Normalizacao recomendada

O frontend deve enviar apenas os campos aceitos pela API.

Nao envie `companyId`, `resident`, `healthCondition`, `createdAt`, `updatedAt` ou objetos aninhados no payload.

```js
const emptyToUndefined = (value) => {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
};

export function normalizeResidentConditionPayload(form) {
  return {
    residentId: form.residentId,
    healthConditionId: form.healthConditionId,
    observations: emptyToUndefined(form.observations),
  };
}
```

## Vincular condicao ao residente

Use esta funcao quando o usuario selecionar uma condicao de saude e confirmar que ela deve ser associada ao residente.

### Endpoint

```http
POST /resident-conditions
Content-Type: application/json
Authorization: Bearer <token>
```

### Permissao

Somente usuarios com `role` igual a `admin` podem criar vinculos entre residentes e condicoes de saude.

### Payload

Contrato atual da API:

```json
{
  "residentId": "uuid-do-residente",
  "healthConditionId": "uuid-da-condicao",
  "observations": "Controlar dieta e observar reacoes."
}
```

### Campos do cadastro

| Campo               | Tipo             | Obrigatorio | Regra                                           |
| ------------------- | ---------------- | ----------- | ----------------------------------------------- |
| `residentId`        | string           | Sim         | UUID de residente ativo da empresa do usuario.  |
| `healthConditionId` | string           | Sim         | UUID de uma condicao de saude existente.        |
| `observations`      | string ou `null` | Nao         | Texto livre com no maximo 1000 caracteres.      |

Se `observations` for string vazia, envie `undefined` ou omita o campo. O backend salva como `null`.

### Exemplo com fetch

```js
async function createResidentCondition(form) {
  const token = localStorage.getItem("accessToken");
  const payload = normalizeResidentConditionPayload(form);

  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/resident-conditions`,
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

  return data.residentCondition;
}
```

### Exemplo com Axios

```js
export async function createResidentCondition(form) {
  const { data } = await api.post(
    "/resident-conditions",
    normalizeResidentConditionPayload(form),
  );

  return data.residentCondition;
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
  "residentCondition": {
    "id": "uuid-do-vinculo",
    "residentId": "uuid-do-residente",
    "healthConditionId": "uuid-da-condicao",
    "observations": "Controlar dieta e observar reacoes.",
    "healthCondition": {
      "id": "uuid-da-condicao",
      "name": "Alergia alimentar",
      "category": "Alergia"
    },
    "resident": {
      "id": "uuid-do-residente",
      "fullName": "Ana Maria"
    }
  }
}
```

## Listar condicoes de um residente

Use esta funcao na tela de detalhes do residente, prontuario ou aba de condicoes de saude.

### Endpoint

```http
GET /residents/:residentId/conditions
Authorization: Bearer <token>
```

### Parametros de rota

| Parametro    | Tipo   | Obrigatorio | Descricao        |
| ------------ | ------ | ----------- | ---------------- |
| `residentId` | string | Sim         | ID do residente. |

### Comportamento da API

Antes de listar, a API confirma se o residente existe, esta ativo e pertence a empresa do usuario autenticado.

Se o residente for de outra empresa, estiver inativo ou nao existir, a resposta sera `Residente não encontrado`.

A ordenacao atual e pelo nome da condicao de saude em ordem crescente.

### Exemplo com fetch

```js
async function listResidentConditions(residentId) {
  const token = localStorage.getItem("accessToken");

  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/residents/${residentId}/conditions`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return data.healthConditions;
}
```

### Exemplo com Axios

```js
export async function listResidentConditions(residentId) {
  const { data } = await api.get(`/residents/${residentId}/conditions`);

  return data.healthConditions;
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
  "healthConditions": [
    {
      "id": "uuid-do-vinculo",
      "residentId": "uuid-do-residente",
      "healthConditionId": "uuid-da-condicao",
      "observations": "Controlar dieta e observar reacoes.",
      "healthCondition": {
        "id": "uuid-da-condicao",
        "name": "Alergia alimentar",
        "category": "Alergia"
      }
    }
  ]
}
```

Quando o residente nao tiver condicoes vinculadas, a API retorna:

```json
{
  "success": true,
  "healthConditions": []
}
```

## Remover condicao do residente

Use esta funcao quando o usuario confirmar a remocao de uma condicao do prontuario do residente.

A remocao e fisica: o registro de `ResidentCondition` e deletado do banco.

### Endpoint

```http
DELETE /resident-conditions/:id
Authorization: Bearer <token>
```

### Permissao

Somente usuarios com `role` igual a `admin` podem remover vinculos entre residentes e condicoes de saude.

### Parametros de rota

| Parametro | Tipo   | Obrigatorio | Descricao                                       |
| --------- | ------ | ----------- | ----------------------------------------------- |
| `id`      | string | Sim         | ID do vinculo retornado em `residentCondition`. |

Importante: o `id` desta rota e o ID do vinculo, nao o `healthConditionId`.

### Exemplo com Axios

```js
export async function deleteResidentCondition(id) {
  const { data } = await api.delete(`/resident-conditions/${id}`);

  return data.residentCondition;
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
  "message": "Condição do residente removida com sucesso",
  "residentCondition": {
    "id": "uuid-do-vinculo",
    "residentId": "uuid-do-residente",
    "healthConditionId": "uuid-da-condicao",
    "observations": "Controlar dieta e observar reacoes."
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

### Usuario sem permissao

Status HTTP:

```http
403 Forbidden
```

Body:

```json
{
  "message": "Você não tem permissão para acessar este recurso"
}
```

Esse erro pode acontecer em `POST /resident-conditions`, `DELETE /resident-conditions/:id` e `GET /health-conditions` quando o usuario nao tiver `role: "admin"`.

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
    "residentId": "residentId deve ser um UUID válido"
  },
  "errorType": "VALIDATION_ERROR"
}
```

Mensagens possiveis:

| Campo               | Mensagem possivel                                  |
| ------------------- | -------------------------------------------------- |
| `residentId`        | `residentId deve ser um UUID válido`               |
| `healthConditionId` | `healthConditionId deve ser um UUID válido`        |
| `id`                | `id deve ser um UUID válido`                       |
| `observations`      | `observations deve ter no máximo 1000 caracteres`  |

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

| Campo               | Mensagem possivel                         |
| ------------------- | ----------------------------------------- |
| `healthConditionId` | `Condição não encontrada`                 |
| `residentCondition` | `Condição do residente não encontrada`    |

### Condicao ja vinculada

Status HTTP:

```http
409 Conflict
```

Body:

```json
{
  "success": false,
  "message": "Conflito de dados",
  "errors": {
    "healthConditionId": "Esta condição já está vinculada ao residente"
  },
  "errorType": "CONFLICT_ERROR"
}
```

O conflito e verificado pela combinacao `residentId` + `healthConditionId`. Um mesmo residente nao pode receber a mesma condicao duas vezes.

## Sugestao de service no frontend

```js
import { api } from "./api";

const emptyToUndefined = (value) => {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
};

export function normalizeResidentConditionPayload(form) {
  return {
    residentId: form.residentId,
    healthConditionId: form.healthConditionId,
    observations: emptyToUndefined(form.observations),
  };
}

export async function listHealthConditions() {
  const { data } = await api.get("/health-conditions");

  return data.conditions;
}

export async function createResidentCondition(form) {
  const { data } = await api.post(
    "/resident-conditions",
    normalizeResidentConditionPayload(form),
  );

  return data.residentCondition;
}

export async function listResidentConditions(residentId) {
  const { data } = await api.get(`/residents/${residentId}/conditions`);

  return data.healthConditions;
}

export async function deleteResidentCondition(id) {
  const { data } = await api.delete(`/resident-conditions/${id}`);

  return data.residentCondition;
}
```

## Estados recomendados de UI

Para as telas de condicoes de residentes, trate pelo menos estes estados:

- carregando a listagem de condicoes do residente;
- carregando a lista de condicoes de saude para montar o select;
- estado vazio quando `healthConditions` vier como array vazio;
- envio do formulario de vinculo;
- confirmacao antes de remover uma condicao;
- sucesso ao criar o vinculo;
- sucesso ao remover o vinculo;
- erro de validacao exibindo a mensagem do campo retornado em `errors`;
- erro de conflito quando a condicao ja estiver vinculada ao residente;
- erro `NOT_FOUND` quando residente, condicao ou vinculo nao estiver disponivel;
- erro `403` escondendo ou bloqueando acoes administrativas para usuarios sem permissao;
- erro de autenticacao/token redirecionando o usuario para login quando fizer sentido.

## Modelo de estado sugerido

```js
const initialResidentConditionForm = {
  residentId: "",
  healthConditionId: "",
  observations: "",
};
```

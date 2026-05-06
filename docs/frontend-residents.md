# Residents - Guia para o frontend

Este documento descreve como implementar as telas e servicos de frontend relacionados aos residentes e como consumir a API de `residents`.

## Visao geral

As rotas de residentes sao protegidas por token JWT. O backend identifica a empresa pelo token do usuario autenticado, entao o frontend nao deve enviar `companyId` no payload nem na URL.

Funcionalidades disponiveis:

- cadastrar residente;
- listar residentes ativos da empresa;
- buscar os detalhes de um residente ativo;
- obter uma visao geral do residente com dados cadastrais, condicoes, prescricoes e administracoes.

## Base da API

Exemplo em ambiente local:

```txt
http://localhost:<PORT>
```

O valor de `PORT` vem da variavel de ambiente `PORT` usada pelo backend.

## Autenticacao

Todas as rotas de residentes exigem token JWT.

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

## Modelo de residente

Campos retornados pela API:

| Campo           | Tipo             | Descricao                                       |
| --------------- | ---------------- | ----------------------------------------------- |
| `id`            | string           | ID do residente.                                |
| `companyId`     | string           | ID da empresa vinculada ao residente.           |
| `fullName`      | string           | Nome completo do residente.                     |
| `cpf`           | string ou `null` | CPF do residente. Pode ser omitido no cadastro. |
| `birthDate`     | string           | Data de nascimento em formato ISO na resposta.  |
| `gender`        | string ou `null` | Genero informado no cadastro.                   |
| `bloodType`     | string ou `null` | Tipo sanguineo informado no cadastro.           |
| `admissionDate` | string           | Data de admissao em formato ISO na resposta.    |
| `status`        | string ou `null` | Status do residente. Padrao: `active`.          |
| `createdAt`     | string           | Data de criacao do registro.                    |
| `updatedAt`     | string           | Data da ultima atualizacao do registro.         |

## Normalizacao recomendada

O backend remove caracteres nao numericos de `cpf` no cadastro. Mesmo assim, o frontend deve enviar o CPF apenas com numeros.

```js
const onlyNumbers = (value) => value.replace(/\D/g, "");

const normalizeResidentPayload = (form) => ({
  fullName: form.fullName.trim(),
  cpf: form.cpf ? onlyNumbers(form.cpf) : undefined,
  birthDate: form.birthDate,
  gender: form.gender || undefined,
  bloodType: form.bloodType || undefined,
  admissionDate: form.admissionDate,
  status: form.status || undefined,
});
```

## Cadastrar residente

Use esta funcao para criar um novo residente na empresa do usuario autenticado.

### Endpoint

```http
POST /residents
Content-Type: application/json
Authorization: Bearer <token>
```

### Permissao

Somente usuarios com `role` igual a `admin` podem cadastrar residentes.

Se um usuario `caregiver` tentar cadastrar, a API retorna erro de validacao no campo `role`.

### Payload

Contrato atual da API:

```json
{
  "fullName": "Jose da Silva",
  "cpf": "12345678909",
  "birthDate": "10-03-1940",
  "gender": "male",
  "bloodType": "O+",
  "admissionDate": "26-04-2026"
}
```

### Campos do cadastro

| Campo           | Tipo   | Obrigatorio | Regra                                                |
| --------------- | ------ | ----------- | ---------------------------------------------------- |
| `fullName`      | string | Sim         | Nome com 3 a 160 caracteres.                         |
| `cpf`           | string | Nao         | CPF valido. Enviar apenas numeros quando preenchido. |
| `birthDate`     | string | Sim         | Data no formato `DD-MM-YYYY`.                        |
| `gender`        | string | Nao         | Texto livre. Use valores padronizados no frontend.   |
| `bloodType`     | string | Nao         | Texto livre. Use valores padronizados no frontend.   |
| `admissionDate` | string | Sim         | Data de admissao preenchida.                         |
| `status`        | string | Nao         | Quando omitido, o banco usa `active` como padrao.    |

### Observacao sobre datas

A validacao atual exige `birthDate` no formato `DD-MM-YYYY`. Para manter o frontend alinhado ao contrato da API, envie esse formato.

Na resposta, as datas voltam em formato ISO, por exemplo:

```txt
2026-04-26T00:00:00.000Z
```

Para exibir na tela, formate as datas recebidas no frontend.

### Exemplo com fetch

```js
async function createResident(form) {
  const token = localStorage.getItem("accessToken");
  const onlyNumbers = (value) => value.replace(/\D/g, "");

  const payload = {
    fullName: form.fullName.trim(),
    cpf: form.cpf ? onlyNumbers(form.cpf) : undefined,
    birthDate: form.birthDate,
    gender: form.gender || undefined,
    bloodType: form.bloodType || undefined,
    admissionDate: form.admissionDate,
    status: form.status || undefined,
  };

  const response = await fetch(`${import.meta.env.VITE_API_URL}/residents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return data.resident;
}
```

### Exemplo com Axios

```js
export async function createResident(form) {
  const onlyNumbers = (value) => value.replace(/\D/g, "");

  const { data } = await api.post("/residents", {
    fullName: form.fullName.trim(),
    cpf: form.cpf ? onlyNumbers(form.cpf) : undefined,
    birthDate: form.birthDate,
    gender: form.gender || undefined,
    bloodType: form.bloodType || undefined,
    admissionDate: form.admissionDate,
    status: form.status || undefined,
  });

  return data.resident;
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
  "message": "Residente adicionado com sucesso",
  "resident": {
    "id": "uuid-do-residente",
    "companyId": "uuid-da-empresa",
    "fullName": "Jose da Silva",
    "cpf": "12345678909",
    "birthDate": "1940-03-10T00:00:00.000Z",
    "gender": "male",
    "bloodType": "O+",
    "admissionDate": "2026-04-26T00:00:00.000Z",
    "status": "active",
    "createdAt": "2026-04-26T10:30:00.000Z",
    "updatedAt": "2026-04-26T10:30:00.000Z"
  }
}
```

### Erros do cadastro

#### Usuario sem permissao

Status HTTP:

```http
400 Bad Request
```

Body:

```json
{
  "success": false,
  "message": "Dados de entrada invalidos",
  "errors": {
    "role": "Apenas administradores podem adicionar residentes"
  },
  "errorType": "VALIDATION_ERROR"
}
```

#### Dados invalidos

Status HTTP:

```http
400 Bad Request
```

Body:

```json
{
  "success": false,
  "message": "Dados de entrada invalidos",
  "errors": {
    "birthDate": "A data de nascimento deve estar no formato DD-MM-YYYY"
  },
  "errorType": "VALIDATION_ERROR"
}
```

Mensagens possiveis:

| Campo           | Mensagem possivel                                       |
| --------------- | ------------------------------------------------------- |
| `fullName`      | `O nome deve ter pelo menos 3 caracteres`               |
| `fullName`      | `O nome deve ter no maximo 160 caracteres`              |
| `cpf`           | `CPF invalido`                                          |
| `birthDate`     | `A data de nascimento e obrigatoria`                    |
| `birthDate`     | `A data de nascimento deve estar no formato DD-MM-YYYY` |
| `admissionDate` | `A data de admissao e obrigatoria`                      |

#### CPF ja cadastrado

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
    "cpf": "CPF ja cadastrado"
  },
  "errorType": "CONFLICT_ERROR"
}
```

O conflito e verificado dentro da empresa do usuario autenticado, considerando residentes ativos.

### Tratamento no formulario

```js
try {
  const resident = await createResident(form);
  navigate(`/residents/${resident.id}`);
} catch (error) {
  if (
    error.errorType === "VALIDATION_ERROR" ||
    error.errorType === "CONFLICT_ERROR"
  ) {
    setFieldErrors(error.errors);
    return;
  }

  setGlobalError("Nao foi possivel cadastrar o residente. Tente novamente.");
}
```

Erros de `role` devem ser exibidos como mensagem geral, porque nao pertencem a um campo do formulario.

## Listar residentes

Use esta funcao para montar a listagem de residentes da empresa do usuario autenticado.

### Endpoint

```http
GET /residents
Authorization: Bearer <token>
```

### Comportamento da API

A API retorna apenas residentes com:

- `companyId` igual ao da empresa do token;
- `status` igual a `active`.

A ordenacao atual e por `fullName` em ordem crescente.

### Exemplo com fetch

```js
async function listResidents() {
  const token = localStorage.getItem("accessToken");

  const response = await fetch(`${import.meta.env.VITE_API_URL}/residents`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return data.residents;
}
```

### Exemplo com Axios

```js
export async function listResidents() {
  const { data } = await api.get("/residents");

  return data.residents;
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
  "residents": [
    {
      "id": "uuid-do-residente",
      "companyId": "uuid-da-empresa",
      "fullName": "Ana Maria",
      "cpf": "12345678909",
      "birthDate": "1940-03-10T00:00:00.000Z",
      "gender": "female",
      "bloodType": "A+",
      "admissionDate": "2026-04-26T00:00:00.000Z",
      "status": "active",
      "createdAt": "2026-04-26T10:30:00.000Z",
      "updatedAt": "2026-04-26T10:30:00.000Z"
    }
  ]
}
```

Quando nao houver residentes ativos, a API retorna:

```json
{
  "success": true,
  "residents": []
}
```

### Uso sugerido na tela

```js
import { useEffect, useState } from "react";

export function ResidentsPage() {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadResidents() {
      try {
        const data = await listResidents();
        setResidents(data);
      } catch (error) {
        setError("Nao foi possivel carregar os residentes.");
      } finally {
        setLoading(false);
      }
    }

    loadResidents();
  }, []);

  if (loading) return <p>Carregando...</p>;
  if (error) return <p>{error}</p>;

  return (
    <ul>
      {residents.map((resident) => (
        <li key={resident.id}>{resident.fullName}</li>
      ))}
    </ul>
  );
}
```

## Detalhar residente

Use esta funcao para abrir a tela de detalhes de um residente especifico.

### Endpoint

```http
GET /residents/:id
Authorization: Bearer <token>
```

Exemplo:

```txt
GET /residents/9f2dddc8-51e2-4a6c-9f74-1d4d08f0c5a1
```

### Comportamento da API

A API busca o residente pelo `id`, mas restringe a consulta para:

- residentes da empresa do usuario autenticado;
- residentes com `status` igual a `active`.

Se o residente existir em outra empresa, estiver inativo ou nao existir, a resposta sera `Residente nao encontrado`.

### Exemplo com fetch

```js
async function getResidentById(id) {
  const token = localStorage.getItem("accessToken");

  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/residents/${id}`,
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

  return data.resident;
}
```

### Exemplo com Axios

```js
export async function getResidentById(id) {
  const { data } = await api.get(`/residents/${id}`);

  return data.resident;
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
  "resident": {
    "id": "uuid-do-residente",
    "companyId": "uuid-da-empresa",
    "fullName": "Ana Maria",
    "cpf": "12345678909",
    "birthDate": "1940-03-10T00:00:00.000Z",
    "gender": "female",
    "bloodType": "A+",
    "admissionDate": "2026-04-26T00:00:00.000Z",
    "status": "active",
    "createdAt": "2026-04-26T10:30:00.000Z",
    "updatedAt": "2026-04-26T10:30:00.000Z"
  }
}
```

### Residente nao encontrado

Status HTTP:

```http
400 Bad Request
```

Body:

```json
{
  "success": false,
  "message": "Dados de entrada invalidos",
  "errors": {
    "resident": "Residente nao encontrado"
  },
  "errorType": "VALIDATION_ERROR"
}
```

## Overview do residente

Use esta funcao para montar uma tela de prontuario, painel ou resumo rapido do residente. Ela evita que o frontend precise disparar chamadas separadas para dados cadastrais, condicoes de saude, prescricoes e administracoes.

### Endpoint

```http
GET /residents/:residentId/overview
Authorization: Bearer <token>
```

Exemplo:

```txt
GET /residents/9f2dddc8-51e2-4a6c-9f74-1d4d08f0c5a1/overview
```

### Parametros de rota

| Parametro    | Tipo   | Obrigatorio | Descricao        |
| ------------ | ------ | ----------- | ---------------- |
| `residentId` | string | Sim         | ID do residente. |

### Comportamento da API

A API primeiro valida se o residente existe, esta ativo e pertence a empresa do usuario autenticado. Depois retorna:

- `resident`: dados cadastrais do residente;
- `healthConditions`: condicoes de saude vinculadas ao residente;
- `prescriptions`: prescricoes ativas do residente;
- `administrations`: administracoes de medicamentos do residente.

Se o residente existir em outra empresa, estiver inativo ou nao existir, a resposta sera `Residente nao encontrado`.

### Exemplo com fetch

```js
async function getResidentOverview(residentId) {
  const token = localStorage.getItem("accessToken");

  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/residents/${residentId}/overview`,
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

  return data.residentOverview;
}
```

### Exemplo com Axios

```js
export async function getResidentOverview(residentId) {
  const { data } = await api.get(`/residents/${residentId}/overview`);

  return data.residentOverview;
}
```

### Modelo do overview

| Campo              | Tipo   | Descricao                                                                          |
| ------------------ | ------ | ---------------------------------------------------------------------------------- |
| `resident`         | object | Mesmo modelo retornado em `GET /residents/:id`.                                    |
| `healthConditions` | array  | Mesma lista retornada em `GET /residents/:residentId/conditions`.                  |
| `prescriptions`    | array  | Mesma lista retornada em `GET /residents/:residentId/prescriptions`.               |
| `administrations`  | array  | Mesma lista retornada em `GET /residents/:residentId/medication-administrations`.  |

### Resposta de sucesso

Status HTTP:

```http
200 OK
```

Body:

```json
{
  "success": true,
  "residentOverview": {
    "resident": {
      "id": "uuid-do-residente",
      "companyId": "uuid-da-empresa",
      "fullName": "Ana Maria",
      "cpf": "12345678909",
      "birthDate": "1940-03-10T00:00:00.000Z",
      "gender": "female",
      "bloodType": "A+",
      "admissionDate": "2026-04-26T00:00:00.000Z",
      "status": "active",
      "createdAt": "2026-04-26T10:30:00.000Z",
      "updatedAt": "2026-04-26T10:30:00.000Z"
    },
    "healthConditions": [
      {
        "id": "uuid-do-vinculo",
        "residentId": "uuid-do-residente",
        "healthConditionId": "uuid-da-condicao",
        "observations": "Controlar dieta e observar reacoes.",
        "healthCondition": {
          "id": "uuid-da-condicao",
          "name": "Hipertensao",
          "category": "Cardiovascular"
        }
      }
    ],
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
          "fullName": "Ana Maria"
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
    ],
    "administrations": [
      {
        "id": "uuid-da-administracao",
        "scheduledAt": "2026-05-02T08:00:00.000Z",
        "administeredAt": null,
        "status": "PENDING",
        "resident": {
          "id": "uuid-do-residente",
          "fullName": "Ana Maria"
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
}
```

Quando o residente nao tiver condicoes, prescricoes ou administracoes, os campos correspondentes retornam arrays vazios:

```json
{
  "success": true,
  "residentOverview": {
    "resident": {
      "id": "uuid-do-residente",
      "companyId": "uuid-da-empresa",
      "fullName": "Ana Maria",
      "cpf": null,
      "birthDate": "1940-03-10T00:00:00.000Z",
      "gender": null,
      "bloodType": null,
      "admissionDate": "2026-04-26T00:00:00.000Z",
      "status": "active",
      "createdAt": "2026-04-26T10:30:00.000Z",
      "updatedAt": "2026-04-26T10:30:00.000Z"
    },
    "healthConditions": [],
    "prescriptions": [],
    "administrations": []
  }
}
```

### Uso sugerido na tela

```js
import { useEffect, useState } from "react";

export function ResidentOverviewPage({ residentId }) {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOverview() {
      try {
        const data = await getResidentOverview(residentId);
        setOverview(data);
      } catch (error) {
        setError("Nao foi possivel carregar a visao geral do residente.");
      } finally {
        setLoading(false);
      }
    }

    loadOverview();
  }, [residentId]);

  if (loading) return <p>Carregando...</p>;
  if (error) return <p>{error}</p>;
  if (!overview) return null;

  return (
    <section>
      <h1>{overview.resident.fullName}</h1>
      <p>Condicoes: {overview.healthConditions.length}</p>
      <p>Prescricoes: {overview.prescriptions.length}</p>
      <p>Administracoes: {overview.administrations.length}</p>
    </section>
  );
}
```

## Erros de autenticacao

Todas as rotas de residentes podem retornar erros de token.

### Token nao enviado

Status HTTP:

```http
400 Bad Request
```

Body:

```json
{
  "success": false,
  "message": "Dados de entrada invalidos",
  "errors": {
    "token": "Token nao fornecido"
  },
  "errorType": "VALIDATION_ERROR"
}
```

### Formato de token invalido

Status HTTP:

```http
400 Bad Request
```

Body:

```json
{
  "success": false,
  "message": "Dados de entrada invalidos",
  "errors": {
    "token": "Formato de token invalido"
  },
  "errorType": "VALIDATION_ERROR"
}
```

### Token expirado ou invalido

Status HTTP:

```http
400 Bad Request
```

Body para token expirado:

```json
{
  "success": false,
  "message": "Dados de entrada invalidos",
  "errors": {
    "token": "Token expirado"
  },
  "errorType": "VALIDATION_ERROR"
}
```

Body para token invalido:

```json
{
  "success": false,
  "message": "Dados de entrada invalidos",
  "errors": {
    "token": "Token invalido"
  },
  "errorType": "VALIDATION_ERROR"
}
```

## Tratamento geral de erros

Erros relacionados a `token` devem encerrar a sessao local e redirecionar o usuario para o login.

```js
function handleResidentApiError(error) {
  if (error?.errors?.token) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");

    return {
      redirectToLogin: true,
      fieldErrors: {},
      globalError: "Sessao expirada. Faca login novamente.",
    };
  }

  if (error?.errors?.role) {
    return {
      redirectToLogin: false,
      fieldErrors: {},
      globalError: error.errors.role,
    };
  }

  return {
    redirectToLogin: false,
    fieldErrors: error?.errors ?? {},
    globalError: "",
  };
}
```

## Checklist para as telas

- Fazer login antes de acessar qualquer tela de residentes.
- Enviar `Authorization: Bearer <token>` em todas as chamadas.
- Nao enviar `companyId`; a API usa a empresa do token.
- Exibir botao de cadastro apenas para usuarios `admin`.
- Aplicar mascara visual de CPF, mas enviar apenas numeros.
- Enviar `birthDate` no formato `DD-MM-YYYY`.
- Tratar `role` como erro geral do formulario.
- Tratar erros de `token` removendo a sessao local e redirecionando para login.
- Na listagem, preparar estado vazio quando `residents` vier como array vazio.
- Na tela de detalhes, tratar `resident: "Residente nao encontrado"` como pagina nao encontrada ou aviso de registro indisponivel.
- No overview, preparar estado vazio para `healthConditions`, `prescriptions` e `administrations`.

## Modelo de estado sugerido

```js
const initialResidentForm = {
  fullName: "",
  cpf: "",
  birthDate: "",
  gender: "",
  bloodType: "",
  admissionDate: "",
  status: "active",
};
```

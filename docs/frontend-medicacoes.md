# Medicacoes - Guia para o frontend

Este documento descreve como implementar as telas e servicos de frontend relacionados a medicamentos e como consumir a API de `medications`.

## Visao geral

As rotas de medicamentos sao protegidas por token JWT. O backend identifica a empresa pelo token do usuario autenticado, entao o frontend nao deve enviar `companyId` no payload nem na URL.

Funcionalidades disponiveis atualmente:

- Cadastrar medicamento na empresa do usuario autenticado.
- Listar medicamentos ativos da empresa.

## Base da API

Exemplo em ambiente local:

```txt
http://localhost:<PORT>
```

O valor de `PORT` vem da variavel de ambiente `PORT` usada pelo backend.

## Autenticacao

Todas as rotas de medicamentos exigem token JWT.

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

## Modelo de medicamento

Campos retornados pela API:

| Campo         | Tipo             | Descricao                                               |
| ------------- | ---------------- | ------------------------------------------------------- |
| `id`          | string           | ID do medicamento.                                      |
| `companyId`   | string           | ID da empresa vinculada ao medicamento.                 |
| `genericName` | string           | Nome generico do medicamento.                           |
| `brandName`   | string ou `null` | Nome comercial ou marca do medicamento.                 |
| `form`        | string           | Forma farmaceutica, por exemplo `comprimido` ou `gota`. |
| `strength`    | string ou `null` | Concentracao/dosagem, por exemplo `500mg`.              |
| `isActive`    | boolean          | Indica se o medicamento esta ativo. Padrao: `true`.     |
| `createdAt`   | string           | Data de criacao do registro.                            |
| `updatedAt`   | string           | Data da ultima atualizacao do registro.                 |

## Normalizacao recomendada

O frontend deve enviar somente os campos aceitos pela API. Evite incluir campos extras no payload, como `companyId`, `isActive`, `createdAt` ou `updatedAt`.

Recomendacao para montar o payload:

```js
const emptyToUndefined = (value) => {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
};

const normalizeMedicationPayload = (form) => ({
  genericName: form.genericName.trim(),
  brandName: emptyToUndefined(form.brandName),
  form: form.form.trim(),
  strength: emptyToUndefined(form.strength),
});
```

## Cadastrar medicamento

Use esta funcao para criar um novo medicamento na empresa do usuario autenticado.

### Endpoint

```http
POST /medications
Content-Type: application/json
Authorization: Bearer <token>
```

### Permissao

Somente usuarios com `role` igual a `admin` podem cadastrar medicamentos.

Se um usuario diferente tentar cadastrar, a API retorna erro de validacao no campo `role`.

### Payload

Contrato atual da API:

```json
{
  "genericName": "Paracetamol",
  "brandName": "Tylenol",
  "form": "comprimido",
  "strength": "500mg"
}
```

### Campos do cadastro

| Campo         | Tipo   | Obrigatorio | Regra                                             |
| ------------- | ------ | ----------- | ------------------------------------------------- |
| `genericName` | string | Sim         | Nome generico com 2 a 120 caracteres.             |
| `brandName`   | string | Nao         | Nome da marca com no maximo 120 caracteres.       |
| `form`        | string | Sim         | Forma do medicamento com pelo menos 2 caracteres. |
| `strength`    | string | Nao         | Dosagem/concentracao com no maximo 80 caracteres. |

### Observacoes para a tela

Use opcoes padronizadas para `form` quando possivel, mas envie texto simples para a API. Exemplos comuns:

| Label no frontend | Valor sugerido |
| ----------------- | -------------- |
| Comprimido        | `comprimido`   |
| Capsula           | `capsula`      |
| Gota              | `gota`         |
| Xarope            | `xarope`       |
| Injetavel         | `injetavel`    |
| Pomada            | `pomada`       |

O backend cria o medicamento como ativo automaticamente (`isActive: true`). A API atual nao possui endpoint de edicao, inativacao ou exclusao de medicamentos.

Existe uma restricao de unicidade no banco para a combinacao `genericName`, `companyId`, `strength` e `form`. Para evitar registros duplicados, o frontend pode validar ou avisar quando o usuario tentar cadastrar um medicamento com o mesmo nome generico, forma e dosagem dentro da mesma empresa, caso essa informacao ja esteja disponivel na interface.

### Exemplo com fetch

```js
async function createMedication(form) {
  const token = localStorage.getItem("accessToken");
  const emptyToUndefined = (value) => {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  };

  const payload = {
    genericName: form.genericName.trim(),
    brandName: emptyToUndefined(form.brandName),
    form: form.form.trim(),
    strength: emptyToUndefined(form.strength),
  };

  const response = await fetch(`${import.meta.env.VITE_API_URL}/medications`, {
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

  return data.medication;
}
```

### Exemplo com Axios

```js
export async function createMedication(form) {
  const emptyToUndefined = (value) => {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  };

  const { data } = await api.post("/medications", {
    genericName: form.genericName.trim(),
    brandName: emptyToUndefined(form.brandName),
    form: form.form.trim(),
    strength: emptyToUndefined(form.strength),
  });

  return data.medication;
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
  "message": "Medicamento cadastrado com sucesso",
  "medication": {
    "id": "uuid-do-medicamento",
    "companyId": "uuid-da-empresa",
    "genericName": "Paracetamol",
    "brandName": "Tylenol",
    "form": "comprimido",
    "strength": "500mg",
    "isActive": true,
    "createdAt": "2026-04-28T10:30:00.000Z",
    "updatedAt": "2026-04-28T10:30:00.000Z"
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
  "message": "Dados de entrada inválidos",
  "errors": {
    "role": "Apenas administradores podem cadastrar medicamentos"
  },
  "errorType": "VALIDATION_ERROR"
}
```

#### Token ausente

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
    "token": "Token não fornecido"
  },
  "errorType": "VALIDATION_ERROR"
}
```

#### Token invalido ou expirado

Status HTTP:

```http
400 Bad Request
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

Body para token expirado:

```json
{
  "success": false,
  "message": "Dados de entrada inválidos",
  "errors": {
    "token": "Token expirado"
  },
  "errorType": "VALIDATION_ERROR"
}
```

#### Erro de validacao

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
    "genericName": "O nome deve ter no mínimo 2 caracteres"
  },
  "errorType": "VALIDATION_ERROR"
}
```

Exemplos de erros de validacao:

| Campo         | Mensagem possivel                                           |
| ------------- | ----------------------------------------------------------- |
| `genericName` | `O nome deve ter no mínimo 2 caracteres`                    |
| `genericName` | `O nome deve ter no máximo 120 caracteres`                  |
| `brandName`   | `O nome da marca deve ter no máximo 120 caracteres`         |
| `form`        | `A forma do medicamento é obrigatória`                      |
| `strength`    | `A dosagem do medicamento deve ter no máximo 80 caracteres` |

## Listar medicamentos

Use esta funcao para montar a listagem de medicamentos ativos da empresa do usuario autenticado.

### Endpoint

```http
GET /medications
Authorization: Bearer <token>
```

### Comportamento da API

A API retorna apenas medicamentos com:

- `companyId` igual ao da empresa do token;
- `isActive` igual a `true`.

A ordenacao atual e por `genericName` em ordem crescente.

### Exemplo com fetch

```js
async function listMedications() {
  const token = localStorage.getItem("accessToken");

  const response = await fetch(`${import.meta.env.VITE_API_URL}/medications`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return data.medications;
}
```

### Exemplo com Axios

```js
export async function listMedications() {
  const { data } = await api.get("/medications");

  return data.medications;
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
  "medications": [
    {
      "id": "uuid-do-medicamento",
      "companyId": "uuid-da-empresa",
      "genericName": "Paracetamol",
      "brandName": "Tylenol",
      "form": "comprimido",
      "strength": "500mg",
      "isActive": true,
      "createdAt": "2026-04-28T10:30:00.000Z",
      "updatedAt": "2026-04-28T10:30:00.000Z"
    }
  ]
}
```

Quando nao houver medicamentos ativos, a API retorna:

```json
{
  "success": true,
  "medications": []
}
```

### Uso sugerido na tela

```js
import { useEffect, useState } from "react";

export function MedicationsPage() {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMedications() {
      try {
        const data = await listMedications();
        setMedications(data);
      } catch (error) {
        setError("Nao foi possivel carregar os medicamentos.");
      } finally {
        setLoading(false);
      }
    }

    loadMedications();
  }, []);

  if (loading) return <p>Carregando...</p>;
  if (error) return <p>{error}</p>;

  return (
    <ul>
      {medications.map((medication) => (
        <li key={medication.id}>
          {medication.genericName} - {medication.strength || "Sem dosagem"}
        </li>
      ))}
    </ul>
  );
}
```

## Sugestao de service no frontend

```js
import { api } from "./api";

const emptyToUndefined = (value) => {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
};

export async function createMedication(form) {
  const { data } = await api.post("/medications", {
    genericName: form.genericName.trim(),
    brandName: emptyToUndefined(form.brandName),
    form: form.form.trim(),
    strength: emptyToUndefined(form.strength),
  });

  return data.medication;
}

export async function listMedications() {
  const { data } = await api.get("/medications");

  return data.medications;
}
```

## Estados recomendados de UI

Para as telas de cadastro e listagem, trate pelo menos estes estados:

- carregando durante o envio do formulario;
- carregando durante a busca da listagem;
- sucesso com a mensagem `Medicamento cadastrado com sucesso`;
- listagem vazia quando `medications` vier como array vazio;
- erro de validacao exibindo a mensagem do campo retornado em `errors`;
- erro de autenticacao/token direcionando o usuario para login quando fizer sentido;
- permissao insuficiente escondendo ou desabilitando o cadastro para usuarios que nao sejam `admin`.

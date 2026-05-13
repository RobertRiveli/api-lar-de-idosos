# Usuarios - Guia para o frontend

Este documento descreve como implementar as telas e servicos de frontend relacionados aos usuarios da empresa e como consumir a API de `users`.

## Visao geral

As rotas de usuarios sao protegidas por token JWT. O backend identifica a empresa pelo token do usuario autenticado, entao o frontend nao deve enviar `companyId` no payload nem na URL.

Funcionalidades documentadas neste guia:

- Cadastrar usuario na empresa do usuario autenticado.
- Listar usuarios da empresa do usuario autenticado.

Funcionalidades de usuario ja documentadas em guias proprios:

- Login: `docs/frontend-login-usuario.md`.
- Perfil do usuario autenticado: `docs/frontend-perfil-usuario.md`.

## Base da API

Exemplo em ambiente local:

```txt
http://localhost:<PORT>
```

O valor de `PORT` vem da variavel de ambiente `PORT` usada pelo backend.

## Autenticacao

Todas as rotas deste guia exigem token JWT.

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

## Modelo de usuario

Campos do usuario usados pelas rotas deste guia:

| Campo        | Tipo             | Descricao                                           |
| ------------ | ---------------- | --------------------------------------------------- |
| `id`         | string           | ID do usuario. Retornado na listagem.               |
| `companyId`  | string           | ID da empresa vinculada ao usuario.                 |
| `fullName`   | string           | Nome completo do usuario.                           |
| `email`      | string           | E-mail usado para identificacao e contato.          |
| `phone`      | string ou `null` | Telefone do usuario.                                |
| `cpf`        | string           | CPF do usuario, usado no login.                     |
| `role`       | string           | Perfil do usuario. Pode ser `admin` ou `caregiver`. |
| `isActive`   | boolean          | Indica se o usuario esta ativo.                     |
| `createdAt`  | string           | Data de criacao do registro.                        |
| `updatedAt`  | string           | Data da ultima atualizacao do registro.             |

Observacao importante: no contrato atual, a listagem retorna tambem `passwordHash`. O frontend deve ignorar esse campo, nunca exibir e nunca armazenar em estado global, cache persistente ou local storage.

## Normalizacao recomendada

O backend remove caracteres nao numericos de `phone` e `cpf`, alem de converter `email` para minusculo e remover espacos nas pontas. Mesmo assim, o frontend deve enviar dados ja normalizados para manter o payload previsivel.

```js
const onlyNumbers = (value) => value.replace(/\D/g, "");

const normalizeUserPayload = (form) => ({
  fullName: form.fullName.trim(),
  email: form.email.trim().toLowerCase(),
  phone: form.phone ? onlyNumbers(form.phone) : undefined,
  cpf: onlyNumbers(form.cpf),
  password: form.password,
  role: form.role || "caregiver",
});
```

## Cadastrar usuario

Use esta rota para criar um novo usuario vinculado a mesma empresa do usuario autenticado.

### Endpoint

```http
POST /users
Content-Type: application/json
Authorization: Bearer <token>
```

### Permissao

Somente usuarios com `role` igual a `admin` podem cadastrar usuarios.

Se um usuario `caregiver` tentar cadastrar, a API retorna erro de validacao no campo `role`.

### Payload

Contrato atual da API:

```json
{
  "fullName": "Joao Silva",
  "email": "joao@empresa.com",
  "phone": "85999998888",
  "cpf": "12345678909",
  "password": "senha1234",
  "role": "caregiver"
}
```

### Campos do cadastro

| Campo      | Tipo   | Obrigatorio | Regra                                                        |
| ---------- | ------ | ----------- | ------------------------------------------------------------ |
| `fullName` | string | Sim         | Nome completo com 3 a 160 caracteres.                        |
| `email`    | string | Sim         | E-mail valido.                                               |
| `phone`    | string | Nao         | Telefone brasileiro valido quando preenchido.                |
| `cpf`      | string | Sim         | CPF com 11 digitos numericos.                                |
| `password` | string | Sim         | Senha com 8 a 128 caracteres.                                |
| `role`     | string | Nao         | Pode ser `admin` ou `caregiver`. Padrao atual: `caregiver`.  |

### Observacoes para a tela

Use um campo de selecao para `role` com valores fechados:

| Label no frontend | Valor enviado |
| ----------------- | ------------- |
| Administrador     | `admin`       |
| Cuidador          | `caregiver`   |

O usuario criado fica vinculado automaticamente a empresa do token. Nao envie `companyId`.

A resposta de cadastro nao retorna `id`, `cpf`, `isActive` nem `updatedAt`. Caso a tela precise desses campos apos criar o usuario, recarregue a listagem com `GET /users`.

### Exemplo com fetch

```js
async function createUser(form) {
  const token = localStorage.getItem("accessToken");
  const onlyNumbers = (value) => value.replace(/\D/g, "");

  const payload = {
    fullName: form.fullName.trim(),
    email: form.email.trim().toLowerCase(),
    phone: form.phone ? onlyNumbers(form.phone) : undefined,
    cpf: onlyNumbers(form.cpf),
    password: form.password,
    role: form.role || "caregiver",
  };

  const response = await fetch(`${import.meta.env.VITE_API_URL}/users`, {
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

  return data.newUser;
}
```

### Exemplo com Axios

```js
export async function createUser(form) {
  const onlyNumbers = (value) => value.replace(/\D/g, "");

  const { data } = await api.post("/users", {
    fullName: form.fullName.trim(),
    email: form.email.trim().toLowerCase(),
    phone: form.phone ? onlyNumbers(form.phone) : undefined,
    cpf: onlyNumbers(form.cpf),
    password: form.password,
    role: form.role || "caregiver",
  });

  return data.newUser;
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
  "message": "Usuário criado com sucesso",
  "newUser": {
    "fullName": "Joao Silva",
    "email": "joao@empresa.com",
    "phone": "85999998888",
    "role": "caregiver",
    "createdAt": "2026-04-24T10:30:00.000Z"
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
    "role": "Apenas administradores podem adicionar usuários"
  },
  "errorType": "VALIDATION_ERROR"
}
```

#### Cargo invalido

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
    "role": "Cargo inválido"
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
    "cpf": "O CPF deve ter 11 caracteres"
  },
  "errorType": "VALIDATION_ERROR"
}
```

Possiveis campos em `errors`:

| Campo      | Exemplos de mensagem                                      |
| ---------- | --------------------------------------------------------- |
| `fullName` | `O nome deve ter pelo menos 3 caracteres`                 |
| `email`    | `E-mail inválido`                                         |
| `phone`    | `Número inválido` ou `Telefone inválido`                  |
| `cpf`      | `O CPF deve ter 11 caracteres` ou `O CPF deve conter apenas números` |
| `password` | `A senha deve ter mais de 8 caracteres` ou `A senha deve ter no máximo 128 caracteres` |
| `role`     | `Cargo inválido`                                         |

#### Conflito de dados

Status HTTP:

```http
409 Conflict
```

Body para e-mail duplicado:

```json
{
  "success": false,
  "message": "Conflito de dados",
  "errors": {
    "email": "Email já cadastrado"
  },
  "errorType": "CONFLICT_ERROR"
}
```

O mesmo formato pode ser retornado para:

| Campo   | Mensagem                 |
| ------- | ------------------------ |
| `email` | `Email já cadastrado`    |
| `phone` | `Telefone já cadastrado` |
| `cpf`   | `CPF já cadastrado`      |

## Listar usuarios da empresa

Use esta rota para montar telas administrativas de usuarios, como tabela de equipe, controle de perfis ou seletores internos de cuidadores.

### Endpoint

```http
GET /users
Authorization: Bearer <token>
```

### Permissao

Somente usuarios com `role` igual a `admin` podem listar os usuarios da empresa.

Se um usuario sem permissao tentar acessar, a API retorna `403 Forbidden`.

### Query params

Esta rota nao recebe filtros, paginacao ou parametros de busca atualmente.

### Exemplo com fetch

```js
async function listUsers() {
  const token = localStorage.getItem("accessToken");

  const response = await fetch(`${import.meta.env.VITE_API_URL}/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return data.users.map(({ passwordHash, ...user }) => user);
}
```

### Exemplo com Axios

```js
export async function listUsers() {
  const { data } = await api.get("/users");

  return data.users.map(({ passwordHash, ...user }) => user);
}
```

### Resposta de sucesso

Status HTTP:

```http
200 OK
```

Body atual da API:

```json
{
  "success": true,
  "users": [
    {
      "id": "uuid-do-usuario",
      "companyId": "uuid-da-empresa",
      "email": "joao@empresa.com",
      "fullName": "Joao Silva",
      "phone": "85999998888",
      "passwordHash": "$2b$10$hash-da-senha",
      "cpf": "12345678909",
      "role": "caregiver",
      "isActive": true,
      "createdAt": "2026-04-24T10:30:00.000Z",
      "updatedAt": "2026-04-24T10:30:00.000Z"
    }
  ]
}
```

### Uso recomendado no frontend

Remova `passwordHash` assim que receber a resposta, antes de salvar a lista em estado de tela ou cache:

```js
const toSafeUser = ({ passwordHash, ...user }) => user;

const users = response.users.map(toSafeUser);
```

Sugestao de colunas para uma tabela administrativa:

| Coluna             | Campo usado   |
| ------------------ | ------------- |
| Nome               | `fullName`    |
| E-mail             | `email`       |
| Telefone           | `phone`       |
| CPF                | `cpf`         |
| Perfil             | `role`        |
| Status             | `isActive`    |
| Data de cadastro   | `createdAt`   |

Sugestao de label para `role`:

```js
const roleLabels = {
  admin: "Administrador",
  caregiver: "Cuidador",
};
```

### Erros da listagem

#### Usuario sem permissao

Status HTTP:

```http
403 Forbidden
```

Body atual:

```json
{
  "message": "Você não tem permissão para acessar este recurso"
}
```

## Erros comuns de autenticacao

As duas rotas deste guia exigem o header `Authorization`.

### Token nao enviado

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

### Formato de token invalido

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
    "token": "Formato de token inválido"
  },
  "errorType": "VALIDATION_ERROR"
}
```

Esse erro acontece quando o header nao segue o formato:

```http
Authorization: Bearer <token>
```

### Token invalido ou expirado

Status HTTP:

```http
400 Bad Request
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

## Tratamento de erros no frontend

Erros relacionados a `token` devem encerrar a sessao local e redirecionar o usuario para o login.

```js
function handleUserApiError(error) {
  if (error?.errors?.token) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");

    return {
      redirectToLogin: true,
      message: "Sessao expirada. Faca login novamente.",
    };
  }

  if (error?.errors) {
    return {
      redirectToLogin: false,
      message: Object.values(error.errors)[0],
    };
  }

  return {
    redirectToLogin: false,
    message: error?.message ?? "Nao foi possivel concluir a operacao.",
  };
}
```

## Checklist para consumir as rotas

- Fazer login antes de chamar `/users`.
- Salvar `data.token` retornado pelo login.
- Enviar o header `Authorization: Bearer <token>`.
- Liberar as telas de cadastro e listagem apenas para usuarios `admin`.
- Nao enviar `companyId`; a empresa vem do token.
- Normalizar `email`, `phone` e `cpf` antes de enviar o cadastro.
- Tratar conflitos de `email`, `phone` e `cpf` exibindo mensagens por campo.
- Remover ou ignorar `passwordHash` recebido na listagem.

# Perfil do usuario - Guia para o frontend

Este documento descreve como implementar o consumo da rota de perfil do usuario autenticado.

## Visao geral

A rota de perfil usa o token JWT gerado no login para identificar o usuario. O frontend deve enviar esse token no header `Authorization`. A API valida o token, pega o `userId` dele e busca os dados atuais do usuario no banco.

Essa rota nao recebe body.

## Endpoint

```http
GET /users/profile
Authorization: Bearer <token>
```

Exemplo de base URL em ambiente local:

```txt
http://localhost:<PORT>/users/profile
```

## Autenticacao

Esta rota exige token JWT.

O token deve ser o valor retornado no login em:

```txt
data.token
```

Formato obrigatorio do header:

```http
Authorization: Bearer jwt.token.aqui
```

## Exemplo com fetch

```js
async function getProfile() {
  const token = localStorage.getItem("accessToken");

  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/users/profile`,
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

  return data;
}
```

## Exemplo com Axios

```js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export async function getProfile() {
  const { data } = await api.get("/users/profile");

  return data;
}
```

## Resposta de sucesso

Status HTTP:

```http
200 OK
```

Body atual da API:

```json
{
  "id": "uuid-do-usuario",
  "fullName": "Maria Silva",
  "email": "maria@empresa.com",
  "phone": "85999998888",
  "cpf": "12345678909",
  "createdAt": "2026-04-24T10:30:00.000Z",
  "role": "admin",
  "company": {
    "id": "uuid-da-empresa",
    "legalName": "Empresa Exemplo LTDA",
    "tradeName": "Empresa Exemplo",
    "isActive": true
  }
}
```

Campos retornados:

| Campo               | Descricao                                           |
| ------------------- | --------------------------------------------------- |
| `id`                | ID do usuario autenticado.                          |
| `fullName`          | Nome completo do usuario.                           |
| `email`             | E-mail do usuario.                                  |
| `phone`             | Telefone do usuario.                                |
| `cpf`               | CPF do usuario.                                     |
| `createdAt`         | Data de criacao do usuario.                         |
| `role`              | Perfil do usuario. Pode ser `admin` ou `caregiver`. |
| `company.id`        | ID da empresa vinculada ao usuario.                 |
| `company.legalName` | Razao social da empresa.                            |
| `company.tradeName` | Nome fantasia da empresa.                           |
| `company.isActive`  | Indica se a empresa esta ativa.                     |

## Uso sugerido na tela

```js
import { useEffect, useState } from "react";

export function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await getProfile();
        setProfile(data);
      } catch (error) {
        if (error?.errors?.token) {
          setError("Sessao expirada. Faca login novamente.");
          return;
        }

        setError("Nao foi possivel carregar o perfil.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  if (loading) return <p>Carregando...</p>;
  if (error) return <p>{error}</p>;

  return (
    <section>
      <h1>{profile.fullName}</h1>
      <p>{profile.email}</p>
      <p>{profile.company.tradeName}</p>
    </section>
  );
}
```

## Respostas de erro

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

### Usuario nao encontrado

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
    "id": "Usuário não encontrado"
  },
  "errorType": "VALIDATION_ERROR"
}
```

## Tratamento de erros no frontend

Erros relacionados a `token` devem encerrar a sessao local e redirecionar o usuario para o login.

```js
function handleProfileError(error) {
  const tokenError = error?.errors?.token;

  if (tokenError) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");

    return {
      redirectToLogin: true,
      message: "Sessao expirada. Faca login novamente.",
    };
  }

  return {
    redirectToLogin: false,
    message: error?.errors?.id ?? "Nao foi possivel carregar o perfil.",
  };
}
```

## Checklist para consumir a rota

- Fazer login antes de chamar `/users/profile`.
- Salvar `data.token` retornado pelo login.
- Enviar o header `Authorization: Bearer <token>`.
- Nao enviar body na requisicao.
- Tratar erros de `token` removendo a sessao local.
- Usar o retorno da rota como fonte dos dados atuais do perfil.
- Nao depender apenas dos dados salvos no login, pois eles podem estar desatualizados.

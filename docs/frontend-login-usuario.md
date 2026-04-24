# Login de usuario - Guia para o frontend

Este documento descreve como implementar a tela de login de usuario e consumir a API de autenticacao.

## Visao geral

O login recebe CPF e senha, valida se o usuario existe, se o usuario esta ativo, se a empresa vinculada esta ativa e se a senha confere. Em caso de sucesso, a API retorna um token JWT que deve ser usado nas proximas requisicoes autenticadas.

## Endpoint

```http
POST /auth
Content-Type: application/json
```

Exemplo de base URL em ambiente local:

```txt
http://localhost:<PORT>/auth
```

O valor de `PORT` vem da variavel de ambiente `PORT` usada pelo backend.

## Autenticacao

Este endpoint nao exige token. Ele e justamente o endpoint responsavel por gerar o token da sessao.

## Payload

Contrato atual da API:

```json
{
  "cpf": "12345678909",
  "password": "senha1234"
}
```

## Campos

| Campo      | Tipo   | Obrigatorio | Regra                                    |
| ---------- | ------ | ----------- | ---------------------------------------- |
| `cpf`      | string | Sim         | CPF do usuario com 11 digitos numericos. |
| `password` | string | Sim         | Senha cadastrada para o usuario.         |

## Normalizacao feita pela API

Antes de autenticar, o backend aplica uma sanitizacao no payload:

- `cpf`: remove qualquer caractere que nao seja numero;
- `password`: remove espacos no inicio e no fim.

Mesmo com essa sanitizacao, a recomendacao para o frontend e enviar o CPF apenas com numeros para manter o payload previsivel. Evite aplicar outras transformacoes na senha alem de repassar o valor digitado pelo usuario.

## Exemplo com fetch

```js
async function login(form) {
  const onlyNumbers = (value) => value.replace(/\D/g, "");

  const response = await fetch(`${import.meta.env.VITE_API_URL}/auth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      cpf: onlyNumbers(form.cpf),
      password: form.password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return data.data;
}
```

## Exemplo com Axios

```js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export async function login(form) {
  const onlyNumbers = (value) => value.replace(/\D/g, "");

  const { data } = await api.post("/auth", {
    cpf: onlyNumbers(form.cpf),
    password: form.password,
  });

  return data.data;
}
```

## Resposta de sucesso

Status HTTP:

```http
200 OK
```

Body:

```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "token": "jwt.token.aqui",
    "user": {
      "email": "usuario@empresa.com",
      "fullName": "Maria Silva",
      "role": "admin"
    }
  }
}
```

Campos principais da resposta:

| Campo                | Descricao                                                      |
| -------------------- | -------------------------------------------------------------- |
| `data.token`         | Token JWT que deve ser enviado nas rotas protegidas.           |
| `data.user.email`    | E-mail do usuario autenticado.                                 |
| `data.user.fullName` | Nome completo do usuario autenticado.                          |
| `data.user.role`     | Perfil do usuario. Atualmente pode ser `admin` ou `caregiver`. |

## Armazenamento do token

Depois do login, salve o token para usa-lo nas proximas chamadas autenticadas.

Exemplo simples:

```js
const session = await login(form);

localStorage.setItem("accessToken", session.token);
localStorage.setItem("user", JSON.stringify(session.user));
```

Para sistemas com maior exigencia de seguranca, prefira armazenar o token em cookie `httpOnly` controlado pelo backend. Como a API atual retorna o token no body, o uso de `localStorage` e a opcao mais simples para o frontend consumir o contrato atual.

## Enviando o token em rotas protegidas

Rotas protegidas devem receber o header `Authorization` no formato `Bearer`.

```js
const token = localStorage.getItem("accessToken");

const response = await fetch(`${import.meta.env.VITE_API_URL}/users`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

Com Axios:

```js
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
```

## Respostas de erro

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
    "cpf": "Usuário não encontrado"
  },
  "errorType": "VALIDATION_ERROR"
}
```

### Senha incorreta

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
    "password": "Senha incorreta"
  },
  "errorType": "VALIDATION_ERROR"
}
```

### Usuario inativo

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
    "user": "Usuário inativo"
  },
  "errorType": "VALIDATION_ERROR"
}
```

### Empresa inativa

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
    "company": "Empresa inativa"
  },
  "errorType": "VALIDATION_ERROR"
}
```

### Erro interno

Status HTTP:

```http
500 Internal Server Error
```

Body:

```json
{
  "success": false,
  "message": "Erro interno no servidor",
  "errorType": "INTERNAL_ERROR"
}
```

## Tratamento de erro no formulario

O campo `errors` vem como um objeto com o nome do campo e a mensagem.

```js
try {
  const session = await login(form);

  localStorage.setItem("accessToken", session.token);
  localStorage.setItem("user", JSON.stringify(session.user));

  navigate("/dashboard");
} catch (error) {
  if (error.errorType === "VALIDATION_ERROR") {
    setFieldErrors(error.errors);
    return;
  }

  setGlobalError("Nao foi possivel entrar. Tente novamente.");
}
```

Erros como `user` e `company` nao pertencem a um input especifico. A recomendacao e exibi-los como mensagem geral do formulario.

Exemplo:

```js
function normalizeLoginErrors(errors) {
  if (errors?.user || errors?.company) {
    return {
      fieldErrors: {},
      globalError: errors.user ?? errors.company,
    };
  }

  return {
    fieldErrors: errors ?? {},
    globalError: "",
  };
}
```

## Logout

Como a API atual nao possui endpoint de logout, o frontend deve encerrar a sessao removendo os dados locais.

```js
function logout() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
  navigate("/login");
}
```

## Checklist para a tela

- Aplicar mascara visual de CPF, mas enviar apenas numeros.
- Validar CPF com 11 digitos antes de chamar a API.
- Exigir senha preenchida antes de chamar a API.
- Desabilitar o botao de envio enquanto a requisicao estiver em andamento.
- Exibir erros de `cpf` e `password` junto aos campos.
- Exibir erros de `user` e `company` como mensagem geral.
- Salvar `data.token` apos login bem-sucedido.
- Enviar `Authorization: Bearer <token>` nas rotas protegidas.
- Remover token e usuario local no logout.

## Modelo de estado sugerido

```js
const initialForm = {
  cpf: "",
  password: "",
};
```

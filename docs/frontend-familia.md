# Família - Guia para o frontend

Este documento descreve como implementar as telas de cadastro e login de familiares, além de consumir as APIs responsáveis por criar e autenticar a conta do familiar.

## Visão geral

Nesta etapa, a API já permite:

- cadastrar um familiar;
- autenticar um familiar com e-mail e senha;
- gerar um JWT próprio para o familiar.

## Cadastro do familiar

O backend executa o cadastro com o seguinte fluxo:

1. sanitiza os dados recebidos;
2. valida o payload com Zod;
3. verifica se já existe familiar com o mesmo e-mail;
4. verifica se já existe familiar com o mesmo CPF;
5. criptografa a senha com `bcrypt`;
6. cria o familiar;
7. retorna os dados públicos do familiar criado.

## Endpoint de cadastro

```http
POST /family-members
Content-Type: application/json
```

Exemplo de base URL em ambiente local:

```txt
http://localhost:<PORT>/family-members
```

O valor de `PORT` vem da variável de ambiente `PORT` usada pelo backend.

## Autenticação do cadastro

Este endpoint não exige token de autenticação. Neste primeiro momento, ele é público porque serve apenas para o familiar criar a própria conta.

Depois do cadastro, o familiar pode fazer login usando `POST /auth/family`.

## Payload de cadastro

```json
{
  "fullName": "Maria Oliveira",
  "email": "maria@email.com",
  "phone": "85999999999",
  "cpf": "52998224725",
  "password": "Senha123@"
}
```

## Campos do cadastro

| Campo      | Tipo   | Obrigatório | Regra                                                                 |
| ---------- | ------ | ----------- | --------------------------------------------------------------------- |
| `fullName` | string | Sim         | Nome completo com pelo menos 3 caracteres.                            |
| `email`    | string | Sim         | E-mail válido.                                                        |
| `phone`    | string | Não         | Telefone apenas com números. Deve ter pelo menos 10 dígitos se usado. |
| `cpf`      | string | Sim         | CPF válido com 11 dígitos numéricos.                                  |
| `password` | string | Sim         | Senha de 8 a 128 caracteres, com regra mínima de segurança.           |

## Regra da senha

A senha deve conter:

- pelo menos 8 caracteres;
- pelo menos uma letra minúscula;
- pelo menos uma letra maiúscula;
- pelo menos um número;
- pelo menos um caractere especial.

Exemplo válido:

```txt
Senha123@
```

## Normalização feita pela API

Antes da validação, o backend aplica uma sanitização no payload:

- `fullName`: remove espaços no início e no fim;
- `email`: remove espaços no início e no fim e converte para minúsculo;
- `cpf`: remove qualquer caractere que não seja número;
- `phone`: remove qualquer caractere que não seja número.

Mesmo com essa sanitização, o frontend deve enviar documentos e telefones apenas com números para manter o payload previsível.

Exemplo de normalização:

```js
const onlyNumbers = (value) => value.replace(/\D/g, "");

const payload = {
  fullName: form.fullName.trim(),
  email: form.email.trim().toLowerCase(),
  phone: form.phone ? onlyNumbers(form.phone) : undefined,
  cpf: onlyNumbers(form.cpf),
  password: form.password,
};
```

## Exemplo com fetch

```js
async function registerFamilyMember(form) {
  const onlyNumbers = (value) => value.replace(/\D/g, "");

  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/family-members`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone ? onlyNumbers(form.phone) : undefined,
        cpf: onlyNumbers(form.cpf),
        password: form.password,
      }),
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

export async function registerFamilyMember(form) {
  const onlyNumbers = (value) => value.replace(/\D/g, "");

  const { data } = await api.post("/family-members", {
    fullName: form.fullName.trim(),
    email: form.email.trim().toLowerCase(),
    phone: form.phone ? onlyNumbers(form.phone) : undefined,
    cpf: onlyNumbers(form.cpf),
    password: form.password,
  });

  return data;
}
```

## Resposta de sucesso

Status HTTP:

```http
201 Created
```

Body:

```json
{
  "id": "9f2dddc8-51e2-4a6c-9f74-1d4d08f0c5a1",
  "fullName": "Maria Oliveira",
  "email": "maria@email.com",
  "phone": "85999999999",
  "cpf": "52998224725",
  "isActive": true,
  "createdAt": "2026-05-06T00:00:00.000Z"
}
```

A resposta não retorna `password` nem `passwordHash`.

## Exibindo sucesso no frontend

Após um cadastro bem-sucedido, exiba uma mensagem clara para o usuário e direcione para o próximo passo definido pelo produto.

Como o login do familiar já existe, uma opção simples é exibir a confirmação e redirecionar para a tela de login da família.

Exemplo:

```js
try {
  const familyMember = await registerFamilyMember(form);

  setSuccessMessage(`Cadastro criado para ${familyMember.fullName}.`);
  setFieldErrors({});
  setGlobalError("");
  navigate("/familia/login");
} catch (error) {
  handleRegisterFamilyMemberError(error);
}
```

## Respostas de erro

### Erro de validação

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
    "cpf": "CPF inválido"
  },
  "errorType": "VALIDATION_ERROR"
}
```

Exemplos de erros de validação:

| Campo      | Mensagem possível                                                        |
| ---------- | ------------------------------------------------------------------------ |
| `fullName` | `Nome completo é obrigatório`, `O nome deve ter pelo menos 3 caracteres` |
| `email`    | `E-mail é obrigatório`, `E-mail inválido`                                |
| `phone`    | `O telefone deve conter apenas números`, `Telefone inválido`             |
| `cpf`      | `CPF é obrigatório`, `O CPF deve ter 11 caracteres`, `CPF inválido`      |
| `password` | `Senha é obrigatória`, `A senha deve ter no mínimo 8 caracteres`         |
| `password` | `A senha deve conter ao menos uma letra minúscula`                       |
| `password` | `A senha deve conter ao menos uma letra maiúscula`                       |
| `password` | `A senha deve conter ao menos um número`                                 |
| `password` | `A senha deve conter ao menos um caractere especial`                     |

### E-mail já cadastrado

Status HTTP:

```http
409 Conflict
```

Body:

```json
{
  "success": false,
  "message": "Email já cadastrado",
  "errors": {
    "email": "Email já cadastrado"
  },
  "errorType": "CONFLICT_ERROR"
}
```

### CPF já cadastrado

Status HTTP:

```http
409 Conflict
```

Body:

```json
{
  "success": false,
  "message": "CPF já cadastrado",
  "errors": {
    "cpf": "CPF já cadastrado"
  },
  "errorType": "CONFLICT_ERROR"
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

## Tratamento de erro no formulário

O campo `errors` vem como um objeto com o nome do campo e a mensagem.

Exemplo:

```js
function handleRegisterFamilyMemberError(error) {
  if (
    error.errorType === "VALIDATION_ERROR" ||
    error.errorType === "CONFLICT_ERROR"
  ) {
    setFieldErrors(error.errors ?? {});
    setGlobalError("");
    return;
  }

  setFieldErrors({});
  setGlobalError("Não foi possível cadastrar o familiar. Tente novamente.");
}
```

Exemplo de uso completo:

```js
async function handleSubmit(event) {
  event.preventDefault();
  setIsSubmitting(true);
  setFieldErrors({});
  setGlobalError("");
  setSuccessMessage("");

  try {
    const familyMember = await registerFamilyMember(form);

    setSuccessMessage(`Cadastro criado para ${familyMember.fullName}.`);
  } catch (error) {
    handleRegisterFamilyMemberError(error);
  } finally {
    setIsSubmitting(false);
  }
}
```

## Mapeamento de erros para inputs

Como os nomes dos campos da API são os mesmos nomes esperados no formulário, o mapeamento pode ser direto.

```js
const apiFieldToFormField = {
  fullName: "fullName",
  email: "email",
  phone: "phone",
  cpf: "cpf",
  password: "password",
};

function mapApiErrors(errors) {
  return Object.entries(errors ?? {}).reduce((acc, [field, message]) => {
    const formField = apiFieldToFormField[field] ?? field;
    acc[formField] = message;
    return acc;
  }, {});
}
```

## Checklist para a tela

- Aplicar máscara visual para CPF e telefone, mas remover a máscara antes do envio.
- Converter e-mail para minúsculo antes do envio.
- Remover espaços no início e fim de `fullName` e `email`.
- Validar `fullName` com pelo menos 3 caracteres antes de chamar a API.
- Validar CPF com 11 dígitos e, se possível, CPF válido antes de chamar a API.
- Validar senha com a mesma regra mínima do backend.
- Exibir erros de campo usando o objeto `errors` retornado pela API.
- Exibir mensagem geral para erros inesperados ou indisponibilidade do servidor.
- Desabilitar o botão de envio enquanto a requisição estiver em andamento.
- Após cadastro bem-sucedido, redirecionar para a tela de login da família ou para o próximo passo definido pelo produto.

## Modelo de estado sugerido para cadastro

```js
const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  cpf: "",
  password: "",
};
```

## Login do familiar

O login do familiar é separado do login de usuários internos da empresa. Usuários internos continuam usando `POST /auth` com CPF e senha. Familiares usam `POST /auth/family` com e-mail e senha.

Em caso de sucesso, a API retorna um JWT que identifica uma conta do tipo familiar. Esse token deve ser usado futuramente nas rotas protegidas da família.

## Endpoint de login

```http
POST /auth/family
Content-Type: application/json
```

Exemplo de base URL em ambiente local:

```txt
http://localhost:<PORT>/auth/family
```

## Autenticação do login

Este endpoint não exige token. Ele é responsável por gerar o token da sessão do familiar.

## Payload de login

```json
{
  "email": "maria@email.com",
  "password": "Senha123@"
}
```

## Campos do login

| Campo      | Tipo   | Obrigatório | Regra                              |
| ---------- | ------ | ----------- | ---------------------------------- |
| `email`    | string | Sim         | E-mail cadastrado para o familiar. |
| `password` | string | Sim         | Senha cadastrada para o familiar.  |

## Normalização feita pela API no login

Antes de autenticar, o backend aplica uma sanitização no payload:

- `email`: remove espaços no início e no fim e converte para minúsculo;
- `password`: remove espaços no início e no fim.

Mesmo com essa sanitização, a recomendação é enviar o e-mail normalizado e repassar a senha digitada pelo usuário.

## Exemplo de login com fetch

```js
async function loginFamilyMember(form) {
  const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/family`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: form.email.trim().toLowerCase(),
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

## Exemplo de login com Axios

```js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export async function loginFamilyMember(form) {
  const { data } = await api.post("/auth/family", {
    email: form.email.trim().toLowerCase(),
    password: form.password,
  });

  return data.data;
}
```

## Resposta de sucesso do login

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
    "familyMember": {
      "id": "9f2dddc8-51e2-4a6c-9f74-1d4d08f0c5a1",
      "email": "maria@email.com",
      "fullName": "Maria Oliveira"
    }
  }
}
```

Campos principais da resposta:

| Campo                        | Descrição                              |
| ---------------------------- | -------------------------------------- |
| `data.token`                 | Token JWT da sessão do familiar.       |
| `data.familyMember.id`       | ID do familiar autenticado.            |
| `data.familyMember.email`    | E-mail do familiar autenticado.        |
| `data.familyMember.fullName` | Nome completo do familiar autenticado. |

## Armazenamento do token do familiar

Depois do login, salve o token para usá-lo nas próximas chamadas autenticadas da família.

Use chaves separadas das chaves do login interno para não misturar sessão de funcionário com sessão de familiar.

Exemplo:

```js
const session = await loginFamilyMember(form);

localStorage.setItem("familyAccessToken", session.token);
localStorage.setItem("familyMember", JSON.stringify(session.familyMember));
```

Para sistemas com maior exigência de segurança, prefira armazenar o token em cookie `httpOnly` controlado pelo backend. Como a API atual retorna o token no body, o uso de `localStorage` é a opção mais simples para consumir o contrato atual.

## Enviando o token em rotas protegidas da família

Rotas protegidas da família devem receber o header `Authorization` no formato `Bearer`.

```js
const token = localStorage.getItem("familyAccessToken");

const response = await fetch(`${import.meta.env.VITE_API_URL}/family-area`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

Com Axios:

```js
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("familyAccessToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
```

O token do familiar é diferente do token de usuários internos. Um token gerado em `POST /auth` não deve ser usado nas rotas protegidas da família.

## Erros do login

### Erro de validação no login

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
    "email": "E-mail inválido"
  },
  "errorType": "VALIDATION_ERROR"
}
```

Exemplos de erros de validação:

| Campo          | Mensagem possível                                                    |
| -------------- | -------------------------------------------------------------------- |
| `email`        | `E-mail é obrigatório`, `E-mail inválido`, `Familiar não encontrado` |
| `password`     | `Senha é obrigatória`, `A senha deve ter mais de 8 caracteres`       |
| `password`     | `Senha incorreta`                                                    |
| `familyMember` | `Familiar inativo`                                                   |

### Familiar não encontrado

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
    "email": "Familiar não encontrado"
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

### Familiar inativo

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
    "familyMember": "Familiar inativo"
  },
  "errorType": "VALIDATION_ERROR"
}
```

Como `familyMember` não pertence a um input específico, exiba essa mensagem como erro geral do formulário.

## Tratamento de erro no formulário de login

Exemplo:

```js
function normalizeFamilyLoginErrors(errors) {
  if (errors?.familyMember) {
    return {
      fieldErrors: {},
      globalError: errors.familyMember,
    };
  }

  return {
    fieldErrors: errors ?? {},
    globalError: "",
  };
}

function handleFamilyLoginError(error) {
  if (error.errorType === "VALIDATION_ERROR") {
    const normalized = normalizeFamilyLoginErrors(error.errors);

    setFieldErrors(normalized.fieldErrors);
    setGlobalError(normalized.globalError);
    return;
  }

  setFieldErrors({});
  setGlobalError("Não foi possível entrar. Tente novamente.");
}
```

Exemplo de uso completo:

```js
async function handleFamilyLoginSubmit(event) {
  event.preventDefault();
  setIsSubmitting(true);
  setFieldErrors({});
  setGlobalError("");
  setSuccessMessage("");

  try {
    const session = await loginFamilyMember(form);

    localStorage.setItem("familyAccessToken", session.token);
    localStorage.setItem("familyMember", JSON.stringify(session.familyMember));

    setSuccessMessage("Login realizado com sucesso.");
    navigate("/familia");
  } catch (error) {
    handleFamilyLoginError(error);
  } finally {
    setIsSubmitting(false);
  }
}
```

## Erros em rotas protegidas da família

Quando uma rota protegida usar o middleware de autenticação da família, erros de token também seguem o padrão de validação.

Exemplo de token ausente:

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

Mensagens possíveis para `token`:

| Mensagem                       | Quando acontece                               |
| ------------------------------ | --------------------------------------------- |
| `Token não fornecido`          | Header `Authorization` ausente.               |
| `Formato de token inválido`    | Header não está no formato `Bearer <token>`.  |
| `Token inválido`               | Token inválido ou malformado.                 |
| `Token expirado`               | Token válido, mas expirado.                   |
| `Token ainda não está ativo`   | Token ainda não pode ser usado.               |
| `Token inválido para familiar` | Token existe, mas não pertence a um familiar. |

Para esses casos, a recomendação é limpar a sessão local do familiar e redirecionar para o login quando o token estiver ausente, inválido ou expirado.

```js
function logoutFamilyMember() {
  localStorage.removeItem("familyAccessToken");
  localStorage.removeItem("familyMember");
  navigate("/familia/login");
}
```

## Checklist para a tela de login

- Converter e-mail para minúsculo antes do envio.
- Remover espaços no início e fim do e-mail.
- Exigir e-mail e senha preenchidos antes de chamar a API.
- Exibir erros de `email` e `password` junto aos campos.
- Exibir erro de `familyMember` como mensagem geral.
- Desabilitar o botão de envio enquanto a requisição estiver em andamento.
- Salvar `data.token` em uma chave própria, como `familyAccessToken`.
- Salvar `data.familyMember` separado dos dados do usuário interno.
- Enviar `Authorization: Bearer <familyAccessToken>` nas rotas protegidas da família.
- Remover token e familiar local no logout.

## Modelo de estado sugerido para login

```js
const initialLoginForm = {
  email: "",
  password: "",
};
```

## Observações importantes

- O login do familiar não deve usar `POST /auth`, pois esse endpoint é reservado para usuários internos autenticados com CPF.

- O CPF de exemplos como `12345678900` pode falhar se a API validar CPF real. Use CPFs válidos em testes.

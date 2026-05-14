# Família - Guia para o frontend

Este documento descreve como implementar as telas de cadastro, login e vínculo de familiares com residentes, além de consumir as APIs responsáveis por criar, autenticar e liberar acesso do familiar.

## Visão geral

Nesta etapa, a API já permite:

- cadastrar um familiar;
- autenticar um familiar com e-mail e senha;
- gerar um JWT próprio para o familiar;
- gerar um código de acesso para um residente usando um usuário interno `admin`;
- listar vínculos entre familiares e residentes da empresa autenticada;
- resgatar um código de acesso de residente usando o JWT do familiar;
- criar o vínculo entre familiar e residente na tabela `ResidentFamilyAccess`;
- listar os residentes vinculados ao familiar autenticado;
- buscar os detalhes permitidos de um residente vinculado.

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

## Geração do código de acesso do residente

Antes do familiar resgatar um código, um usuário interno da empresa com papel `admin` precisa gerar esse código para um residente.

Essa funcionalidade pertence à área administrativa. Ela não usa o token do familiar:

- o usuário interno faz login em `POST /auth`;
- o frontend administrativo salva o token interno;
- o administrador seleciona um residente;
- o administrador informa o limite de usos;
- a API gera um código temporário;
- o código deve ser compartilhado com o familiar por um canal definido pelo produto.

O `companyId` vem do token do usuário interno e o `residentId` vem da URL. Nenhum desses campos deve ser enviado no body.

## Endpoint de geração

```http
POST /residents/:residentId/access-codes
Content-Type: application/json
Authorization: Bearer <internalAccessToken>
```

Exemplo de base URL em ambiente local:

```txt
http://localhost:<PORT>/residents/<residentId>/access-codes
```

## Autenticação da geração

Este endpoint exige token de usuário interno e papel `admin`.

Use o token retornado em `POST /auth`, não o token retornado em `POST /auth/family`.

Se um familiar tentar usar o token dele nesta rota, a API não deve autorizar o acesso, pois a rota usa `authMiddleware` e `authorizeRoles("admin")`.

## Payload de geração

```json
{
  "maxUses": 1
}
```

## Campos da geração

| Campo     | Tipo   | Obrigatório | Regra sugerida no frontend  |
| --------- | ------ | ----------- | --------------------------- |
| `maxUses` | number | Sim         | Inteiro maior ou igual a 1. |

O backend usa `maxUses` para definir quantas vezes o código poderá ser resgatado. Quando `usesCount` atingir esse limite, o código é desativado.

O backend valida esse campo e aceita número ou string numérica, como `1` ou `"1"`. Valores vazios, textos não numéricos, números decimais ou menores que 1 retornam erro `400`.

## Normalização recomendada na geração

Garanta que `maxUses` seja enviado como número, não como string:

```js
const payload = {
  maxUses: Number(form.maxUses),
};
```

## Exemplo de geração com fetch

```js
async function createResidentAccessCode(residentId, form) {
  const token = localStorage.getItem("internalAccessToken");

  if (!token) {
    throw {
      errorType: "VALIDATION_ERROR",
      errors: { token: "Sessão administrativa não encontrada" },
    };
  }

  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/residents/${residentId}/access-codes`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        maxUses: Number(form.maxUses),
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

## Exemplo de geração com Axios

```js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export async function createResidentAccessCode(residentId, form) {
  const token = localStorage.getItem("internalAccessToken");

  if (!token) {
    throw {
      errorType: "VALIDATION_ERROR",
      errors: { token: "Sessão administrativa não encontrada" },
    };
  }

  const { data } = await api.post(
    `/residents/${residentId}/access-codes`,
    {
      maxUses: Number(form.maxUses),
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return data;
}
```

## Resposta de sucesso da geração

Status HTTP:

```http
201 Created
```

Body:

```json
{
  "success": true,
  "message": "Código criado com sucesso",
  "code": "A8K2P9",
  "expiresAt": "2026-05-08T00:00:00.000Z",
  "maxUses": 1,
  "residentId": "4be87bd3-7966-451f-bc3d-76f9edc034f5"
}
```

Campos principais da resposta:

| Campo        | Descrição                                               |
| ------------ | ------------------------------------------------------- |
| `code`       | Código que o familiar deve informar no app.             |
| `expiresAt`  | Data e hora de expiração do código.                     |
| `maxUses`    | Quantidade máxima de resgates permitidos para o código. |
| `residentId` | ID do residente relacionado ao código.                  |

O código gerado tem 6 caracteres, já vem em maiúsculo e expira 1 dia após a criação.

## Exibindo sucesso na geração

Após gerar o código, mostre o código com destaque e permita copiar ou compartilhar conforme a regra do produto.

Exemplo:

```js
try {
  const accessCode = await createResidentAccessCode(residentId, form);

  setGeneratedCode(accessCode.code);
  setSuccessMessage("Código criado com sucesso.");
  setFieldErrors({});
  setGlobalError("");
} catch (error) {
  handleCreateResidentAccessCodeError(error);
}
```

Sugestão de exibição:

```js
const expiresAtLabel = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
}).format(new Date(accessCode.expiresAt));
```

Use essa data para orientar o administrador, por exemplo: `Expira em 08/05/2026, 09:00`.

## Erros da geração

### Token ausente ou inválido

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

As mensagens possíveis para `token` são as mesmas descritas na seção de rotas protegidas da família, pois os middlewares de autenticação usam o mesmo padrão de erro para token.

### Usuário sem permissão de administrador

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

Esse erro acontece quando o token interno existe, mas o usuário não tem papel `admin`.

### Empresa relacionada não encontrada

Status HTTP:

```http
404 Not Found
```

Body:

```json
{
  "success": false,
  "message": "Empresa relacionada não encontrada",
  "errorType": "NOT_FOUND"
}
```

### Residente não encontrado

Status HTTP:

```http
404 Not Found
```

Body:

```json
{
  "success": false,
  "message": "Residente não encontrado",
  "errorType": "NOT_FOUND"
}
```

### Payload inválido

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
    "maxUses": "maxUses deve ser um número"
  },
  "errorType": "VALIDATION_ERROR"
}
```

Mensagens possíveis para `maxUses`:

| Mensagem                             | Quando acontece                      |
| ------------------------------------ | ------------------------------------ |
| `maxUses é obrigatório`              | Campo ausente ou vazio.              |
| `maxUses deve ser um número`         | Campo enviado com texto inválido.    |
| `maxUses deve ser um número inteiro` | Campo enviado com número decimal.    |
| `maxUses deve ser maior que zero`    | Campo enviado com valor menor que 1. |

Mesmo com a validação no backend, valide no frontend antes de chamar a API para melhorar a experiência.

Exemplo de validação local:

```js
function validateAccessCodeForm(form) {
  const maxUses = Number(form.maxUses);

  if (!Number.isInteger(maxUses) || maxUses < 1) {
    return {
      maxUses: "Informe um limite de usos válido.",
    };
  }

  return {};
}
```

## Tratamento de erro no formulário de geração

Exemplo:

```js
function handleCreateResidentAccessCodeError(error) {
  if (error.errorType === "VALIDATION_ERROR") {
    if (error.errors?.token) {
      setFieldErrors({});
      setGlobalError(error.errors.token);
      return;
    }

    setFieldErrors(error.errors ?? {});
    setGlobalError("");
    return;
  }

  if (error.message === "Você não tem permissão para acessar este recurso") {
    setFieldErrors({});
    setGlobalError(error.message);
    return;
  }

  if (error.errorType === "NOT_FOUND") {
    setFieldErrors({});
    setGlobalError(error.message);
    return;
  }

  setFieldErrors({});
  setGlobalError("Não foi possível gerar o código. Tente novamente.");
}
```

Exemplo de uso completo:

```js
async function handleCreateAccessCodeSubmit(event) {
  event.preventDefault();
  setIsSubmitting(true);
  setFieldErrors({});
  setGlobalError("");
  setSuccessMessage("");

  const localErrors = validateAccessCodeForm(form);

  if (Object.keys(localErrors).length > 0) {
    setFieldErrors(localErrors);
    setIsSubmitting(false);
    return;
  }

  try {
    const accessCode = await createResidentAccessCode(residentId, form);

    setGeneratedCode(accessCode.code);
    setSuccessMessage("Código criado com sucesso.");
  } catch (error) {
    handleCreateResidentAccessCodeError(error);
  } finally {
    setIsSubmitting(false);
  }
}
```

## Checklist para a tela de geração

- Exigir login de usuário interno antes de exibir a ação.
- Permitir a ação apenas para usuários com papel `admin`.
- Enviar `Authorization: Bearer <internalAccessToken>`.
- Usar `residentId` na URL.
- Não enviar `residentId` no body.
- Não enviar `companyId` no body.
- Enviar `maxUses` como número inteiro maior ou igual a 1.
- Exibir o código retornado com destaque.
- Exibir a data de expiração em formato amigável.
- Desabilitar o botão enquanto a requisição estiver em andamento.
- Orientar o administrador a compartilhar o código com o familiar.

## Modelo de estado sugerido para geração

```js
const initialCreateAccessCodeForm = {
  maxUses: 1,
};
```

## Listagem de códigos ativos do residente

Use esta rota quando a tela administrativa precisar mostrar os códigos de acesso ainda utilizáveis de um residente, por exemplo em uma aba da tela de detalhes ou junto da página de overview.

Essa listagem não faz parte do endpoint de overview do residente. Como códigos de acesso são dados sensíveis e a overview também pode ser usada por usuários que não são administradores, o frontend deve buscar os códigos separadamente apenas quando o usuário interno tiver papel `admin`.

## Endpoint de listagem

```http
GET /residents/:residentId/access-codes
Authorization: Bearer <internalAccessToken>
```

Exemplo de base URL em ambiente local:

```txt
http://localhost:<PORT>/residents/<residentId>/access-codes
```

## Autenticação da listagem

Este endpoint exige token de usuário interno e papel `admin`.

Use o token retornado em `POST /auth`, não o token retornado em `POST /auth/family`.

## Comportamento da listagem

A API valida se o residente existe, está ativo e pertence à empresa do usuário autenticado.

A resposta retorna somente códigos que ainda podem ser usados:

- `isActive` igual a `true`;
- `expiresAt` maior que a data e hora atual;
- `usesCount` menor que `maxUses`.

Códigos expirados, inativos ou que já atingiram o limite de usos não aparecem nessa listagem.

## Exemplo de listagem com fetch

```js
async function listResidentAccessCodes(residentId) {
  const token = localStorage.getItem("internalAccessToken");

  if (!token) {
    throw {
      errorType: "VALIDATION_ERROR",
      errors: { token: "Sessão administrativa não encontrada" },
    };
  }

  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/residents/${residentId}/access-codes`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return data.accessCodes;
}
```

## Exemplo de listagem com Axios

```js
export async function listResidentAccessCodes(residentId) {
  const token = localStorage.getItem("internalAccessToken");

  if (!token) {
    throw {
      errorType: "VALIDATION_ERROR",
      errors: { token: "Sessão administrativa não encontrada" },
    };
  }

  const { data } = await api.get(`/residents/${residentId}/access-codes`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return data.accessCodes;
}
```

## Resposta de sucesso da listagem

Status HTTP:

```http
200 OK
```

Body:

```json
{
  "success": true,
  "accessCodes": [
    {
      "id": "uuid-do-codigo",
      "residentId": "4be87bd3-7966-451f-bc3d-76f9edc034f5",
      "code": "A8K2P9",
      "expiresAt": "2026-05-08T00:00:00.000Z",
      "maxUses": 3,
      "usesCount": 1,
      "remainingUses": 2,
      "isActive": true,
      "createdAt": "2026-05-07T00:00:00.000Z",
      "updatedAt": "2026-05-07T00:00:00.000Z"
    }
  ]
}
```

Campos principais de cada item:

| Campo           | Descrição                                               |
| --------------- | ------------------------------------------------------- |
| `id`            | ID do código de acesso.                                 |
| `residentId`    | ID do residente relacionado ao código.                  |
| `code`          | Código que pode ser compartilhado com o familiar.       |
| `expiresAt`     | Data e hora de expiração do código.                     |
| `maxUses`       | Quantidade máxima de resgates permitidos.               |
| `usesCount`     | Quantidade de vezes que o código já foi resgatado.      |
| `remainingUses` | Quantidade de resgates restantes.                       |
| `isActive`      | Indica se o código está ativo.                          |
| `createdAt`     | Data de criação do código.                              |
| `updatedAt`     | Data da última atualização do código.                   |

## Uso junto da overview

Na tela administrativa de detalhes do residente, carregue a overview e os códigos em chamadas separadas:

```js
async function loadAdminResidentDetails(residentId) {
  const [overview, accessCodes] = await Promise.all([
    getResidentOverview(residentId),
    listResidentAccessCodes(residentId),
  ]);

  return {
    overview,
    accessCodes,
  };
}
```

Se o usuário autenticado não for `admin`, não chame `GET /residents/:residentId/access-codes`.

## Erros da listagem

### Usuário sem permissão de administrador

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

### Residente não encontrado

Status HTTP:

```http
404 Not Found
```

Body:

```json
{
  "success": false,
  "message": "Residente não encontrado",
  "errorType": "NOT_FOUND"
}
```

## Listagem administrativa de vínculos familiares

Use esta rota quando uma tela administrativa precisar exibir todos os vínculos entre familiares e residentes da empresa autenticada, por exemplo em uma página de acompanhamento geral dos acessos familiares.

Essa listagem é diferente de `GET /residents/:residentId/family-members`: aqui o backend retorna vínculos de todos os residentes da empresa, não apenas de um residente específico.

## Endpoint de listagem de vínculos

```http
GET /family-members/accesses
Authorization: Bearer <internalAccessToken>
```

Exemplo de base URL em ambiente local:

```txt
http://localhost:<PORT>/family-members/accesses
```

## Autenticação da listagem de vínculos

Este endpoint exige token de usuário interno. Use o token retornado em `POST /auth`, não o token retornado em `POST /auth/family`.

Somente usuários com `role` igual a `admin` podem listar os vínculos familiares da empresa.

## Comportamento da listagem de vínculos

A API usa o `companyId` do JWT do usuário autenticado. O frontend não deve enviar `companyId` no body, query string ou parâmetros de rota.

A resposta retorna vínculos ativos e inativos encontrados em `ResidentFamilyAccess`, ordenados por `createdAt` de forma decrescente. Se não houver vínculos cadastrados para a empresa, `accesses` será um array vazio.

A resposta não retorna dados sensíveis do familiar, como `passwordHash` ou `cpf`, nem dados clínicos ou completos do residente.

## Exemplo de listagem de vínculos com fetch

```js
async function listCompanyFamilyAccesses() {
  const token = localStorage.getItem("internalAccessToken");

  if (!token) {
    throw {
      errorType: "VALIDATION_ERROR",
      errors: { token: "Sessão administrativa não encontrada" },
    };
  }

  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/family-members/accesses`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return data.accesses;
}
```

## Exemplo de listagem de vínculos com Axios

```js
export async function listCompanyFamilyAccesses() {
  const token = localStorage.getItem("internalAccessToken");

  if (!token) {
    throw {
      errorType: "VALIDATION_ERROR",
      errors: { token: "Sessão administrativa não encontrada" },
    };
  }

  const { data } = await api.get("/family-members/accesses", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return data.accesses;
}
```

## Resposta de sucesso da listagem de vínculos

Status HTTP:

```http
200 OK
```

Body:

```json
{
  "accesses": [
    {
      "id": "uuid-do-vinculo",
      "relationship": "filha",
      "isActive": true,
      "createdAt": "2026-05-13T12:00:00.000Z",
      "updatedAt": "2026-05-13T12:00:00.000Z",
      "resident": {
        "id": "uuid-do-residente",
        "fullName": "Jose Silva",
        "status": "active"
      },
      "familyMember": {
        "id": "uuid-do-familiar",
        "fullName": "Maria Silva",
        "email": "maria@email.com",
        "phone": "85999999999"
      }
    }
  ]
}
```

Campos principais de cada item:

| Campo                   | Descrição                                      |
| ----------------------- | ---------------------------------------------- |
| `id`                    | ID do vínculo em `ResidentFamilyAccess`.       |
| `relationship`          | Relacionamento informado no resgate do código. |
| `isActive`              | Indica se o vínculo ainda está ativo.          |
| `createdAt`             | Data de criação do vínculo.                    |
| `updatedAt`             | Data da última atualização do vínculo.         |
| `resident.id`           | ID do residente vinculado.                     |
| `resident.fullName`     | Nome completo do residente.                    |
| `resident.status`       | Status atual do residente.                     |
| `familyMember.id`       | ID do familiar vinculado.                      |
| `familyMember.fullName` | Nome completo do familiar.                     |
| `familyMember.email`    | E-mail do familiar.                            |
| `familyMember.phone`    | Telefone do familiar, quando cadastrado.       |

## Erros da listagem de vínculos

### Usuário sem permissão de administrador

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
    "role": "Apenas administradores podem visualizar vínculos de familiares"
  },
  "errorType": "VALIDATION_ERROR"
}
```

### Token interno ausente ou inválido

Use o mesmo tratamento de sessão das demais rotas protegidas por `authMiddleware`. Quando o token estiver ausente, inválido ou expirado, redirecione o usuário para o login interno.

## Uso recomendado da listagem de vínculos

Sugestão de colunas para uma tabela administrativa:

| Coluna             | Campo usado               |
| ------------------ | ------------------------- |
| Residente          | `resident.fullName`       |
| Familiar           | `familyMember.fullName`   |
| E-mail do familiar | `familyMember.email`      |
| Telefone           | `familyMember.phone`      |
| Relação            | `relationship`            |
| Status do vínculo  | `isActive`                |
| Criado em          | `createdAt`               |

Para status visual, trate `isActive` como um booleano de vínculo:

```js
const accessStatusLabels = {
  true: "Ativo",
  false: "Inativo",
};
```

## Checklist para a listagem de vínculos

- Exigir login de usuário interno antes de exibir a tela.
- Permitir a listagem apenas para usuários com papel `admin`.
- Enviar `Authorization: Bearer <internalAccessToken>`.
- Não enviar `companyId`.
- Usar `accesses` como fonte da tabela.
- Não esperar dados sensíveis do familiar, como `passwordHash` ou `cpf`.
- Exibir estado vazio quando `accesses` vier como array vazio.

## Resgate de código de acesso do residente

Depois que o familiar faz login, ele pode informar um código de acesso gerado pelo administrador para se vincular a um residente.

Esse fluxo usa o token retornado em `POST /auth/family`. O frontend não deve enviar `familyMemberId` nem `residentId` no body:

- `familyMemberId` vem do JWT do familiar;
- `residentId` vem do código encontrado no backend;
- a rota cria um registro em `ResidentFamilyAccess`;
- o backend incrementa o uso do código;
- se o código atingir o limite de usos, ele é desativado.

## Endpoint de resgate

```http
POST /family-members/access-codes/redeem
Content-Type: application/json
Authorization: Bearer <familyAccessToken>
```

Exemplo de base URL em ambiente local:

```txt
http://localhost:<PORT>/family-members/access-codes/redeem
```

## Autenticação do resgate

Este endpoint exige token de familiar. Use o token salvo após o login em `POST /auth/family`.

Não use o token de usuários internos gerado em `POST /auth`, pois essa rota é protegida por `familyAuthMiddleware`.

## Payload de resgate

```json
{
  "code": "A8K2P9",
  "relationship": "filha"
}
```

## Campos do resgate

| Campo          | Tipo   | Obrigatório | Regra                                       |
| -------------- | ------ | ----------- | ------------------------------------------- |
| `code`         | string | Sim         | Código recebido pelo familiar.              |
| `relationship` | string | Sim         | Deve ser um valor válido de relacionamento. |

Valores aceitos em `relationship`:

| Valor enviado | Sugestão de label no frontend |
| ------------- | ----------------------------- |
| `filho`       | Filho                         |
| `filha`       | Filha                         |
| `neto`        | Neto                          |
| `neta`        | Neta                          |
| `responsavel` | Responsável                   |
| `outro`       | Outro                         |

## Normalização feita pela API no resgate

Antes de validar, o backend aplica:

- `code`: remove espaços no início e no fim e converte para maiúsculo;
- `relationship`: remove espaços no início e no fim.

Mesmo assim, normalize no frontend para melhorar a experiência:

```js
const payload = {
  code: form.code.trim().toUpperCase(),
  relationship: form.relationship,
};
```

## Exemplo de resgate com fetch

```js
async function redeemResidentAccessCode(form) {
  const token = localStorage.getItem("familyAccessToken");

  if (!token) {
    throw {
      errorType: "VALIDATION_ERROR",
      errors: { token: "Sessão do familiar não encontrada" },
    };
  }

  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/family-members/access-codes/redeem`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        code: form.code.trim().toUpperCase(),
        relationship: form.relationship,
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

## Exemplo de resgate com Axios

```js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export async function redeemResidentAccessCode(form) {
  const token = localStorage.getItem("familyAccessToken");

  if (!token) {
    throw {
      errorType: "VALIDATION_ERROR",
      errors: { token: "Sessão do familiar não encontrada" },
    };
  }

  const { data } = await api.post(
    "/family-members/access-codes/redeem",
    {
      code: form.code.trim().toUpperCase(),
      relationship: form.relationship,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return data;
}
```

## Resposta de sucesso do resgate

Status HTTP:

```http
201 Created
```

Body:

```json
{
  "id": "b0712e02-0ad8-4f90-9a23-d418bdcbdb92",
  "residentId": "4be87bd3-7966-451f-bc3d-76f9edc034f5",
  "familyMemberId": "9f2dddc8-51e2-4a6c-9f74-1d4d08f0c5a1",
  "relationship": "filha",
  "isActive": true,
  "createdAt": "2026-05-07T00:00:00.000Z"
}
```

A resposta não retorna dados sensíveis do familiar, nem dados completos do residente.

## Exibindo sucesso no resgate

Após um resgate bem-sucedido, exiba uma confirmação clara e atualize a área da família conforme o produto.

Exemplo:

```js
try {
  const access = await redeemResidentAccessCode(form);

  setSuccessMessage("Acesso ao residente liberado com sucesso.");
  setFieldErrors({});
  setGlobalError("");
  navigate(`/familia/residentes/${access.residentId}`);
} catch (error) {
  handleRedeemResidentAccessCodeError(error);
}
```

## Erros do resgate

### Erro de validação no resgate

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
    "code": "Código é obrigatório"
  },
  "errorType": "VALIDATION_ERROR"
}
```

Exemplos de erros de validação:

| Campo          | Mensagem possível                                         |
| -------------- | --------------------------------------------------------- |
| `code`         | `Código é obrigatório`                                    |
| `relationship` | `Relacionamento é obrigatório`, `Relacionamento inválido` |
| `token`        | Mensagens de token listadas em rotas protegidas.          |

### Código inexistente

Status HTTP:

```http
400 Bad Request
```

Body:

```json
{
  "success": false,
  "message": "Código de acesso inválido",
  "errorType": "INVALID_ACCESS_CODE"
}
```

### Código inativo

Status HTTP:

```http
400 Bad Request
```

Body:

```json
{
  "success": false,
  "message": "Código de acesso inativo",
  "errorType": "INACTIVE_ACCESS_CODE"
}
```

### Código expirado

Status HTTP:

```http
400 Bad Request
```

Body:

```json
{
  "success": false,
  "message": "Código de acesso expirado",
  "errorType": "EXPIRED_ACCESS_CODE"
}
```

### Código já utilizado

Status HTTP:

```http
400 Bad Request
```

Body:

```json
{
  "success": false,
  "message": "Código de acesso já utilizado",
  "errorType": "USED_ACCESS_CODE"
}
```

### Familiar já vinculado ao residente

Status HTTP:

```http
409 Conflict
```

Body:

```json
{
  "success": false,
  "message": "Familiar já possui acesso a este residente",
  "errorType": "RESIDENT_FAMILY_ACCESS_CONFLICT"
}
```

## Tratamento de erro no formulário de resgate

Erros de `code` e `relationship` devem aparecer junto aos campos. Erros de `token` e erros de regra de negócio devem aparecer como mensagem geral.

Exemplo:

```js
function handleRedeemResidentAccessCodeError(error) {
  if (error.errorType === "VALIDATION_ERROR") {
    if (error.errors?.token) {
      setFieldErrors({});
      setGlobalError(error.errors.token);
      logoutFamilyMember();
      return;
    }

    setFieldErrors(error.errors ?? {});
    setGlobalError("");
    return;
  }

  const knownBusinessErrors = [
    "INVALID_ACCESS_CODE",
    "INACTIVE_ACCESS_CODE",
    "EXPIRED_ACCESS_CODE",
    "USED_ACCESS_CODE",
    "RESIDENT_FAMILY_ACCESS_CONFLICT",
  ];

  if (knownBusinessErrors.includes(error.errorType)) {
    setFieldErrors({});
    setGlobalError(error.message);
    return;
  }

  setFieldErrors({});
  setGlobalError("Não foi possível resgatar o código. Tente novamente.");
}
```

Exemplo de uso completo:

```js
async function handleRedeemSubmit(event) {
  event.preventDefault();
  setIsSubmitting(true);
  setFieldErrors({});
  setGlobalError("");
  setSuccessMessage("");

  try {
    const access = await redeemResidentAccessCode(form);

    setSuccessMessage("Acesso ao residente liberado com sucesso.");
    navigate(`/familia/residentes/${access.residentId}`);
  } catch (error) {
    handleRedeemResidentAccessCodeError(error);
  } finally {
    setIsSubmitting(false);
  }
}
```

## Checklist para a tela de resgate

- Exigir login do familiar antes de exibir a tela.
- Enviar `Authorization: Bearer <familyAccessToken>`.
- Não enviar `familyMemberId` no body.
- Não enviar `residentId` no body.
- Converter o código para maiúsculo antes do envio.
- Exibir `code` e `relationship` como erros de campo quando vierem em `errors`.
- Exibir erros de token e regra de negócio como mensagem geral.
- Desabilitar o botão enquanto a requisição estiver em andamento.
- Após sucesso, mostrar confirmação e atualizar a lista de residentes vinculados.

## Modelo de estado sugerido para resgate

```js
const initialRedeemForm = {
  code: "",
  relationship: "",
};
```

## Residentes vinculados ao familiar

Depois que o familiar resgata um código com sucesso, ele pode visualizar os residentes aos quais possui acesso.

## Endpoint de listagem de residentes vinculados

```http
GET /family-members/residents
Authorization: Bearer <familyAccessToken>
```

Exemplo de base URL em ambiente local:

```txt
http://localhost:<PORT>/family-members/residents
```

## Autenticação da listagem

Este endpoint exige token de familiar. Use o token salvo após o login em `POST /auth/family`.

Não use token de usuário interno. Essa rota usa `familyAuthMiddleware`.

## Exemplo de listagem com fetch

```js
async function listFamilyResidents() {
  const token = localStorage.getItem("familyAccessToken");

  if (!token) {
    throw {
      errorType: "VALIDATION_ERROR",
      errors: { token: "Sessão do familiar não encontrada" },
    };
  }

  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/family-members/residents`,
    {
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

## Exemplo de listagem com Axios

```js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export async function listFamilyResidents() {
  const token = localStorage.getItem("familyAccessToken");

  if (!token) {
    throw {
      errorType: "VALIDATION_ERROR",
      errors: { token: "Sessão do familiar não encontrada" },
    };
  }

  const { data } = await api.get("/family-members/residents", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return data;
}
```

## Resposta de sucesso da listagem

Status HTTP:

```http
200 OK
```

Body:

```json
[
  {
    "id": "4be87bd3-7966-451f-bc3d-76f9edc034f5",
    "fullName": "Antônio Oliveira",
    "birthDate": "1942-04-12T00:00:00.000Z",
    "gender": "male",
    "bloodType": "O+",
    "admissionDate": "2026-01-10T00:00:00.000Z",
    "status": "active",
    "createdAt": "2026-01-10T00:00:00.000Z",
    "access": {
      "id": "b0712e02-0ad8-4f90-9a23-d418bdcbdb92",
      "relationship": "filha",
      "createdAt": "2026-05-07T00:00:00.000Z"
    }
  }
]
```

Se o familiar não tiver vínculos ativos, a API retorna uma lista vazia:

```json
[]
```

A listagem não retorna `cpf`, `companyId` ou dados sensíveis do familiar.

## Exibindo a listagem no frontend

Use a resposta para montar a tela inicial da área da família, com cards ou linhas de residentes acessíveis.

Exemplo:

```js
try {
  const residents = await listFamilyResidents();

  setResidents(residents);
  setGlobalError("");
} catch (error) {
  handleFamilyResidentsError(error);
}
```

Se `residents.length === 0`, mostre um estado vazio e ofereça o fluxo para resgatar um código.

## Endpoint de detalhes de um residente vinculado

```http
GET /family-members/residents/:residentId
Authorization: Bearer <familyAccessToken>
```

Exemplo de base URL em ambiente local:

```txt
http://localhost:<PORT>/family-members/residents/<residentId>
```

## Autenticação dos detalhes

Este endpoint exige token de familiar.

O acesso ao residente depende apenas de um vínculo ativo em `ResidentFamilyAccess` entre:

- `familyMemberId` do JWT;
- `residentId` da URL.

Não envie `familyMemberId` no body, params ou query. O único parâmetro da rota de detalhes é `residentId`.

## Exemplo de detalhes com fetch

```js
async function getFamilyResidentDetails(residentId) {
  const token = localStorage.getItem("familyAccessToken");

  if (!token) {
    throw {
      errorType: "VALIDATION_ERROR",
      errors: { token: "Sessão do familiar não encontrada" },
    };
  }

  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/family-members/residents/${residentId}`,
    {
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

## Exemplo de detalhes com Axios

```js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export async function getFamilyResidentDetails(residentId) {
  const token = localStorage.getItem("familyAccessToken");

  if (!token) {
    throw {
      errorType: "VALIDATION_ERROR",
      errors: { token: "Sessão do familiar não encontrada" },
    };
  }

  const { data } = await api.get(`/family-members/residents/${residentId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return data;
}
```

## Resposta de sucesso dos detalhes

Status HTTP:

```http
200 OK
```

Body:

```json
{
  "id": "4be87bd3-7966-451f-bc3d-76f9edc034f5",
  "fullName": "Antônio Oliveira",
  "birthDate": "1942-04-12T00:00:00.000Z",
  "gender": "male",
  "bloodType": "O+",
  "admissionDate": "2026-01-10T00:00:00.000Z",
  "status": "active",
  "createdAt": "2026-01-10T00:00:00.000Z",
  "updatedAt": "2026-05-07T00:00:00.000Z",
  "access": {
    "id": "b0712e02-0ad8-4f90-9a23-d418bdcbdb92",
    "relationship": "filha",
    "createdAt": "2026-05-07T00:00:00.000Z"
  }
}
```

Os detalhes também não retornam `cpf`, `companyId` ou dados sensíveis do familiar.

## Erros das rotas de residentes vinculados

### Token ausente ou inválido

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

As mensagens possíveis para `token` são as mesmas descritas na seção de rotas protegidas.

### residentId inválido

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

Esse erro vale apenas para `GET /family-members/residents/:residentId`.

### Familiar sem acesso ao residente

Status HTTP:

```http
403 Forbidden
```

Body:

```json
{
  "success": false,
  "message": "Você não possui acesso a este residente",
  "errorType": "RESIDENT_ACCESS_FORBIDDEN"
}
```

Esse erro acontece quando não existe vínculo ativo em `ResidentFamilyAccess` para o familiar autenticado e o residente informado.

## Tratamento de erro para residentes vinculados

Exemplo:

```js
function handleFamilyResidentsError(error) {
  if (error.errorType === "VALIDATION_ERROR") {
    if (error.errors?.token) {
      setGlobalError(error.errors.token);
      logoutFamilyMember();
      return;
    }

    setFieldErrors(error.errors ?? {});
    setGlobalError("");
    return;
  }

  if (error.errorType === "RESIDENT_ACCESS_FORBIDDEN") {
    setFieldErrors({});
    setGlobalError(error.message);
    navigate("/familia/residentes");
    return;
  }

  setFieldErrors({});
  setGlobalError("Não foi possível carregar os residentes. Tente novamente.");
}
```

## Checklist para a tela de residentes vinculados

- Exigir login do familiar antes de carregar a tela.
- Enviar `Authorization: Bearer <familyAccessToken>`.
- Não enviar `familyMemberId`.
- Para listagem, chamar `GET /family-members/residents`.
- Para detalhes, chamar `GET /family-members/residents/:residentId`.
- Tratar `[]` como estado vazio.
- Tratar `RESIDENT_ACCESS_FORBIDDEN` como acesso negado e voltar para a listagem.
- Não depender de `companyId` no frontend para autorizar familiar.

## Observações importantes

- O login do familiar não deve usar `POST /auth`, pois esse endpoint é reservado para usuários internos autenticados com CPF.

- O CPF de exemplos como `12345678900` pode falhar se a API validar CPF real. Use CPFs válidos em testes.

- O vínculo com residente deve ser feito apenas por `POST /family-members/access-codes/redeem`, sempre com token de familiar.

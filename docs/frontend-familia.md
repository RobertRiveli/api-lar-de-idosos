# Cadastro de familiares - Guia para o frontend

Este documento descreve como implementar a tela de cadastro de familiares e consumir a API responsável por criar uma conta de familiar.

## Visão geral

Nesta etapa ainda não possui login, vínculo com residente ou acesso aos dados do idoso.

O backend executa o cadastro com o seguinte fluxo:

1. sanitiza os dados recebidos;
2. valida o payload com Zod;
3. verifica se já existe familiar com o mesmo e-mail;
4. verifica se já existe familiar com o mesmo CPF;
5. criptografa a senha com `bcrypt`;
6. cria o familiar;
7. retorna os dados públicos do familiar criado.

## Endpoint

```http
POST /family-members
Content-Type: application/json
```

Exemplo de base URL em ambiente local:

```txt
http://localhost:<PORT>/family-members
```

O valor de `PORT` vem da variável de ambiente `PORT` usada pelo backend.

## Autenticação

Este endpoint não exige token de autenticação. Neste primeiro momento, ele é público porque serve apenas para o familiar criar a própria conta.

O fluxo de login do familiar, código de acesso e vínculo com residente será implementado em etapas futuras.

## Payload

```json
{
  "fullName": "Maria Oliveira",
  "email": "maria@email.com",
  "phone": "85999999999",
  "cpf": "52998224725",
  "password": "Senha123@"
}
```

## Campos

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

Como ainda não existe login do familiar nesta etapa, uma opção simples é exibir uma confirmação e orientar que o acesso será configurado depois.

Exemplo:

```js
try {
  const familyMember = await registerFamilyMember(form);

  setSuccessMessage(`Cadastro criado para ${familyMember.fullName}.`);
  setFieldErrors({});
  setGlobalError("");
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
- Não tentar autenticar o familiar após o cadastro, pois o login ainda não foi implementado.

## Modelo de estado sugerido

```js
const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  cpf: "",
  password: "",
};
```

## Observações importantes

- Este cadastro não cria registro na tabela `User`.
- Este cadastro não vincula o familiar a um residente.
- Este cadastro não libera visualização de dados do residente.
- O CPF de exemplos como `12345678900` pode falhar se a API validar CPF real. Use CPFs válidos em testes automatizados e ambientes de desenvolvimento.

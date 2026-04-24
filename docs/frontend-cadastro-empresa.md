# Cadastro de empresa - Guia para o frontend

Este documento descreve como implementar a tela de cadastro de empresa e consumir a API responsável por criar uma empresa junto com o usuário administrador inicial.

## Visão geral

Ao cadastrar uma empresa, o frontend deve enviar os dados da empresa e os dados do usuário administrador no mesmo payload.

O backend executa o cadastro em uma transação:

1. valida os dados da empresa;
2. valida os dados do administrador;
3. verifica conflitos de `email`, `taxId` (CNPJ) e `legalName` da empresa;
4. cria a empresa;
5. cria o usuário administrador vinculado a essa empresa;
6. retorna a empresa criada.

## Endpoint

```http
POST /companies
Content-Type: application/json
```

Exemplo de base URL em ambiente local:

```txt
http://localhost:<PORT>/companies
```

O valor de `PORT` vem da variável de ambiente `PORT` usada pelo backend.

## Autenticação

Este endpoint não exige token de autenticação, pois é usado para criar a primeira empresa e o primeiro usuário administrador.

## Payload

```json
{
  "legalName": "Empresa Exemplo LTDA",
  "tradeName": "Empresa Exemplo",
  "taxId": "11222333000181",
  "email": "contato@empresa.com",
  "phone": "85999998888",
  "admin": {
    "fullName": "Maria Silva",
    "email": "maria@empresa.com",
    "phone": "85988887777",
    "cpf": "12345678909",
    "password": "senha1234"
  }
}
```

## Campos da empresa

| Campo       | Tipo   | Obrigatorio | Regra                                                        |
| ----------- | ------ | ----------- | ------------------------------------------------------------ |
| `legalName` | string | Sim         | Razao social. Deve ser texto e ter no maximo 160 caracteres. |
| `tradeName` | string | Sim         | Nome fantasia. Deve ter pelo menos 2 caracteres.             |
| `taxId`     | string | Sim         | CNPJ com 14 digitos numericos e CNPJ valido.                 |
| `email`     | string | Sim         | E-mail valido.                                               |
| `phone`     | string | Sim         | Telefone brasileiro valido.                                  |

## Campos do administrador

| Campo            | Tipo   | Obrigatorio | Regra                                 |
| ---------------- | ------ | ----------- | ------------------------------------- |
| `admin.fullName` | string | Sim         | Nome completo com 3 a 160 caracteres. |
| `admin.email`    | string | Sim         | E-mail valido.                        |
| `admin.phone`    | string | Sim         | Telefone brasileiro valido.           |
| `admin.cpf`      | string | Sim         | CPF com 11 digitos numericos.         |
| `admin.password` | string | Sim         | Senha com 8 a 128 caracteres.         |

## Normalizacao recomendada no frontend

O backend remove caracteres nao numericos de `taxId`, `phone` e `admin.phone`. Mesmo assim, o frontend deve enviar documentos e telefones apenas com numeros para evitar inconsistencias.

Exemplo de normalizacao:

```js
const onlyNumbers = (value) => value.replace(/\D/g, "");

const payload = {
  legalName: form.legalName.trim(),
  tradeName: form.tradeName.trim(),
  taxId: onlyNumbers(form.taxId),
  email: form.email.trim().toLowerCase(),
  phone: onlyNumbers(form.phone),
  admin: {
    fullName: form.adminFullName.trim(),
    email: form.adminEmail.trim().toLowerCase(),
    phone: onlyNumbers(form.adminPhone),
    cpf: onlyNumbers(form.adminCpf),
    password: form.adminPassword,
  },
};
```

## Exemplo com fetch

```js
async function registerCompany(form) {
  const onlyNumbers = (value) => value.replace(/\D/g, "");

  const response = await fetch(`${import.meta.env.VITE_API_URL}/companies`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      legalName: form.legalName.trim(),
      tradeName: form.tradeName.trim(),
      taxId: onlyNumbers(form.taxId),
      email: form.email.trim().toLowerCase(),
      phone: onlyNumbers(form.phone),
      admin: {
        fullName: form.adminFullName.trim(),
        email: form.adminEmail.trim().toLowerCase(),
        phone: onlyNumbers(form.adminPhone),
        cpf: onlyNumbers(form.adminCpf),
        password: form.adminPassword,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return data.company;
}
```

## Exemplo com Axios

```js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export async function registerCompany(form) {
  const onlyNumbers = (value) => value.replace(/\D/g, "");

  const { data } = await api.post("/companies", {
    legalName: form.legalName.trim(),
    tradeName: form.tradeName.trim(),
    taxId: onlyNumbers(form.taxId),
    email: form.email.trim().toLowerCase(),
    phone: onlyNumbers(form.phone),
    admin: {
      fullName: form.adminFullName.trim(),
      email: form.adminEmail.trim().toLowerCase(),
      phone: onlyNumbers(form.adminPhone),
      cpf: onlyNumbers(form.adminCpf),
      password: form.adminPassword,
    },
  });

  return data.company;
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
  "success": true,
  "company": {
    "id": "9f2dddc8-51e2-4a6c-9f74-1d4d08f0c5a1",
    "legalName": "Empresa Exemplo LTDA",
    "tradeName": "Empresa Exemplo",
    "taxId": "11222333000181",
    "email": "contato@empresa.com",
    "phone": "85999998888",
    "isActive": true,
    "createdAt": "2026-04-24T10:30:00.000Z",
    "updatedAt": "2026-04-24T10:30:00.000Z"
  }
}
```

O backend nao retorna os dados do administrador criado nessa resposta.

## Respostas de erro

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
    "taxId": "CNPJ inválido"
  },
  "errorType": "VALIDATION_ERROR"
}
```

Exemplos de erros de validacao:

| Campo       | Mensagem possivel                                                                     |
| ----------- | ------------------------------------------------------------------------------------- |
| `taxId`     | `O CNPJ deve ter 14 caracteres`, `O CNPJ deve conter apenas números`, `CNPJ inválido` |
| `email`     | `E-mail inválido`                                                                     |
| `phone`     | `Número inválido`, `Telefone inválido`                                                |
| `tradeName` | `O nome comercial é obrigatório`                                                      |
| `fullName`  | `O nome completo deve ter pelo menos 3 caracteres`                                    |
| `cpf`       | `O CPF deve ter 11 caracteres`, `O CPF deve conter apenas números`                    |
| `password`  | `A senha deve ter mais de 8 caracteres`, `A senha deve ter no máximo 128 caracteres`  |

### Erro de conflito

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
    "email": "Email já cadastrado"
  },
  "errorType": "CONFLICT_ERROR"
}
```

Conflitos verificados na empresa:

| Campo       | Mensagem                     |
| ----------- | ---------------------------- |
| `email`     | `Email já cadastrado`        |
| `taxId`     | `CNPj já cadastrado`         |
| `legalName` | `Razão Social já cadastrada` |

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

O campo `errors` sempre vem como um objeto com o nome do campo e a mensagem.

Exemplo:

```js
try {
  await registerCompany(form);
  navigate("/login");
} catch (error) {
  if (
    error.errorType === "VALIDATION_ERROR" ||
    error.errorType === "CONFLICT_ERROR"
  ) {
    setFieldErrors(error.errors);
    return;
  }

  setGlobalError("Nao foi possivel cadastrar a empresa. Tente novamente.");
}
```

Para campos do administrador, a API pode retornar o nome simples do campo, como `fullName`, `email`, `phone`, `cpf` ou `password`, porque a validacao do admin acontece separada internamente. Caso exista colisao visual com os campos da empresa, o frontend deve mapear esses erros para o grupo do administrador conforme o contexto da submissao.

Exemplo de mapeamento para o estado do formulario:

```js
const apiFieldToFormField = {
  legalName: "legalName",
  tradeName: "tradeName",
  taxId: "taxId",
  email: "email",
  phone: "phone",
  fullName: "adminFullName",
  cpf: "adminCpf",
  password: "adminPassword",
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

- Aplicar mascara visual para CNPJ, CPF e telefone, mas remover a mascara antes do envio.
- Converter e-mails para minusculo antes do envio.
- Remover espacos no inicio e fim de campos de texto.
- Validar senha com minimo de 8 caracteres antes de chamar a API.
- Exibir erros de campo usando o objeto `errors` retornado pela API.
- Desabilitar o botao de envio enquanto a requisicao estiver em andamento.
- Em caso de sucesso, redirecionar para login ou tela inicial definida pelo produto.

## Modelo de estado sugerido

```js
const initialForm = {
  legalName: "",
  tradeName: "",
  taxId: "",
  email: "",
  phone: "",
  adminFullName: "",
  adminEmail: "",
  adminPhone: "",
  adminCpf: "",
  adminPassword: "",
};
```

# Unidades de medida - Guia para o frontend

Este documento descreve como implementar o consumo da API de unidades de medida (`measurement-units`) no frontend.

## Visao geral

As unidades de medida sao dados de apoio usados para montar campos de selecao em telas que precisam de uma unidade padronizada, como medicamentos, dosagens, administracao ou outras funcionalidades que referenciem quantidade.

Funcionalidade disponivel atualmente:

- Listar unidades de medida ativas.

A API ainda nao possui endpoints publicos para cadastrar, editar, detalhar ou remover unidades de medida pelo frontend.

## Base da API

Exemplo em ambiente local:

```txt
http://localhost:<PORT>
```

O valor de `PORT` vem da variavel de ambiente `PORT` usada pelo backend.

## Autenticacao

A rota de unidades de medida exige token JWT.

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

## Modelo de unidade de medida

Campos retornados pela API:

| Campo          | Tipo    | Descricao                                                   |
| -------------- | ------- | ----------------------------------------------------------- |
| `id`           | string  | ID da unidade de medida.                                    |
| `name`         | string  | Nome exibivel da unidade, por exemplo `Comprimido`.         |
| `abbreviation` | string  | Abreviacao ou valor curto, por exemplo `comp`, `cap` ou `g`. |
| `category`     | string  | Categoria da unidade, por exemplo `unidade` ou `massa`.     |
| `isActive`     | boolean | Indica se a unidade esta ativa. A listagem retorna ativas.   |
| `createdAt`    | string  | Data de criacao do registro.                                |
| `updatedAt`    | string  | Data da ultima atualizacao do registro.                     |

Exemplos de unidades cadastradas pelo seed atual:

| Nome        | Abreviacao | Categoria |
| ----------- | ---------- | --------- |
| Comprimido  | `comp`     | `unidade` |
| Capsula     | `cap`      | `unidade` |
| Grama       | `g`        | `massa`   |
| Gota        | `gota`     | `unidade` |

## Listar unidades de medida

Use esta rota para buscar as opcoes que serao exibidas no frontend.

### Endpoint

```http
GET /measurement-units
Authorization: Bearer <token>
```

### Permissao

Qualquer usuario autenticado pode listar as unidades de medida.

### Query params

Esta rota nao recebe filtros, paginacao ou parametros de busca atualmente.

### Ordenacao

O backend retorna somente unidades ativas (`isActive: true`) e ordena a lista por:

1. `category` em ordem crescente;
2. `name` em ordem crescente.

### Exemplo com fetch

```js
export async function listMeasurementUnits() {
  const token = localStorage.getItem("accessToken");

  const response = await fetch(
    `${import.meta.env.VITE_API_URL}/measurement-units`,
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

  return data.data;
}
```

### Exemplo com Axios

```js
export async function listMeasurementUnits() {
  const { data } = await api.get("/measurement-units");

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
  "data": [
    {
      "id": "9f2dddc8-51e2-4a6c-9f74-1d4d08f0c5a1",
      "name": "Grama",
      "abbreviation": "g",
      "category": "massa",
      "isActive": true,
      "createdAt": "2026-04-24T10:30:00.000Z",
      "updatedAt": "2026-04-24T10:30:00.000Z"
    },
    {
      "id": "3ff66b0b-61dc-44ef-a2d1-7018e141f3dc",
      "name": "Comprimido",
      "abbreviation": "comp",
      "category": "unidade",
      "isActive": true,
      "createdAt": "2026-04-24T10:30:00.000Z",
      "updatedAt": "2026-04-24T10:30:00.000Z"
    }
  ]
}
```

## Uso recomendado no frontend

Carregue as unidades uma vez ao abrir a tela que precisa delas. Como elas sao dados de apoio e mudam pouco, o frontend pode manter a lista em cache local de estado, store global ou cache da biblioteca de requisicoes.

Exemplo de normalizacao para um select:

```js
const options = measurementUnits.map((unit) => ({
  value: unit.id,
  label: `${unit.name} (${unit.abbreviation})`,
  category: unit.category,
}));
```

Se a interface precisar separar por categoria:

```js
const unitsByCategory = measurementUnits.reduce((acc, unit) => {
  if (!acc[unit.category]) {
    acc[unit.category] = [];
  }

  acc[unit.category].push(unit);

  return acc;
}, {});
```

Sugestao de exibicao:

| Uso na interface       | Campo recomendado                         |
| ---------------------- | ----------------------------------------- |
| Valor salvo em formularios | `id`                                  |
| Texto visivel no select    | `name`                                |
| Texto curto em tabelas     | `abbreviation`                        |
| Agrupamento                | `category`                            |

## Integracao com formularios

Quando uma tela precisar que o usuario escolha uma unidade de medida, salve o `id` selecionado no estado do formulario.

Exemplo:

```js
const payload = {
  medicationId: form.medicationId,
  measurementUnitId: form.measurementUnitId,
  quantity: Number(form.quantity),
};
```

Antes de enviar um payload para outra feature, confira no documento dessa feature qual nome de campo ela espera. A listagem de unidades fornece o `id`, mas o nome do campo no payload depende do endpoint consumidor.

## Tratamento de loading e erro

Como a lista e necessaria para montar controles de selecao, a recomendacao e bloquear o select enquanto a requisicao estiver carregando.

Exemplo:

```jsx
<select
  name="measurementUnitId"
  value={form.measurementUnitId}
  onChange={handleChange}
  disabled={isLoadingMeasurementUnits}
>
  <option value="">Selecione uma unidade</option>

  {measurementUnits.map((unit) => (
    <option key={unit.id} value={unit.id}>
      {unit.name} ({unit.abbreviation})
    </option>
  ))}
</select>
```

Se a API retornar erro de autenticacao ou token invalido, redirecione o usuario para o login ou aplique o fluxo padrao de encerramento de sessao do frontend.

## Respostas de erro

### Token nao fornecido

Status HTTP:

```http
400 Bad Request
```

Body:

```json
{
  "success": false,
  "message": "Dados Inválidos",
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
  "message": "Dados Inválidos",
  "errors": {
    "token": "Formato de token inválido"
  },
  "errorType": "VALIDATION_ERROR"
}
```

### Token expirado ou invalido

Status HTTP:

```http
400 Bad Request
```

Body:

```json
{
  "success": false,
  "message": "Dados Inválidos",
  "errors": {
    "token": "Token expirado"
  },
  "errorType": "VALIDATION_ERROR"
}
```

O campo `errors.token` tambem pode retornar `Token inválido` ou `Token ainda não está ativo`, dependendo do problema encontrado na validacao do JWT.

## Checklist para implementacao

- Criar uma funcao de servico para `GET /measurement-units`.
- Garantir envio do header `Authorization: Bearer <token>`.
- Usar `data.data` como array de unidades.
- Usar `id` como valor selecionado em formularios.
- Exibir `name` e, quando util, `abbreviation` no label.
- Tratar estado de carregamento antes de renderizar selects dependentes.
- Tratar erro de token expirado ou invalido com o fluxo de login do frontend.

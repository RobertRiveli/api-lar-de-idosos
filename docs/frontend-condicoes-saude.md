## Condições de Saúde - Guia para FrontEnd

Este documento descreve como consumir a API responsável pelas condiçẽos de saúde.

## Visão Geral

As rotas de condições de saúde são protegidas por token JWT.

Funcionalidades disponíveis:

- listar todas as condições de saúde do sistema;

## Autenticação

O token deve ser o valor retornado no login em:

```txt
data.token
```

Formato obrigatorio do header:

```http
Authorization: Bearer jwt.token.aqui
```

## Listar Condições

Use esta funcao para montar uma listagem geral das condições de saúde cadastradas no sistema.

### Endpoint

```http
GET /health-conditions
Authorization: Bearer <token>
```

### Exemplo com Axios

```js
export async function listHealthConditions() {
  const { data } = await api.get("/health-conditions");

  return data.conditions;
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
  "message": "Condições de saúde listadas com sucesso.",
  "conditions": [
    {
      "id": "37f4dc26-aec0-4693-be24-ab8ae67fbc7d",
      "name": "Alergia alimentar",
      "category": "Alergia"
    },
    {
      "id": "287c5ffb-cf58-44a4-8d6b-a7fbf56dcb8f",
      "name": "Alergia medicamentosa",
      "category": "Alergia"
    },
    {
      "id": "fe690a94-b9a2-44d9-8571-2625e8f069f1",
      "name": "Alzheimer",
      "category": "Neurológica"
    }
  ]
}
```

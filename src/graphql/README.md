# Rainbow GraphQL Clients

Here, you will find our GraphQL clients & query/mutation definitions!

## Adding a new query

- If you are adding a new query to an existing GraphQL client, [follow these steps](#existing-graphql-client).
- If you want to create a new GraphQL Client to consume another API, [follow these steps](#adding-a-graphql-client).

### Existing GraphQL Client

If you wish to add a new query to an existing GraphQL Client (an already existent `queries/*.graphql` file), follow these steps:

#### 1. Add the query/mutation to the `.graphql` file:

```diff
// src/graphql/queries/ens.graphql

query getRegistration($id: ID!) {
  registration(id: $id) {
    id
    registrationDate
    expiryDate
    registrant {
      id
    }
  }
}

+query getDomain($id: ID!) {
+  domain(id: $id) {
+    id
+    name
+  }
+}
```

#### 2. Run the codegen

Run the codegen tool to generate types & a fetcher for your newly defined query.

Ensure you are in the root directory of the `rainbow` repository.

```
> yarn graphql-codegen
```

#### 3. Consume!

```tsx
import { ensClient } from '@/graphql';

function fetchDomain(id: string) {
  return ensClient.getDomain({ id });
}
```

### Adding a GraphQL Client

If you wish to add a new query that involves interacting with a GraphQL API that is not already set up here, follow these steps:

#### 1. Create a new `.graphql` file with your query:

```diff
// src/graphql/queries/example.graphql

+query getUsers {
+  id
+  firstName
+  lastName
+}
```

#### 2. Add the `.graphql` file and remote schema to `config.js`:

```diff
exports.config = {
  ens: {
    schema: { url: 'https://api.thegraph.com/subgraphs/name/ensdomains/ens', method: 'POST' },
    document: './queries/ens.graphql',
  },
  metadata: {
    schema: { url: 'https://metadata.p.rainbow.me/v1/graph', method: 'GET' },
    document: './queries/metadata.graphql',
  },
+ example: {
+   schema: { url: 'https://example.com/graphql' },
+   document: './queries/example.graphql',
+ },
};
```

#### 3. Run the codegen

Run the codegen tool to generate types & a fetcher for your newly defined query.

Ensure you are in the root directory of the `rainbow` repository.

```
> yarn graphql-codegen
```

#### 4. Create a new client in `index.ts`:

```diff
import { config } from './config';
import { getFetchRequester } from './utils/getFetchRequester';
import { getSdk as getEnsSdk } from './__generated__/ens';
import { getSdk as getMetadataSdk } from './__generated__/metadata';
+ import { getSdk as getExampleSdk } from './__generated__/example';

export const ensClient = getEnsSdk(getFetchRequester(config.ens.schema.url));
export const metadataClient = getMetadataSdk(
  getFetchRequester(config.metadata.schema.url)
);
+ export const exampleClient = getEnsSdk(getFetchRequester(config.example.schema.url));
```

#### 5. Consume!

```tsx
import { exampleClient } from '@/graphql';

function fetchUsers() {
  return exampleClient.getUsers();
}
```

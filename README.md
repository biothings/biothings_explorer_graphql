# Biothings Explorer GraphQL
[![npm](https://img.shields.io/npm/v/biothings-explorer-graphql)](https://www.npmjs.com/package/biothings-explorer-graphql) [![Build Status](https://travis-ci.com/ericz1803/biothings_explorer_graphql.svg?branch=master)](https://travis-ci.com/ericz1803/biothings_explorer_graphql) [![Coverage Status](https://coveralls.io/repos/github/ericz1803/biothings_explorer_graphql/badge.svg?branch=master)](https://coveralls.io/github/ericz1803/biothings_explorer_graphql?branch=master)  
GraphQL app for BioThings Explorer

## Example
See [`example/`](example/) for a complete usage example.

## Integrate into existing Express server (recommended)
### Install
1. `npm install biothings-explorer-graphql graphql`
2. `npm install express` (ignore this step if express is already installed)

### Integrate Into Server
Add the following lines to your express server. (Wrap everything in an `async` function if top level `await` is not available.)  
By default, it will be served on the `/graphql` path.

```js
const getServer = require("biothings-explorer-graphql");

const server = await getServer();
server.applyMiddleware({ app });
```

To serve it on a different path, use
```js
server.applyMiddleware({ app, path: "/your-path" });
```

To pass other parameters to [ApolloServer](https://www.apollographql.com/docs/apollo-server/api/apollo-server/#apolloserver), pass a config object to the `getServer` function. (Refer to [documentation](https://www.apollographql.com/docs/apollo-server/api/apollo-server/#apolloserver) for other options)

See [`example/`](example/) for an example using more advanced options.

```js
const config = {
    //enable introspection and playground in production 
    //(these options will be injected into the ApolloServer constructor after the `typeDefs` and `resolvers` are automatically passed in)
    introspection: true,
    playground: true,
};
const server = getServer(config);
```

## Run as a Vanilla Standalone Server
### Install
1. `git clone https://github.com/ericz1803/biothings_explorer_graphql.git`
2. `cd biothings_explorer_graphql/`
3. `npm install`
4. `npm install graphql express`

### Start Server
`npm start`


## Run Tests
`npm run test`

# Biothings Explorer GraphQL
[![npm](https://img.shields.io/npm/v/biothings-explorer-graphql)](https://www.npmjs.com/package/biothings-explorer-graphql) [![Build Status](https://travis-ci.com/ericz1803/biothings_explorer_graphql.svg?branch=master)](https://travis-ci.com/ericz1803/biothings_explorer_graphql) [![Coverage Status](https://coveralls.io/repos/github/ericz1803/biothings_explorer_graphql/badge.svg?branch=master)](https://coveralls.io/github/ericz1803/biothings_explorer_graphql?branch=master)  
GraphQL app for BioThings Explorer

## Run as a Standalone Server
### Install
1. `git clone https://github.com/ericz1803/biothings_explorer_graphql.git`
2. `cd biothings_explorer_graphql/`
3. `npm install`
4. `npm install express`

### Start Server
`npm run serve`

## Integrate into existing Express server
### Install
1. `npm install biothings-explorer-graphql`
2. `npm install express` (ignore this step if express is already installed)

### Integrate Into Server
Add the following lines to your express server. (Wrap everything in an `async` function if top level `await` is not available.)  
By default, it will be served on the `/graphql` path.
```js
const server = await require("biothings-explorer-graphql");
server.applyMiddleware({ app });
```
To serve it on a different path, use
```js
server.applyMiddleware({ app, path: "/your-path" });
```

## Run Tests
`npm run test`
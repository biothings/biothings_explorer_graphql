const { ApolloServer, gql } = require("apollo-server");
const kg = require("@biothings-explorer/smartapi-kg");
const { getPredicates, getObjectTypes } = require("./utils");
const getSchema = require("./schema");
const getResolvers = require("./resolvers");

(async () => {
  try {
    let meta_kg = new kg();
    await meta_kg.constructMetaKG();

    let predicates = getPredicates(meta_kg.ops);
    let object_types = getObjectTypes(meta_kg.ops);

    const typeDefs = gql`
      ${getSchema(predicates, object_types)}
    `;

    const resolvers = getResolvers(meta_kg, predicates, object_types);

    const server = new ApolloServer({ typeDefs, resolvers });

    server.listen().then(({ url }) => {
      console.log(`🚀  Server ready at ${url}`);
    });
  } catch (e) {
    console.log(e);
  }
})();

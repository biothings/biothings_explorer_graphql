const { ApolloServer, gql } = require("apollo-server");
const kg = require("@biothings-explorer/smartapi-kg");
const { getPredicates, getObjectTypes } = require("./utils");
const getSchema = require("./schema");

(async () => {
  try {
    let meta_kg = new kg();
    await meta_kg.constructMetaKG();

    let predicates = getPredicates(meta_kg.ops);
    let object_types = getObjectTypes(meta_kg.ops);

    const typeDefs = gql`
      ${getSchema(predicates, object_types)}
    `;

    const testData = [
      {
        id: 1,
        name: "Disease",
        treats: [],
        related_to: [2],
      },
      {
        id: 2,
        name: "Disease2",
        treats: [],
        related_to: [1],
      },
      {
        id: 3,
        name: "Drug1",
        treats: [1],
        related_to: [1, 4],
      },
      {
        id: 4,
        name: "Drug2",
        treats: [2],
        related_to: [2, 3],
      },
    ];

    const resolvers = {
    };

    const server = new ApolloServer({ typeDefs, resolvers });

    server.listen().then(({ url }) => {
      console.log(`🚀  Server ready at ${url}`);
    });
  } catch (e) {
    // Deal with the fact the chain failed
    console.log(e);
  }
})();

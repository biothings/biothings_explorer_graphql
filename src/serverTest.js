const { ApolloServer, gql } = require("apollo-server");
const getSchema = require("./schema");

var schema = (async () => {
  try {
    return await getSchema();
  } catch (e) {
    // Deal with the fact the chain failed
    console.log(e);
  }
})();

console.log(schema);

const typeDefs = gql`
  type ObjectType {
    id: String
    name: String
    treats: [ObjectType]
    related_to: [ObjectType]
    publication: String
  }

  type Query {
    obj(id: Int): ObjectType
  }
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
  Query: {
    obj(parent, args, context, info) {
      return testData.find((entry) => entry.id == args.id);
    },
  },
  ObjectType: {
    treats(parent) {
      return parent.treats.map((id) =>
        testData.find((entry) => entry.id == id)
      );
    },
    related_to(parent) {
      return parent.related_to.map((id) =>
        testData.find((entry) => entry.id == id)
      );
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

module.exports = server;

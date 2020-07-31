const { ApolloServer, gql } = require("apollo-server-express");
const kg = require("@biothings-explorer/smartapi-kg");

const { getObjectTypes, getEdges } = require("./utils");
const getSchema = require("./schema");
const getResolvers = require("./resolvers");

/**
 * get server
 * @param {Object} options Options to pass into the apollo server
 * @returns {ApolloServer} apollo server
 */
async function getServer(options) {
  let server_options = options || {};

  try {
    let meta_kg = new kg();
    await meta_kg.constructMetaKG();

    let object_types = getObjectTypes(meta_kg.ops);
    let edges = getEdges(meta_kg.ops);
    
    const typeDefs = gql(getSchema(object_types, edges));

    const resolvers = getResolvers(meta_kg, edges);

    const server = new ApolloServer({
      typeDefs, 
      resolvers,
      ...server_options
    });

    return server;
  } catch (e) {
    console.log("Error configuring server.");
    console.log(e);
  }
}

module.exports = getServer;

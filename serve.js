const express = require("express");
const getServer = require("./src/server");

(async () => {
  const app = express();
  const server = await getServer();
  server.applyMiddleware({ app });

  app.listen({ port: 4000 }, () =>
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
  );
})();

const express = require("express");

(async () => {
  const app = express();
  const server = await require("./src/server");
  server.applyMiddleware({ app });

  app.listen({ port: 4000 }, () =>
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
  );
})();

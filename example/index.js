const express = require("express");
const getServer = require("biothings-explorer-graphql");
const depthLimit = require("graphql-depth-limit");
const { createLogger, format, transports } = require('winston');

(async () => {
  const app = express();

  const consoleFormat = format.printf(info => `${info.timestamp} [${info.level}]: ${info.message}`);
  const logger = createLogger({
    format: format.combine(
      format.timestamp(),
      format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] })
    ),
    transports: [
      //print basic information to console
      new transports.Console({
        format: format.combine(
          format.colorize(),
          consoleFormat
        )
      }),
      //log qll queries to combined.log
      new transports.File({
        filename: 'combined.log',
        level: 'info',
        format: format.combine(
          format.json()
        ),
      }),
      //log queries that resulted in errors to errors.log
      new transports.File({
        filename: 'errors.log',
        level: 'error',
        format: format.combine(
          format.json()
        ),
      })
    ],
    exitOnError: false
  });

  //make a plugin that records the query, time elapsed, and errors (if any)
  //based on https://stackoverflow.com/questions/59988906/how-do-i-write-a-apollo-server-plugin-to-log-the-request-and-its-duration/59989442#59989442
  //visit https://www.apollographql.com/docs/apollo-server/integrations/plugins/ for more info on plugins
  const LogPlugin = {
    requestDidStart(requestContext) {
      const start = Date.now();
      let op = requestContext.request.operationName;
      let q = requestContext.request.query;

      if (op == "IntrospectionQuery") { //ignore graphql playground's constant schema polling introspection queries
        return;
      }
   
      return {
        willSendResponse (context) {
          const stop = Date.now();
          const elapsed = stop - start;
          
          //distinguish between successes and errors using context.errors
          if (context.errors) {
            logger.error(`Error querying, took ${elapsed} ms`, {query: q, errors: context.errors});
          } else {
            logger.info(`${op || "Query"} successfully completed in ${elapsed} ms`, {query: q});
          }
        }
      }
    },
  }

  const config = {
    introspection: true,
    playground: true,
    plugins: [LogPlugin], //plugin that uses winston to log info
    validationRules: [depthLimit(5)] //limit query depth to 5
  }
  const server = await getServer(config);
  server.applyMiddleware({ app });

  app.listen({ port: 4001 }, () =>
    console.log(`🚀 Server ready at http://localhost:4001${server.graphqlPath}`)
  );
})();

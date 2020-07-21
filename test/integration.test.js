

const { createTestClient } = require('apollo-server-testing');
const gql = require('graphql-tag');

describe("integration tests", function () {
  let server;

  beforeAll(async function() {
    server = await require("../src/server");
  });

  beforeEach(function() {
    jest.setTimeout(20000);
  });

  test("Test Gene related_to Disease", async function() {
    const GeneRelatedToDisease = gql`
      query {
        Gene(ids: "NCBIGene:285440") {
          id
          label
          Disease(predicates: related_to) {
            id
            label
            api
            publication
          }
        }
      }
    `
    const { query } = createTestClient(server);
    const res = await query({query: GeneRelatedToDisease});
    expect(res).toMatchSnapshot();
  }); 
});
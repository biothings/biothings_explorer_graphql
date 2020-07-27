

const { createTestClient } = require('apollo-server-testing');
const gql = require('graphql-tag');
const getServer = require("../src/server");

describe("integration tests", function () {
  let server;

  beforeAll(async function() {
    server = await getServer();
  });

  beforeEach(function() {
    jest.setTimeout(20000);
  });

  test("Test Disease related_to ChemicalSubstance", async function() {
    const DiseaseRelatedToChemicalSubstance = gql`
      query {
        Disease(ids: "MONDO:0005105") {
          id
          label
          ChemicalSubstance(predicates: related_to, sortBy: ngd_overall, maxResults: 25) {
            id
            label
            api
            publication
            source
            correlation {
              ngd_overall
              ngd_starred
            }
          }
        }
      }
    `
    const { query } = createTestClient(server);
    const res = await query({query: DiseaseRelatedToChemicalSubstance});
    expect(res.data.Disease[0].ChemicalSubstance.length).toEqual(25);
    expect(res).toMatchSnapshot();
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
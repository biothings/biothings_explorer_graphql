var getSchema = require("../src/schema");
const { getObjectTypes, getEdges } = require("../src/utils");
const { gql } = require("apollo-server-express");
const kg = require("@biothings-explorer/smartapi-kg");

describe("test getSchema", function () {
  let schema;
  beforeAll(() => {
    let ops = [
      {
        association: {
          input_type: "Gene",
          output_type: "Disease",
          predicate: "related_to",
          api_name: "Automat PHAROS API"
        },
      },
      {
        association: {
          input_type: "biolink:Gene",
          output_type: "biolink:Disease",
          predicate: "biolink:related_to",
          api_name: "Biolink API"
        },
      },
      {
        association: {
          input_type: "Gene",
          output_type: "Disease",
          predicate: "affects",
          api_name: "Automat PHAROS API"
        },
      },
      {
        association: {
          input_type: "BiologicalProcess",
          output_type: "Disease",
          predicate: "related_to",
          api_name: "Automat PHAROS API"
        },
      },
      {
        association: {
          input_type: "AnatomicalEntity",
          output_type: "Disease",
          predicate: "related_to",
          api_name: "Automat PHAROS API"
        },
      },
    ];

    let object_types = getObjectTypes(ops);
    let edges = getEdges(ops);
    
    schema = gql(getSchema(object_types, edges));
  });

  test("Correct number of query types",() => {
    let queryField = schema.definitions.filter(obj => (obj.kind == "ObjectTypeDefinition" && obj.name.value == "Query"))[0];
    expect(queryField.fields.length).toBe(3); //3 input types
  });

  test("Correct number of enums",() => {
    let enums = schema.definitions.filter(obj => (obj.kind == "EnumTypeDefinition"));
    //3 different ways Gene->Disease, BiologicalProcess->Disease, AnatomicalEntity->Disease
    //expect 3 predicate enums and 3 api enums
    expect(enums.filter(e => e.name.value.includes("API")).length).toBe(3);
    expect(enums.filter(e => e.name.value.includes("Predicates")).length).toBe(3); 
  })

  test("Correct number of object types",() => {
    let obj_types = schema.definitions.filter(obj => (obj.kind == "ObjectTypeDefinition" && obj.interfaces.length > 0));
    expect(obj_types.length).toBe(4); //Gene, Disease, BiologicalProcess, AnatomicalEntity
  })
});

var getSchema = require("../src/schema");
const { getObjectTypes, getEdges } = require("../src/utils");
const { gql } = require("apollo-server");
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
        },
      },
      {
        association: {
          input_type: "biolink:Gene",
          output_type: "biolink:Disease",
          predicate: "biolink:related_to",
        },
      },
      {
        association: {
          input_type: "Gene",
          output_type: "Disease",
          predicate: "affects",
        },
      },
      {
        association: {
          input_type: "BiologicalProcess",
          output_type: "Disease",
          predicate: "related_to",
        },
      },
      {
        association: {
          input_type: "AnatomicalEntity",
          output_type: "Disease",
          predicate: "related_to",
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
    expect(enums.length).toBe(3); //3 different ways Gene->Disease, BiologicalProcess->Disease, AnatomicalEntity->Disease
  })

  test("Correct number of object types",() => {
    let obj_types = schema.definitions.filter(obj => (obj.kind == "ObjectTypeDefinition" && obj.interfaces.length > 0));
    console.log(obj_types)
    expect(obj_types.length).toBe(4); //Gene, Disease, BiologicalProcess, AnatomicalEntity
  })
});
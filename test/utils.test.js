var { getPredicates, getObjectTypes, getEdges } = require("../src/utils");

describe("test getPredicates function", function () {
  test("Empty case", function () {
    let input = [];
    let expected = [];
    expect(getPredicates(input)).toEqual(expected);
  });

  test("Alphabetical order and no duplicates returned", function () {
    let input = [
      {
        association: {
          predicate: "treats",
        },
      },
      {
        association: {
          predicate: "related_to",
        },
      },
      {
        association: {
          predicate: "related_to",
        },
      },
    ];
    let expected = ["related_to", "treats"];
    expect(getPredicates(input)).toEqual(expected);
  });

  test("Special case with colon", function () {
    let input = [
      {
        association: {
          predicate: "treats",
        },
      },
      {
        association: {
          predicate: "biolink:related_to",
        },
      },
    ];
    let expected = ["related_to", "treats"];
    expect(getPredicates(input)).toEqual(expected);
  });
});

describe("test getObjectTypes function", function () {
  test("Empty case", function () {
    let input = [];
    let expected = [];
    expect(getObjectTypes(input)).toEqual(expected);
  });

  test("Alphabetical order and no duplicates returned", function () {
    let input = [
      {
        association: {
          input_type: "Gene",
          output_type: "Disease",
        },
      },
      {
        association: {
          input_type: "BiologicalProcess",
          output_type: "Disease",
        },
      },
      {
        association: {
          input_type: "AnatomicalEntity",
          output_type: "Disease",
        },
      },
    ];
    let expected = ["AnatomicalEntity", "BiologicalProcess", "Disease", "Gene"];
    expect(getObjectTypes(input)).toEqual(expected);
  });

  test("Special case with colon", function () {
    let input = [
      {
        association: {
          input_type: "biolink:Gene",
          output_type: "biolink:Disease",
        },
      },
      {
        association: {
          input_type: "AnatomicalEntity",
          output_type: "Disease",
        },
      },
    ];
    let expected = ["AnatomicalEntity", "Disease", "Gene"];
    expect(getObjectTypes(input)).toEqual(expected);
  });
});

describe("test getEdges function", function () {
  test("Empty case", function () {
    let input = [];
    let expected = {};
    expect(getEdges(input)).toEqual(expected);
  });

  test("Alphabetical order and no duplicates returned", function () {
    let input = [
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
          input_type: "Gene",
          output_type: "Disease",
          predicate: "affects",
          api_name: "MGIgene2phenotype API"
        },
      },
      {
        association: {
          input_type: "BiologicalProcess",
          output_type: "Disease",
          predicate: "related_to",
          api_name: "Automat CORD19 Scibite API"
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

    let output = getEdges(input);
    expect(output["Gene"]["Disease"].predicates).toEqual(["affects", "related_to"]);
    expect(output["BiologicalProcess"]["Disease"].predicates).toEqual(["related_to"]);
    expect(output["AnatomicalEntity"]["Disease"].predicates).toEqual(["related_to"]);

    expect(output["Gene"]["Disease"].apis).toEqual(["Automat PHAROS API", "MGIgene2phenotype API"]);
    expect(output["BiologicalProcess"]["Disease"].apis).toEqual(["Automat CORD19 Scibite API"]);
    expect(output["AnatomicalEntity"]["Disease"].apis).toEqual(["Automat PHAROS API"]);
  });

  test("Special case with colon", function () {
    let input = [
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
          predicate: "related_to",
          api_name: "Biolink API"
        },
      },
      {
        association: {
          input_type: "Gene",
          output_type: "Disease",
          predicate: "affects",
          api_name: "MyVariant.info API"
        },
      },
    ];

    let output = getEdges(input);
    expect(output["Gene"]["Disease"].predicates).toEqual(["affects", "related_to"]);
    expect(output.hasOwnProperty("biolink:Gene")).toBeFalsy();

    expect(output["Gene"]["Disease"].apis).toEqual(["Biolink API", "MyVariant.info API"]);
  });
});

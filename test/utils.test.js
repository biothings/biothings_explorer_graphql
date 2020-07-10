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

    let output = getEdges(input);
    expect(output["Gene"]["Disease"]).toEqual(["affects", "related_to"]);
    expect(output["BiologicalProcess"]["Disease"]).toEqual(["related_to"]);
    expect(output["AnatomicalEntity"]["Disease"]).toEqual(["related_to"]);
  });

  test("Special case with colon", function () {
    let input = [
      {
        association: {
          input_type: "biolink:Gene",
          output_type: "biolink:Disease",
          predicate: "biolink:related_to"
        },
      },
      {
        association: {
          input_type: "Gene",
          output_type: "Disease",
          predicate: "related_to"
        },
      },
      {
        association: {
          input_type: "Gene",
          output_type: "Disease",
          predicate: "affects"
        },
      },
    ];

    let output = getEdges(input);
    expect(output["Gene"]["Disease"]).toEqual(["affects", "related_to"]);
    expect(output.hasOwnProperty("biolink:Gene")).toBeFalsy();
  });
});

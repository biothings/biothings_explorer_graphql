const rewire = require("rewire");
var utils = rewire("../src/utils.js");

getPredicates = utils.__get__("getPredicates");

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

getObjectTypes = utils.__get__("getObjectTypes");

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

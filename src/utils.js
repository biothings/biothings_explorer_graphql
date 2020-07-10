const _ = require("lodash");

/**
 * get an array of all possible predicates that apply to an object (eg. related_to, treats) from a knowledge graph
 * @param {Array} ops Array of Knowledge graph operations
 * @returns {Array} array of strings that contains all of the possible predicates (in alphabetical order)
 */
function getPredicates(ops) {
  let predicates = new Set();

  ops.map((op) => {
    //deal with predicates such as `biolink:related_to` while also working for normal `related_to`
    predicates.add(op.association.predicate.split(":").slice(-1)[0]);
  });

  return Array.from(predicates).sort();
}

/**
 * get an array of all possible predicates that apply to an object (eg. related_to, treats) from a knowledge graph
 * @param {Array} ops Array of Knowledge graph operations
 * @returns {Array} array of strings that contains all of the possible object types (eg. AnatomicalEntity, BiologicalProcess) (in alphabetical order)
 */
function getObjectTypes(ops) {
  let object_types = new Set();

  ops.map((op) => {
    //use split and slice to deal with object_types such as `biolink:Gene` while also working for normal `Gene`
    object_types.add(op.association.input_type.split(":").slice(-1)[0]);
    object_types.add(op.association.output_type.split(":").slice(-1)[0]);
  });

  return Array.from(object_types).sort();
}

/**
 * get an object with the different connection
 * @param {Array} ops Array of Knowledge graph operations
 * @returns {Object} edges (everything in alphabetical order)
 * 
 * Sample response:
 * {
 *    AnatomicalEntity: {
 *        Disease: ["related_to"],
 *        Gene: ["affected_by", "causes"]
 *    },
 *    Disease: {
 *        Disease: ["related_to"],
 *        Gene: ["affects", "related_to"]
 *    },
 * }
 */
function getEdges(ops) {
  let edges = {};

  ops.map((op) => {
    //deal with fields with colons
    let input_type = op.association.input_type.split(":").slice(-1)[0];
    let output_type = op.association.output_type.split(":").slice(-1)[0];
    let predicate = op.association.predicate.split(":").slice(-1)[0];


    if (! (input_type in edges)) {
      edges[input_type] = {};
    }
    if (! (output_type in edges[input_type])) {
      edges[input_type][output_type] = new Set();
    }

    edges[input_type][output_type].add(predicate);
  });

  let sorted_edges = {};
  //convert sets to sorted arrays
  Object.keys(edges).sort().forEach((key) => {
    Object.keys(edges[key]).sort().forEach((k) => {
      _.set(sorted_edges, [key, k], Array.from(edges[key][k]).sort());
    });
  });

  return sorted_edges;
}

module.exports = {
  getPredicates: getPredicates,
  getObjectTypes: getObjectTypes,
  getEdges: getEdges,
}

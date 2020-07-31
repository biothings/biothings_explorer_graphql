const _ = require("lodash");

/**
 * get an array of all possible predicates that apply to an object (eg. related_to, treats) from a knowledge graph
 * @param {Array} ops Array of Knowledge graph operations
 * @returns {Array} array of strings that contains all of the possible predicates (in alphabetical order)
 */
function getPredicates(ops) {
  let predicates = new Set();

  ops.map((op) => {
    //deal with predicates such as `biolink:related_to` while also working for normal predicates such as `related_to`
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
    //use split and slice to deal with types such as `biolink:Gene` while also working for normal types such as `Gene`
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
 *        Disease: {
 *          predicates: ["related_to"],
 *          apis: ["Automat PHAROS API", "Other API"]
 *        },
 *        Gene:{
 *          predicates: ["affected_by", "causes"],
 *          apis: ["Biolink API", "Other API"]
 *        }
 *    },
 *    Disease: {
 *        Disease: {
 *          predicates: ["related_to"],
 *          apis: ["Other API", "Some API"]
 *        },
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
    let api = op.association.api_name;

    if (!(input_type in edges)) {
      edges[input_type] = {};
    }
    
    if (!(output_type in edges[input_type])) {
      _.set(edges, [input_type, output_type, "predicates"], new Set());
      _.set(edges, [input_type, output_type, "apis"], new Set());
    }

    edges[input_type][output_type].predicates.add(predicate);
    edges[input_type][output_type].apis.add(api);
  });

  let sorted_edges = {};
  //convert sets to sorted arrays
  Object.keys(edges).sort().forEach((key) => {
    Object.keys(edges[key]).sort().forEach((k) => {
      _.set(sorted_edges, [key, k, "predicates"], Array.from(edges[key][k].predicates).sort()); // sort predicates
      _.set(sorted_edges, [key, k, "apis"], Array.from(edges[key][k].apis).sort()); // sort apis
    });
  });

  return sorted_edges;
}

module.exports = {
  getPredicates: getPredicates,
  getObjectTypes: getObjectTypes,
  getEdges: getEdges,
}

/**
 * get an array of all possible predicates that apply to an object (eg. related_to, treats) from a knowledge graph
 * @param {Array} ops Array of Knowledge graph operations
 * @returns {Array} array of strings that contains all of the possible predicates (in alphabetical order)
 */
function getPredicates(ops) {
  let predicates = new Set();

  ops.map((op) => {
    //deal with predicates such as `biolink:related_to`
    if (op.association.predicate.includes(":")) {
      predicates.add(op.association.predicate.split(":")[1]);
    } else {
      predicates.add(op.association.predicate);
    }
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
    //deal with object_types such as `biolink:Gene`
    //check input type
    if (op.association.input_type.includes(":")) {
      object_types.add(op.association.input_type.split(":")[1]);
    } else {
      object_types.add(op.association.input_type);
    }

    //check output type
    if (op.association.output_type.includes(":")) {
      object_types.add(op.association.output_type.split(":")[1]);
    } else {
      object_types.add(op.association.output_type);
    }
  });

  return Array.from(object_types).sort();
}

module.exports = {
  getPredicates: getPredicates,
  getObjectTypes: getObjectTypes,
}

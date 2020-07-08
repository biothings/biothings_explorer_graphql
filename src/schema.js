/**
 * get graphQL SDL string
 * @param {Array.<string>} predicates Array of all possible predicates (eg. related_to, treats)
 * @param {Array.<string>} object_types Array of all possible object types (eg. AnatomicalEntity, BiologicalProcess)
 * @returns {String} schema in GraphQL SDL format
 */
function getSchema(predicates, object_types) {
  return `
    interface ObjectType {
      id: String!
      name: String!
      publication: [String]
      api: String
      source: String
      objectType: String
      ${predicates.map((p) => `${p}(types: [String]): [ObjectType]`).join("\n")}
    }
    
    ${object_types.map((obj_type) => `
      type ${obj_type} implements ObjectType {
        id: String!
        name: String!
        publication: [String]
        api: String
        source: String
        objectType: String
        ${predicates.map((p) => `${p}(types: [String]): [ObjectType]`).join("\n")}
      }
    `
    ).join("\n")}

    type Query {
      ${object_types.map((obj_type) => `${obj_type}(id: String!): ${obj_type}`).join("\n")}
    }
  `;
}

module.exports = getSchema;

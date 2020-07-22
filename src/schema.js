const _ = require("lodash");

/**
 * get graphQL SDL string
 * @param {Array.<string>} object_types Array of all possible object types (eg. AnatomicalEntity, BiologicalProcess)
 * @param {Object} edges Object containing all possible edges and predicates (see getEdges function in utils)
 * @returns {String} schema in GraphQL SDL format
 */
function getSchema(object_types, edges) {
  return `
    ${Object.keys(edges).map((objectType) => { //generate an enum for each possible ObjectType -> ObjectType relationship
      //for example if the input type is Gene and output type is Disease then the enums will be called GeneToDiseasePredicates and GeneToDiseaseAPIs
      return Object.keys(edges[objectType]).map((outputType) => 
      `
        enum ${objectType}To${outputType}Predicates {
          ${edges[objectType][outputType].predicates.join("\n")}
        }
        
        enum ${objectType}To${outputType}APIs {
          ${edges[objectType][outputType].apis.map(api => api.replace(/[\W_]/gi, '_')).join("\n")}
        }
      `).join("\n");
    }).join("\n")}

    interface ObjectType {
      "The id of the object in the form 'idType:id', eg. 'NCBIGene:7852' or 'UMLS:C1332823'"
      id: String!
      label: String
      "Publication numbers, either PMC or Pubmed, eg. ['pmc:PMC6522480', 'pmc:PMC6757502'] or ['pubmed:16357147', 'pubmed:18512766']"
      publication: [String]
      "api that was used"
      api: String
      source: String
      predicate: String
    }
    
    ${object_types.map((objectType) => `
      type ${objectType} implements ObjectType {
        "The id of the object in the form 'idType:id', eg. 'NCBIGene:7852' or 'UMLS:C1332823'"
        id: String!
        label: String
        "Publication numbers, either PMC or Pubmed, eg. ['pmc:PMC6522480', 'pmc:PMC6757502'] or ['pubmed:16357147', 'pubmed:18512766']"
        publication: [String]
        "api that was used"
        api: String
        source: String
        predicate: String
        ${Object.keys(_.get(edges, objectType, {})).map((outputType) => 
          `${outputType}(predicates: [${objectType}To${outputType}Predicates], apis: [${objectType}To${outputType}APIs]): [${outputType}]`
        ).join("\n")}
      }
    `).join("\n")}

    type Query {
      ${Object.keys(edges).map((objectType) => 
        `${objectType}(
          """
            Id or array of ids of inputs in the form "IDType:ID", eg. \"NCBIGene:7852\" or [\"NCBIGene:7852\", \"NCBIGene:1234\"]
          """
          ids: [String]!
          ): [${objectType}]`
      ).join("\n") /* use edges since that will only give possible inputs*/}
    }
  `;
}

module.exports = getSchema;

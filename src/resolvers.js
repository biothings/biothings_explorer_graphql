const callApis = require("@biothings-explorer/call-apis");
const resolve = require("biomedical_id_resolver");

/**
 * Generic resolver for deeper queries (2nd level and deeper)
 * Calls apis and returns results
 * @param {String} inputType input object type (eg. AnatomicalEntity, BiologicalProcess)
 * @param {String} inputId input object type (eg. AnatomicalEntity, BiologicalProcess)
 * @param {String} predicate predicate (eg. related_to, treats)
 * @param {Array.<string>} [outputTypes] array of output object types (eg. AnatomicalEntity, BiologicalProcess)
 * @return {Array} array of objects that is in the shape of an ObjectType
 */
async function basicResolver(inputType, inputId, predicate, outputTypes) {
  return [{
    objectType: "Gene",
    id: "asdf",
    name: "asdf",
    publication: "",
    api: "",
    source: "",
  }];
}

/**
 * Generic resolver for Query fields
 * @param {String} id id (eg. "NCBIGene:1017", "MONDO:0004976")
 * @param {String} ObjectType object type of id (eg. AnatomicalEntity, BiologicalProcess)
 * @return {Object} object with basic fields populated (id, name) and empty values for publication, api, and source fields
 */
async function baseLevelResolver(id, objectType) {
  let input = {};
  input[objectType] = [id];
  let output = await resolve(input);

  return {
    id: id,
    name: output[id].id.label,
    publication: "",
    api: "",
    source: "",
    objectType: objectType,
  };
}

/**
 * get resolvers object
 * @param {Array.<string>} predicates Array of all possible predicates (eg. related_to, treats)
 * @param {Array.<string>} object_types Array of all possible object types (eg. AnatomicalEntity, BiologicalProcess)
 * @returns {Object} object containing resolvers for apollo server
 */
function getResolvers(predicates, objectTypes) {
  let resolvers = {};

  //interface resolve type
  resolvers.ObjectType = {
    __resolveType(obj, context, info) {
      if (obj.objectType) {
        return obj.objectType;
      }

      return null;
    }
  }

  //handle query resolvers
  resolvers.Query = {};
  objectTypes.forEach((objectType) => {
    resolvers.Query[objectType] = async function (parent, args, context, info) {
      return await baseLevelResolver(args.id, objectType);
    };
  });

  //handle object resolvers
  objectTypes.forEach((objectType) => {
    resolvers[objectType] = {};
    predicates.forEach((predicate) => {
      resolvers[objectType][predicate] = async function (parent, args, context, info) {
        if (args.hasOwnProperty("types")) {
          return await basicResolver(args.types);
        } else {
          return await basicResolver();
        }
      };
    });
  });

  return resolvers;
}

module.exports = getResolvers;

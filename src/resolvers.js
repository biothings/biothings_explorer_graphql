const callApis = require("@biothings-explorer/call-apis");
const biomedicalIdResolve = require("biomedical_id_resolver");

/**
 * Generic resolver for deeper queries (2nd level and deeper)
 * Calls apis and returns results
 * @param {MetaKG} kg knowledge graph
 * @param {String} inputType input object type (eg. AnatomicalEntity, BiologicalProcess)
 * @param {String} inputId input object type (eg. AnatomicalEntity, BiologicalProcess)
 * @param {String | Array.<string>} predicate predicate (eg. related_to, treats)
 * @param {Array.<string>} [outputTypes] array of output object types (eg. AnatomicalEntity, BiologicalProcess)
 * @return {Array} array of objects that is in the shape of an ObjectType
 */
async function basicResolver(kg, inputType, inputId, predicate, outputTypes) {
  //get list of apis to query using smartapi-kg
  let ops;
  if (outputTypes) {
    ops = kg.filter({ input_type: inputType, predicate: predicate, output_type: outputTypes });
  } else {
    ops = kg.filter({ input_type: inputType, predicate: predicate });
  }

  //use biomedical_id_resolver to get info about input
  let input = {};
  input[inputType] = [inputId];
  let output = await biomedicalIdResolve(input);

  //inject ids into ops for querying
  ops.forEach((op, idx, arr) => {
    try {
      let apiInputIdType = op.association.input_id;
      let apiInputId = output[inputId].bte_ids[apiInputIdType];
      arr[idx].input = apiInputId;
    } catch (e) {
      console.log(e);
    }
  });

  //use callApis to get api response
  const queryExecutor = new callApis(ops);
  await queryExecutor.query();
  let result = queryExecutor.result;

  //assemble response
  let ret = [];
  result.forEach((res) => {
    let publication = [];
    if (res.pmc) {
      publication = res.pmc.map((p) => `pmc: ${p}`);
    } else if (res.pubmed) {
      publication = res.pubmed.map((p) => `pubmed: ${p}`);
    }

    ret.push({
      objectType: res["$association"].output_type,
      id: res["$output"],
      name: res.name,
      source: res["$association"].source,
      api: res["$association"].api_name,
      publication: publication,
    });
  });

  return ret;
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
  let output = await biomedicalIdResolve(input);

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
 * @param {MetaKG} kg knowledge graph
 * @param {Array.<string>} predicates Array of all possible predicates (eg. related_to, treats)
 * @param {Array.<string>} object_types Array of all possible object types (eg. AnatomicalEntity, BiologicalProcess)
 * @returns {Object} object containing resolvers for apollo server
 */
function getResolvers(kg, predicates, objectTypes) {
  let resolvers = {};

  //interface resolve type
  resolvers.ObjectType = {
    __resolveType(obj) {
      if (obj.objectType) {
        return obj.objectType;
      }

      return null;
    },
  };

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
      resolvers[objectType][predicate] = async function (parent, args) {
        if (args.hasOwnProperty("types")) {
          return await basicResolver(kg, parent.objectType, parent.id, predicate, args.types);
        } else {
          return await basicResolver(kg, parent.objectType, parent.id, predicate);
        }
      };
    });
  });

  return resolvers;
}

module.exports = getResolvers;

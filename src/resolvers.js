const callApis = require("@biothings-explorer/call-apis");
const biomedicalIdResolve = require("biomedical_id_resolver");
const _ = require("lodash");

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
  let ops_filter = { input_type: inputType, predicate: predicate, output_type: outputTypes };
  ops_filter = _.omitBy(ops_filter, _.isNil); //remove undefined and null from object  
  let ops = kg.filter(ops_filter);

  //use biomedical_id_resolver to get info about input
  let input = {};
  input[inputType] = [inputId];
  let output = await biomedicalIdResolve(input);

  //TODO: get rid of try catch when problem with biomedical_id_resolver is fixed
  if (output[inputId].flag == "failed") {
    console.log("ID RESOLUTION PROBLEM ", input, inputId);
    return []; //abort if id resolution fails
  }

  //inject ids into ops for querying
  for (let i = ops.length - 1; i >= 0; i--) {
    let apiInputIdType = ops[i].association.input_id;
    let apiInputId = output[inputId].bte_ids[apiInputIdType];
    if (!apiInputId) {
      //remove element if id cannot be resolved
      console.log("IDNOTRESOLVED", apiInputIdType, inputId);
      ops.splice(i, 1);
    } else {
      ops[i].input = apiInputId;
    }
  }

  //use callApis to get api response
  const queryExecutor = new callApis(ops);
  await queryExecutor.query();
  let result = queryExecutor.result;

  //assemble response
  let ret = [];
  result.forEach((res) => {
    let publication = [];
    if (res.pmc) {
      //check if res.pmc is array or string
      if (Array.isArray(res.pmc)) {
        publication = res.pmc.map((p) => `pmc:${p}`);
      } else {
        publication.push(`pmc:${res.pmc}`);
      }
    } else if (res.pubmed) {
      //check if res.pubmed is array or string
      if (Array.isArray(res.pubmed)) {
        publication = res.pubmed.map((p) => `pubmed:${p}`);
      } else {
        publication.push(`pubmed:${res.pubmed}`);
      }
    }

    ret.push({
      objectType: res["$association"].output_type,
      id: res["$output"],
      name: res["$output_id_mapping"].resolved.id.label || res.name || "",
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
 * @param {Object} edges Object containing all possible edges and predicates (see getEdges function in utils)
 * @returns {Object} object containing resolvers for apollo server
 */
function getResolvers(kg, edges) {
  let resolvers = {};

  //interface resolve type
  resolvers.ObjectType = {
    __resolveType(obj) {
      return null;
    },
  };

  //handle query resolvers
  resolvers.Query = {};
  Object.keys(edges).forEach((objectType) => {
    resolvers.Query[objectType] = async function (parent, args, context, info) {
      return await baseLevelResolver(args.id, objectType);
    };
  });

  //handle object resolvers
  Object.keys(edges).forEach((objectType) => {
    resolvers[objectType] = {};
    Object.keys(edges[objectType]).forEach((outputType) => {
      resolvers[objectType][outputType] = async function (parent, args) { 
        return await basicResolver(kg, parent.objectType, parent.id, _.get(args, "predicates", null), outputType);
      };
    });

  });

  return resolvers;
}

module.exports = getResolvers;

const callApis = require("@biothings-explorer/call-apis");
const biomedicalIdResolve = require("biomedical_id_resolver");
const _ = require("lodash");
const { createBatchResolver } = require("graphql-resolve-batch");

/**
 * Generic batch resolver for deeper queries (2nd level and deeper)
 * Calls apis and returns results
 * @param {MetaKG} kg knowledge graph
 * @param {Array.<string>} inputIds array of ids (eg. ["NCBIGene:7852", "UMLS:C1332823"])
 * @param {String} inputType input object type (eg. AnatomicalEntity, BiologicalProcess)
 * @param {String | Array.<string>} predicate predicate (eg. related_to, treats)
 * @param {String | Array.<string>} outputTypes output object types (eg. AnatomicalEntity, BiologicalProcess)
 * @return {Array} array of arrays of objects that is in the shape of an ObjectType
 */
async function batchResolver(kg, inputIds, inputType, predicate, outputType) {
  //get list of apis to query using smartapi-kg
  let ops_filter = { input_type: inputType, predicate: predicate, output_type: outputType };
  ops_filter = _.omitBy(ops_filter, _.isNil); //remove undefined and null from object  
  let ops = kg.filter(ops_filter);

  //use biomedical_id_resolver to get info about input
  let input = {};
  input[inputType] = inputIds;
  let output = await biomedicalIdResolve(input);

  let resolvedIds = inputIds.filter(inputId => (output[inputId].flag != "failed")); //remove problem ids
  
  //inject ids into ops for querying
  let query_ops = []; //list of ops to send to callApis
  ops.forEach(op => {
    let apiInputIdType = op.association.input_id;

    let valid_ids = []; //list of ids that are valid for the api
    let valid_original_ids = {}; //make object that maps resolved input -> original input

    //attempt to resolve all ids
    resolvedIds.forEach(id => { 
      let apiInputIds = output[id].bte_ids[apiInputIdType];
      if (apiInputIds) {
        valid_ids.push(apiInputIds);

        let ids = output[id].equivalent_identifiers.map(x => x.identifier).filter(x => x.startsWith(apiInputIdType)); //get apiInputIds but with type in front always
        ids.forEach(apiInputId => {
          valid_original_ids[apiInputId] = id;
        })
      } else {
        console.log("IDNOTRESOLVED", apiInputIdType, id);
      }
    });

    if (op.query_operation.supportBatch) { // use batch input if available
      op.input = valid_ids;
      op.original_input = valid_original_ids;
      query_ops.push(op);
    } else { // create a separate op for each id if batch input isn't available
      for (let i = 0; i < valid_ids.length; i++) {
        let temp_op = _.clone(op);
        temp_op.input = valid_ids[i];
        temp_op.original_input = _.pick(valid_original_ids, [valid_ids[i]]);
        query_ops.push(temp_op);
      }
    }
  })

  //use callApis to get api response
  const queryExecutor = new callApis(query_ops);
  await queryExecutor.query();
  let result = queryExecutor.result;

  //object with an array for each id
  let ret = {};
  inputIds.forEach(inputId => {
    ret[inputId] = [];
  })

  //assemble response
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

    if (!ret[res["$original_input"][res["$input"]]]) {
      console.log("OIPROBLEM", ret, res);
    }

    ret[res["$original_input"][res["$input"]]].push({
      objectType: res["$association"].output_type,
      id: res["$output"],
      name: res["$output_id_mapping"].resolved.id.label || res.name || "",
      source: res["$association"].source,
      api: res["$association"].api_name,
      publication: publication,
    });
  });

  return inputIds.map(id => ret[id]);
}

/**
 * Generic resolver for deeper queries (2nd level and deeper)
 * Calls apis and returns results
 * @param {MetaKG} kg knowledge graph
 * @param {String} inputId id eg. "NCBIGene:7852"
 * @param {String} inputType input object type (eg. AnatomicalEntity, BiologicalProcess)
 * @param {String | Array.<string>} predicate predicate (eg. related_to, treats)
 * @param {Array.<string>} [outputTypes] array of output object types (eg. AnatomicalEntity, BiologicalProcess)
 * @return {Array} array of objects that is in the shape of an ObjectType
 */
async function basicResolver(kg, inputId, inputType, predicate, outputTypes) {
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
    name: (output[id].flag == "failed") ? output[id].id.label : "",
    publication: "",
    api: "",
    source: "",
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
  // let loaders = {}; //dataloaders

  //interface resolve type
  resolvers.ObjectType = {
    __resolveType(obj) {
      return null;
    },
  };

  //handle query resolvers
  resolvers.Query = {};
  Object.keys(edges).forEach((objectType) => {
    resolvers.Query[objectType] = async function (parent, args) {
      return await baseLevelResolver(args.id, objectType);
    };
  });

  //handle object resolvers
  Object.keys(edges).forEach((objectType) => {
    resolvers[objectType] = {};
    Object.keys(edges[objectType]).forEach((outputType) => {
      resolvers[objectType][outputType] = createBatchResolver(async function (parent, args) { 
        ids = parent.map(obj => obj.id);
        return await batchResolver(kg, ids, objectType, _.get(args, "predicates", null), outputType);
      });
      // resolvers[objectType][outputType] = async function (parent, args) {
      //   return await basicResolver(kg, parent.id, objectType, _.get(args, "predicates", null), outputType);
      // };
    });

  });

  return resolvers;
}

module.exports = getResolvers;

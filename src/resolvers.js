const callApis = require("@biothings-explorer/call-apis");
const biomedicalIdResolve = require("biomedical_id_resolver");
const _ = require("lodash");
const { createBatchResolver } = require("graphql-resolve-batch");
const filterResults = require("biothings-explorer-filters");

/**
 * Generic batch resolver for deeper queries (2nd level and deeper)
 * Calls apis and returns results
 * @param {MetaKG} kg knowledge graph
 * @param {Array.<string>} inputIds array of ids (eg. ["NCBIGene:7852", "UMLS:C1332823"])
 * @param {String} inputType input object type (eg. AnatomicalEntity, BiologicalProcess)
 * @param {String | Array.<string>} outputTypes output object types (eg. AnatomicalEntity, BiologicalProcess)
 * @param {String | Array.<string>} predicate predicate (eg. related_to, treats)
 * @param {String | Array.<string>} api apis to query (eg. "Automat PHAROS API")
 * @param {String} sortBy option to sort by (either "ngd_overall" or "ngd_starred")
 * @param {Number} maxResults maximum results for the level
 * @return {Array} array of arrays of objects that is in the shape of an ObjectType
 */
async function batchResolver(kg, inputIds, inputType, outputType, predicate, api, sortBy, maxResults) {
  //get list of apis to query using smartapi-kg
  let ops_filter = { input_type: inputType, predicate: predicate, output_type: outputType, api: api };
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
      let apiInputIds = output[id].db_ids[apiInputIdType];
      if (apiInputIds) {
        valid_ids = valid_ids.concat(apiInputIds);

        let ids = output[id].curies.filter(x => x.startsWith(apiInputIdType)); //get prefixed ids
        ids.forEach(apiInputId => {
          valid_original_ids[apiInputId] = id;
        })
      }
    });

    //go to next op if there are no valid ids
    if (valid_ids.length == 0) {
      return;
    }

    if (op.query_operation.supportBatch) { // use batch input if available
      let temp_op = { ...op };
      temp_op.input = valid_ids;
      temp_op.original_input = valid_original_ids;
      query_ops.push(temp_op);
    } else { // create a separate op for each id if batch input isn't available
      for (let i = 0; i < valid_ids.length; i++) {
        let temp_op = { ...op }; //make copy of op
        temp_op.input = [valid_ids[i]];
        temp_op.original_input = valid_original_ids;
        query_ops.push(temp_op);
      }
    }
  })

  //use callApis to get api response
  const queryExecutor = new callApis(query_ops);
  await queryExecutor.query();
  let result = queryExecutor.result;

  //get correlation and apply filter/sort
  let filterOptions = {
    sort_by: sortBy,
    max_results: maxResults
  }
  result = await filterResults(result, filterOptions);
  
  //object with an array for each id
  let ret = {};
  inputIds.forEach(inputId => {
    ret[inputId] = [];
  })

  //TODO: update when callApis package is updated
  //assemble response
  result.forEach((res) => {
    //assemble publication array
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

    ret[res["$original_input"][res["$input"]]].push({
      objectType: res["$association"].output_type,
      id: res["$output"],
      label: res["$output_id_mapping"].resolved.id.label || res.name || "",
      source: res["$association"].source,
      api: res["$association"].api_name,
      publication: publication,
      predicate: res["$association"].predicate,
      correlation: res.correlation,
    });
  });

  return inputIds.map(id => ret[id]); //make sure response is in the correct shape (array of arrays) and in the original order
}

/**
 * Generic resolver for Query fields
 * @param {Array.<string>} ids ids (eg. ["NCBIGene:1017", "MONDO:0004976"])
 * @param {String} ObjectType object type of id (eg. AnatomicalEntity, BiologicalProcess)
 * @return {Object} object with basic fields populated (id, label) and empty values for publication, api, and source fields
 */
async function baseLevelResolver(ids, objectType) {
  let input = {};
  input[objectType] = ids;
  let output = await biomedicalIdResolve(input);

  return ids.map(id => ({
    id: output[id].id.identifier,
    label: output[id].id.label,
    publication: [],
    api: "",
    source: "",
    predicate: "",
  }));
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
    __resolveType() {
      return null;
    },
  };

  //base level resolvers (query resolvers)
  resolvers.Query = {};
  Object.keys(edges).forEach((objectType) => {
    resolvers.Query[objectType] = async function (parent, args) {
      return await baseLevelResolver(args.ids, objectType);
    };
  });

  Object.keys(edges).forEach((objectType) => {
    resolvers[objectType] = {};
    Object.keys(edges[objectType]).forEach((outputType) => {
      //create resolver to map underscore to original api name for api enums
      resolvers[`${objectType}To${outputType}APIs`] = edges[objectType][outputType].apis.reduce((o, api) => ({...o, [api.replace(/[\W_]/gi, '_')]: api}), {}); 
      
      //object->object resolvers
      resolvers[objectType][outputType] = createBatchResolver(async function (parent, args) { 
        ids = parent.map(obj => obj.id);
        return await batchResolver(kg, ids, objectType, outputType, _.get(args, "predicates", null), _.get(args, "apis", null), _.get(args, "sortBy", null), _.get(args, "maxResults", null));
      });
    });

  });

  return resolvers;
}

module.exports = getResolvers;

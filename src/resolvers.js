const callApis = require("@biothings-explorer/call-apis")

/**
 * Generic resolver
 * @param {String} input input object type (eg. AnatomicalEntity, BiologicalProcess)
 * @param {String} output output object type (eg. AnatomicalEntity, BiologicalProcess)
 * @param {String} predicate predicate (eg. related_to, treats)
 * @return {Array} array of objects that is in the shape of an ObjectType
 */
function basicResolver(input, output, predicate) {

}
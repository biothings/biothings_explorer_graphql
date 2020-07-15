const rewire = require("rewire");
const kg = require("@biothings-explorer/smartapi-kg");
const resolvers = rewire("../src/resolvers");

describe("test base level resolver", function () { 
  const baseLevelResolver = resolvers.__get__('baseLevelResolver');

  test("id and label fields are filled", async function() {
    const data = await baseLevelResolver("MONDO:1234", "Disease");
    expect(data.id.length).toBeGreaterThan(0);
    expect(data.label.length).toBeGreaterThan(0);
  });
});

describe("test batch resolver", function () { 
  const batchResolver = resolvers.__get__('batchResolver');

  beforeEach(function() {
    jest.setTimeout(20000);
  });

  test("return shape is correct", async function() {
    let meta_kg = new kg();
    await meta_kg.constructMetaKG();

    let ids = ["MONDO:1234", "MONDO:0004975", "MONDO:12345"];

    const data = await batchResolver(meta_kg, ids, "Disease", "disrupted_by", "ChemicalSubstance");
    
    //output should be array with length 3
    expect(data.length).toEqual(3);

    //fake ids should return empty array
    expect(data[0].length).toEqual(0);
    expect(data[2].length).toEqual(0);
  });
});
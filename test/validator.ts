import 'mocha';
// import * as assert from 'assert';
// import * as errors from '../src/lib/errors';
// import { createValidator } from '../src/lib/validator';

// describe('Validator', function(){

//     describe('#validate', function(){

//         it("should throw RPCFormatViolation if validation keyword unknown", () => {

//             const validator = createValidator('test', [{
//                 $schema: "http://json-schema.org/draft-07/schema",
//                 $id: "urn:Test.req",
//                 type: "object",
//                 properties: {},
//             }]);

//             assert.throws(() => {
//                 validator.validate('urn:Test.req', {});
//             }, errors.RPCFormatViolationError);

//         });

//     });

// });
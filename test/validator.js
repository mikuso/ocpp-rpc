const assert = require('assert');
const errors = require('../lib/errors');
const { createValidator } = require('../lib/validator');

describe('Validator', function(){

    describe('#validate', function(){

        it("should throw RPCFormatViolation if validation keyword unknown", () => {

            const validator = createValidator('test', [{
                $schema: "http://json-schema.org/draft-07/schema",
                $id: "urn:Test.req",
                type: "object",
                properties: {},
            }]);

            validator._ajv.errorsText = () => '';
            validator._ajv.getSchema = () => {
                const noop = function(){};
                noop.errors = [{
                    keyword: '_UNKNOWN_'
                }];
                return noop;
            };

            assert.throws(() => {
                validator.validate('urn:Test.req', {});
            }, errors.RPCFormatViolationError);

        });

    });

});
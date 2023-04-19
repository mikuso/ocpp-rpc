import 'mocha';
import * as assert from 'assert';
import * as errors from './errors';
import { createValidator } from './validator';

describe('Validator', function(){

    describe('#validate', function(){

        it("should throw RPCFormatViolationError if message format doesn't match spec", () => {

            const validator = createValidator('test', [{
                $schema: "http://json-schema.org/draft-07/schema",
                $id: "urn:Test.req",
                type: "object",
                additionalProperties: false,
                properties: {
                    test: {
                        type: "string",
                        maxLength: 5
                    }
                },
                required: ["test"],
            }]);
            
            assert.throws(() => {
                validator.validate('urn:Test.req', {"test":"xxxxxxx"});
            }, errors.RPCFormatViolationError);

        });

        it("should throw RPCOccurenceConstraintViolationError if missing property required", () => {

            const validator = createValidator('test', [{
                $schema: "http://json-schema.org/draft-07/schema",
                $id: "urn:Test.req",
                type: "object",
                properties: {
                    test: {type: "string"}
                },
                required: ["test"],
            }]);
            
            assert.throws(() => {
                validator.validate('urn:Test.req', {});
            }, errors.RPCOccurenceConstraintViolationError);

        });

    });

});
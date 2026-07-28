const path = require('node:path');
const assert = require('assert');
const errors = require('../lib/errors');
const { createValidator } = require('../lib/validator');

describe('Validator', function(){

    describe('#validate', function(){

        it("should throw RPCFormatViolation if validation keyword unknown", () => {

            const validator = createValidator('test', [{
                $schema: "http://json-schema.org/draft-07/schema",
                $id: "urn:ocpp-rpc:Test.req",
                type: "object",
                properties: {},
            }], {urnNid: 'ocpp-rpc', version: 'draft-07', confSuffix: '.conf', reqSuffix: '.req'});

            validator._ajv.errorsText = () => '';
            validator._ajv.getSchema = () => {
                const noop = function(){};
                noop.errors = [{
                    keyword: '_UNKNOWN_'
                }];
                return noop;
            };

            assert.throws(() => {
                validator.validate(validator.getRequestId('Test'), {});
            }, errors.RPCFormatViolationError);

        });

    });

});


describe('createValidator()', function(){

    it("should use backwards-compatible default options", () => {
        const validator = createValidator('test', [{
            $schema: "http://json-schema.org/draft-07/schema",
            $id: "urn:ocpp-rpc:Test.req",
            type: "object",
            properties: {},
        }]);

        assert.equal(validator._ajv.opts.defaultMeta, 'http://json-schema.org/draft-07/schema');
        assert.ok('http://json-schema.org/draft-07/schema' in validator._ajv.schemas);
        assert.equal(validator._urnNid, 'ocpp-rpc');
        assert.equal(validator._reqSuffix, '.req');
        assert.equal(validator._confSuffix, '.conf');
    });

    it("should instantiate Ajv according to the JSON Schema version used", () => {

        const d4 = createValidator('test', {}, {version: 'draft-04'});
        const d6 = createValidator('test', {}, {version: 'draft-06'});
        const d7 = createValidator('test', {}, {version: 'draft-07'});

        assert.ok('http://json-schema.org/draft-04/schema' in d4._ajv.schemas);
        assert.ok('http://json-schema.org/draft-06/schema' in d6._ajv.schemas);
        // draft-06 validators include draft-07 due to the way Ajv's backwards compatibility works.
        assert.ok('http://json-schema.org/draft-07/schema' in d6._ajv.schemas);
        assert.ok('http://json-schema.org/draft-07/schema' in d7._ajv.schemas);
    });

    it("should allow the JSON schema to be passed in as an object", () => {

        const validator = createValidator('test', {
            $schema: "http://json-schema.org/draft-07/schema",
            $id: "urn:ocpp-rpc-test:Test.req",
            type: "object",
            additionalProperties: false,
            properties: {
                test: {
                    type: "string"
                }
            },
            required: ["test"]
        }, {
            version: 'draft-07',
            reqSuffix: '.req',
            urnNid: 'ocpp-rpc-test',
        });

        assert.doesNotThrow(() => {
            validator.validate(validator.getRequestId('Test'), {
                test: 'test',
            });
        });

    });

    it("should allow the JSON schema to be passed in as an array of objects", () => {

        const validator = createValidator('test', [
            {
                $schema: "http://json-schema.org/draft-06/schema",
                $id: "urn:ocpp-rpc:Test.req",
                type: "object",
                additionalProperties: false,
                properties: {
                    test: {
                        type: "string"
                    }
                },
                required: ["test"]
            }, {
                $schema: "http://json-schema.org/draft-06/schema",
                $id: "urn:ocpp-rpc:Test2.req",
                type: "object",
                properties: {},
            }
        ], { version: 'draft-06' });

        assert.doesNotThrow(() => {
            validator.validate(validator.getRequestId('Test2'), {});
            validator.validate(validator.getRequestId('Test'), {
                test: 'test',
            });
        });

    });

    it("should allow the JSON schema to be passed in as a path to a single JSON schema file", () => {

        const d4a = createValidator('test', path.join(__dirname, './schemas/test-draft-04-array.json'), { version: 'draft-04' });
        const d4o = createValidator('test', path.join(__dirname, './schemas/test-draft-04-obj.json'), { version: 'draft-04' });
        
        const d6a = createValidator('test', path.join(__dirname, './schemas/test-draft-06-array.json'), { version: 'draft-06' });
        const d6o = createValidator('test', path.join(__dirname, './schemas/test-draft-06-obj.json'), { version: 'draft-06' });

        assert.doesNotThrow(() => {
            d4a.validate(d4a.getRequestId('Test'), {test: 'test'});
            d4o.validate(d4o.getRequestId('Test'), {test: 'test'});
            d6a.validate(d6a.getRequestId('Test'), {test: 'test'});
            d6o.validate(d6o.getRequestId('Test'), {test: 'test'});
        });

        assert.throws(() => {
            d6o.validate(d6o.getRequestId('Test'), {unknown: 123});
        });

    });

    it("should allow the JSON schema to be passed in as a path to a directory of JSON schema files", () => {

        const validator = createValidator('test', path.join(__dirname, './schemas/test/'), { version: 'draft-06' });

        assert.doesNotThrow(() => {
            validator.validate(validator.getRequestId('Test'), {test: 'test'});
            validator.validate(validator.getRequestId('Test2'), {});
        });

        assert.throws(() => {
            validator.validate(validator.getRequestId('Test3'));
        });

        assert.throws(() => {
            validator.validate(validator.getRequestId('Test'), {unknown: 123});
        });

    });

});

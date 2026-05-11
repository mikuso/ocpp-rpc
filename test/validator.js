const assert = require('assert');
const errors = require('../lib/errors');
const { createValidator } = require('../lib/validator');
const ocpp16Schemas = require('../lib/schemas/ocpp1_6.json');
const ocpp201Schemas = require('../lib/schemas/ocpp2_0_1.json');
const ocpp21Schemas = require('../lib/schemas/ocpp2_1.json');

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

    describe('#validate — OCPP 2.1 / legacy $id normalization', function(){

        const legacyReqSchema = {
            $schema: "http://json-schema.org/draft-07/schema",
            $id: "urn:Echo.req",
            type: "object",
            properties: { msg: { type: "string" } },
            required: ["msg"],
        };
        const legacyConfSchema = {
            $schema: "http://json-schema.org/draft-07/schema",
            $id: "urn:Echo.conf",
            type: "object",
            properties: { ok: { type: "boolean" } },
            required: ["ok"],
        };
        const ocpp21ReqSchema = {
            $schema: "http://json-schema.org/draft-07/schema",
            $id: "urn:HeartbeatRequest",
            type: "object",
            properties: {},
        };
        const ocpp21RespSchema = {
            $schema: "http://json-schema.org/draft-07/schema",
            $id: "urn:HeartbeatResponse",
            type: "object",
            properties: { currentTime: { type: "string" } },
            required: ["currentTime"],
        };

        it("legacy `.req` schema is resolvable by both the legacy and the OCPP 2.1 lookup form", () => {
            const validator = createValidator('ocpp1.6', [legacyReqSchema]);

            assert.doesNotThrow(() => validator.validate('urn:Echo.req', { msg: "hi" }));
            assert.doesNotThrow(() => validator.validate('urn:EchoRequest', { msg: "hi" }));
        });

        it("legacy `.conf` schema is resolvable by both the legacy and the OCPP 2.1 lookup form", () => {
            const validator = createValidator('ocpp1.6', [legacyConfSchema]);

            assert.doesNotThrow(() => validator.validate('urn:Echo.conf', { ok: true }));
            assert.doesNotThrow(() => validator.validate('urn:EchoResponse', { ok: true }));
        });

        it("OCPP 2.1 `Request` schema is resolvable by both the OCPP 2.1 and the legacy lookup form", () => {
            const validator = createValidator('ocpp2.1', [ocpp21ReqSchema]);

            assert.doesNotThrow(() => validator.validate('urn:HeartbeatRequest', {}));
            assert.doesNotThrow(() => validator.validate('urn:Heartbeat.req', {}));
        });

        it("OCPP 2.1 `Response` schema is resolvable by both the OCPP 2.1 and the legacy lookup form", () => {
            const validator = createValidator('ocpp2.1', [ocpp21RespSchema]);

            assert.doesNotThrow(() => validator.validate('urn:HeartbeatResponse', { currentTime: "2026-05-08T00:00:00.000Z" }));
            assert.doesNotThrow(() => validator.validate('urn:Heartbeat.conf', { currentTime: "2026-05-08T00:00:00.000Z" }));
        });

        it("still throws ProtocolError when a schema is genuinely missing", () => {
            const validator = createValidator('ocpp2.1', [ocpp21ReqSchema]);

            assert.throws(() => {
                validator.validate('urn:UnknownRequest', {});
            }, /Schema 'urn:UnknownRequest' is missing/);

            assert.throws(() => {
                validator.validate('urn:Unknown.req', {});
            }, /Schema 'urn:Unknown.req' is missing/);
        });

    });

    describe('#validate — bundled subprotocol schemas', function(){

        it("ocpp1.6 — validates Authorize.req (legacy lookup) against the bundled schemas", () => {
            const validator = createValidator('ocpp1.6', ocpp16Schemas);

            assert.doesNotThrow(() => validator.validate('urn:Authorize.req', { idTag: 'ABC1234' }));
            // Same schema must also be reachable via the OCPP 2.1 lookup form.
            assert.doesNotThrow(() => validator.validate('urn:AuthorizeRequest', { idTag: 'ABC1234' }));
        });

        it("ocpp2.0.1 — validates Authorize.req (legacy lookup) against the bundled schemas", () => {
            const validator = createValidator('ocpp2.0.1', ocpp201Schemas);

            const params = { idToken: { idToken: 'ABC1234', type: 'ISO14443' } };
            assert.doesNotThrow(() => validator.validate('urn:Authorize.req', params));
            assert.doesNotThrow(() => validator.validate('urn:AuthorizeRequest', params));
        });

        it("ocpp2.1 — validates AuthorizeRequest (OCPP 2.1 lookup) against the bundled schemas", () => {
            const validator = createValidator('ocpp2.1', ocpp21Schemas);

            const params = { idToken: { idToken: 'ABC1234', type: 'ISO14443' } };
            assert.doesNotThrow(() => validator.validate('urn:AuthorizeRequest', params));
            // The lookup form used in `client.js` prior to the normalization fix
            // must also work now, so callers don't need to know the subprotocol's
            // naming convention.
            assert.doesNotThrow(() => validator.validate('urn:Authorize.req', params));
        });

    });

});
import Ajv, { AnySchema, AsyncSchema, SchemaObject } from 'ajv';
export declare class Validator {
    private _subprotocol;
    private _ajv;
    constructor(subprotocol: string, ajv: Ajv);
    get subprotocol(): string;
    validate(schemaId: string, params: {}): boolean | Promise<unknown>;
}
export declare function createValidator(subprotocol: string, json: SchemaObject | AsyncSchema | AnySchema[]): Validator;

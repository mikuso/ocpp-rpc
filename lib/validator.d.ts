import Ajv, { AnySchema, AsyncSchema, SchemaObject } from "ajv";
export declare class Validator {
    _subprotocol: string;
    _ajv: Ajv;
    constructor(subprotocol: string, ajv: Ajv);
    get subprotocol(): string;
    validate(schemaId: string, params: any): boolean | Promise<unknown>;
}
export declare function createValidator(subprotocol: string, json: boolean | SchemaObject | AsyncSchema | AnySchema[]): Validator;

import Ajv, { AnySchema, AsyncSchema, SchemaObject } from "ajv";
export type createValidatorOptions = ValidatorOptions & {
    version: 'draft-04' | 'draft-06' | 'draft-07'
}
export type ValidatorOptions = {
    urnNid: string;
    reqSuffix: string;
    confSuffix: string;
}
export declare class Validator {
    _subprotocol: string;
    _ajv: Ajv;
    _urnNid: string;
    _reqSuffix: string;
    _confSuffix: string;
    constructor(subprotocol: string, ajv: Ajv, options: ValidatorOptions);
    get subprotocol(): string;
    validate(schemaId: string, params: any): boolean | Promise<unknown>;
    getRequestId(method: string): string;
    getResponseId(method: string): string;
}
export declare function createValidator(subprotocol: string, schemaObjOrPath: string | SchemaObject | AsyncSchema | AnySchema[], options: createValidatorOptions): Validator;

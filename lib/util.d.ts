export declare function getPackageIdent(): string;
export declare function getErrorPlainObject(err: Error): any;
export declare function createRPCError(type: string, message?: any, details?: {}): Record<string, any>;
declare const _default: {
    getErrorPlainObject: typeof getErrorPlainObject;
    createRPCError: typeof createRPCError;
    getPackageIdent: typeof getPackageIdent;
};
export default _default;

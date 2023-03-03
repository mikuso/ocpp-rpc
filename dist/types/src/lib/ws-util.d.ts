/// <reference types="node" />
import { Socket } from "net";
export declare function abortHandshake(socket: Socket, code: number, message?: string, headers?: {
    [key: string]: string;
}): void;
export declare function parseSubprotocols(header: string): Set<string>;
/**
 * Checks if a status code is allowed in a close frame.
 *
 * @param {Number} code The status code
 * @return {Boolean} `true` if the status code is valid, else `false`
 * @public
 */
export declare function isValidStatusCode(code: number): boolean;

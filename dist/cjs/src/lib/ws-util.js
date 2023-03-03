"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidStatusCode = exports.parseSubprotocols = exports.abortHandshake = void 0;
const node_http_1 = require("node:http");
function abortHandshake(socket, code, message, headers) {
    var _a;
    if (socket.writable) {
        message = (_a = message !== null && message !== void 0 ? message : node_http_1.STATUS_CODES[code]) !== null && _a !== void 0 ? _a : 'Aborted';
        headers = {
            Connection: 'close',
            'Content-Type': 'text/html',
            'Content-Length': String(Buffer.byteLength(message)),
            ...headers
        };
        socket.write(`HTTP/1.1 ${code} ${node_http_1.STATUS_CODES[code]}\r\n` +
            Object.entries(headers)
                .map(([k, v]) => `${k}: ${v}`)
                .join('\r\n') +
            '\r\n\r\n' +
            message);
    }
    socket.removeAllListeners('error');
    socket.destroy();
}
exports.abortHandshake = abortHandshake;
const tokenChars = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 0,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0,
    0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0
];
function parseSubprotocols(header) {
    const protocols = new Set();
    let start = -1;
    let end = -1;
    let i = 0;
    for (i; i < header.length; i++) {
        const code = header.charCodeAt(i);
        if (end === -1 && tokenChars[code] === 1) {
            if (start === -1)
                start = i;
        }
        else if (i !== 0 &&
            (code === 0x20 || code === 0x09)) {
            if (end === -1 && start !== -1)
                end = i;
        }
        else if (code === 0x2c) {
            if (start === -1) {
                throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1)
                end = i;
            const protocol = header.slice(start, end);
            if (protocols.has(protocol)) {
                throw new SyntaxError(`The "${protocol}" subprotocol is duplicated`);
            }
            protocols.add(protocol);
            start = end = -1;
        }
        else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
        }
    }
    if (start === -1 || end !== -1) {
        throw new SyntaxError('Unexpected end of input');
    }
    const protocol = header.slice(start, i);
    if (protocols.has(protocol)) {
        throw new SyntaxError(`The "${protocol}" subprotocol is duplicated`);
    }
    protocols.add(protocol);
    return protocols;
}
exports.parseSubprotocols = parseSubprotocols;
function isValidStatusCode(code) {
    return ((code >= 1000 &&
        code <= 1014 &&
        code !== 1004 &&
        code !== 1005 &&
        code !== 1006) ||
        (code >= 3000 && code <= 4999));
}
exports.isValidStatusCode = isValidStatusCode;

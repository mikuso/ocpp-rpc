// Excerpt of code taken from the 'ws' module (necessary because it is not exported)

// Copyright (c) 2011 Einar Otto Stangvik <einaros@gmail.com>

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import { STATUS_CODES } from 'node:http';
import { Socket } from 'node:net';

/**
 * Abort an attempted websocket handshake. Destroys the socket.
 * 
 * @param {Socket} socket Socket waiting for HTTP response
 * @param {number | string} code HTTP error code to send
 * @param {string} [message] HTTP plaintext error message to send
 * @param {Object.<string, *>} [headers] HTTP headers to send
 * @returns void
 */
export function abortHandshake(socket, code, message, headers = {}) {
    if (socket.writable) {
        if (STATUS_CODES[code] === undefined) {
            code = 500;
        }

        message = message ?? STATUS_CODES[code] ?? '';

        headers = {
            Connection: 'close',
            'Content-Type': 'text/html',
            'Content-Length': Buffer.byteLength(message),
            ...headers
        };

        socket.write(
            `HTTP/1.1 ${code} ${STATUS_CODES[code]}\r\n` +
            Object.keys(headers)
                .map((h) => `${h}: ${headers[h]}`)
                .join('\r\n') +
            '\r\n\r\n' +
            message
        );
    }

    socket.removeAllListeners('error');
    socket.destroy();
}


const tokenChars = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 0 - 15
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // 16 - 31
    0, 1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 0, // 32 - 47
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, // 48 - 63
    0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // 64 - 79
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, // 80 - 95
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, // 96 - 111
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0 // 112 - 127
];

/**
 * Parses a `sec-websocket-protocol` header value.
 * 
 * @param {string} secWebsocketProtocolHeader 
 * @returns {Set.<string>} Set of parsed protocols.
 */
export function parseSubprotocols(secWebsocketProtocolHeader) {
    const protocols = new Set();
    let start = -1;
    let end = -1;
    let i = 0;

    for (i; i < secWebsocketProtocolHeader.length; i++) {
        const code = secWebsocketProtocolHeader.charCodeAt(i);

        if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
        } else if (
            i !== 0 &&
            (code === 0x20 /* ' ' */ || code === 0x09) /* '\t' */
        ) {
            if (end === -1 && start !== -1) end = i;
        } else if (code === 0x2c /* ',' */) {
            if (start === -1) {
                throw new SyntaxError(`Unexpected character at index ${i}`);
            }

            if (end === -1) end = i;

            const protocol = secWebsocketProtocolHeader.slice(start, end);

            if (protocols.has(protocol)) {
                throw new SyntaxError(`The "${protocol}" subprotocol is duplicated`);
            }

            protocols.add(protocol);
            start = end = -1;
        } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
        }
    }

    if (start === -1 || end !== -1) {
        throw new SyntaxError('Unexpected end of input');
    }

    const protocol = secWebsocketProtocolHeader.slice(start, i);

    if (protocols.has(protocol)) {
        throw new SyntaxError(`The "${protocol}" subprotocol is duplicated`);
    }

    protocols.add(protocol);
    return protocols;
}

/**
 * Checks if a status code is allowed in a close frame.
 *
 * @param {number} code The status code
 * @returns {boolean} `true` if the status code is valid, else `false`
 */
export function isValidStatusCode(code) {
    return (
        (code >= 1000 &&
            code <= 1014 &&
            code !== 1004 &&
            code !== 1005 &&
            code !== 1006) ||
        (code >= 3000 && code <= 4999)
    );
}

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

const http = require('http');

function abortHandshake(socket, code, message, headers) {
    if (socket.writable) {
        message = message || http.STATUS_CODES[code];
        headers = {
            Connection: 'close',
            'Content-Type': 'text/html',
            'Content-Length': Buffer.byteLength(message),
            ...headers
        };

        socket.write(
            `HTTP/1.1 ${code} ${http.STATUS_CODES[code]}\r\n` +
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

function parseSubprotocols(header) {
    const protocols = new Set();
    let start = -1;
    let end = -1;
    let i = 0;

    for (i; i < header.length; i++) {
        const code = header.charCodeAt(i);

        if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
        } else if (
            i !== 0 &&
            (code === 0x20 /* ' ' */ || code === 0x09) /* '\t' */
        ) {
            if (end === -1 && start !== -1) end = i;
        } else if (code === 0x2c /* ',' */ ) {
            if (start === -1) {
                throw new SyntaxError(`Unexpected character at index ${i}`);
            }

            if (end === -1) end = i;

            const protocol = header.slice(start, end);

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

    const protocol = header.slice(start, i);

    if (protocols.has(protocol)) {
        throw new SyntaxError(`The "${protocol}" subprotocol is duplicated`);
    }

    protocols.add(protocol);
    return protocols;
}

/**
 * Checks if a status code is allowed in a close frame.
 *
 * @param {Number} code The status code
 * @return {Boolean} `true` if the status code is valid, else `false`
 * @public
 */
 function isValidStatusCode(code) {
    return (
      (code >= 1000 &&
        code <= 1014 &&
        code !== 1004 &&
        code !== 1005 &&
        code !== 1006) ||
      (code >= 3000 && code <= 4999)
    );
  }

module.exports = {
    abortHandshake,
    parseSubprotocols,
    isValidStatusCode,
};
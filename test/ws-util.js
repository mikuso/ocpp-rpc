// Excerpt of test code taken from the 'ws' module

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

import { deepStrictEqual, throws } from 'assert';
import { parseSubprotocols as parse } from '../lib/ws-util.js';

describe('subprotocol', () => {
    describe('parse', () => {
        it('parses a single subprotocol', () => {
            deepStrictEqual(parse('foo'), new Set(['foo']));
        });

        it('parses multiple subprotocols', () => {
            deepStrictEqual(
                parse('foo,bar,baz'),
                new Set(['foo', 'bar', 'baz'])
            );
        });

        it('ignores the optional white spaces', () => {
            const header = 'foo , bar\t, \tbaz\t ,  qux\t\t,norf';

            deepStrictEqual(
                parse(header),
                new Set(['foo', 'bar', 'baz', 'qux', 'norf'])
            );
        });

        it('throws an error if a subprotocol is empty', () => {
            [
                [',', 0],
                ['foo,,', 4],
                ['foo,  ,', 6]
            ].forEach((element) => {
                throws(
                    () => parse(element[0]),
                    new RegExp(
                        `^SyntaxError: Unexpected character at index ${element[1]}$`
                    )
                );
            });
        });

        it('throws an error if a subprotocol is duplicated', () => {
            ['foo,foo,bar', 'foo,bar,foo'].forEach((header) => {
                throws(
                    () => parse(header),
                    /^SyntaxError: The "foo" subprotocol is duplicated$/
                );
            });
        });

        it('throws an error if a white space is misplaced', () => {
            [
                ['f oo', 2],
                [' foo', 0]
            ].forEach((element) => {
                throws(
                    () => parse(element[0]),
                    new RegExp(
                        `^SyntaxError: Unexpected character at index ${element[1]}$`
                    )
                );
            });
        });

        it('throws an error if a subprotocol contains invalid characters', () => {
            [
                ['f@o', 1],
                ['f\\oo', 1],
                ['foo,b@r', 5]
            ].forEach((element) => {
                throws(
                    () => parse(element[0]),
                    new RegExp(
                        `^SyntaxError: Unexpected character at index ${element[1]}$`
                    )
                );
            });
        });

        it('throws an error if the header value ends prematurely', () => {
            ['foo ', 'foo, ', 'foo,bar ', 'foo,bar,'].forEach((header) => {
                throws(
                    () => parse(header),
                    /^SyntaxError: Unexpected end of input$/
                );
            });
        });
    });
});
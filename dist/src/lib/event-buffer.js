"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class EventBuffer {
    _emitter;
    _event;
    _collector;
    _buffer;
    constructor(emitter, event) {
        this._emitter = emitter;
        this._event = event;
        this._collector = (...args) => {
            this._buffer.push(args);
        };
        this._buffer = [];
        this._emitter.on(event, this._collector);
    }
    condense() {
        this._emitter.off(this._event, this._collector);
        return this._buffer;
    }
}
exports.default = EventBuffer;

import { EventEmitter } from "node:events";

export default class EventBuffer {
    private _emitter: EventEmitter;
    private _event: string;
    private _collector: (...args: any[]) => void;
    private _buffer: any[][];
    
    constructor(emitter: EventEmitter, event: string) {
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

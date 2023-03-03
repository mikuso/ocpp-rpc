/// <reference types="node" />
import { EventEmitter } from "node:events";
export default class EventBuffer {
    private _emitter;
    private _event;
    private _collector;
    private _buffer;
    constructor(emitter: EventEmitter, event: string);
    condense(): any[][];
}

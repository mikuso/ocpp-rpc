/// <reference types="node" />
/// <reference types="node" />
import { EventEmitter } from "stream";
declare class EventBuffer {
    private _emitter;
    private _event;
    private _collector;
    private _buffer;
    constructor(emitter: EventEmitter, event: string | symbol);
    condense(): any;
}
export default EventBuffer;

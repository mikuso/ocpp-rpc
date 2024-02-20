/// <reference types="node" />
/// <reference types="node" />
import { EventEmitter } from "stream";
declare class EventBuffer {
    _emitter: EventEmitter;
    _event: string | symbol;
    _collector: (...args: any) => void;
    _buffer: any;
    constructor(emitter: EventEmitter, event: string | symbol);
    condense(): any;
}
export default EventBuffer;

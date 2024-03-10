
/**
 * A util class to buffer events fired by an emitter.
 */
export class EventBuffer {

    /**
     * @param {import("node:events").EventEmitter} emitter 
     * @param {string | symbol} event 
     */
    constructor(emitter, event) {
        /** @type {import("node:events").EventEmitter} */
        this._emitter = emitter;

        /** @type {string | symbol} */
        this._event = event;

        /**
         * @param  {...*} args Event data
         */
        this._collecter = (...args) => {
            this._buffer.push(args);
        };

        /** @type {*[]} */
        this._buffer = [];
        this._emitter.on(event, this._collecter);
    }

    /**
     * Returns the collected event data.
     * 
     * @returns {*[]}
     */
    condense() {
        this._emitter.off(this._event, this._collecter);
        return this._buffer;
    }
}

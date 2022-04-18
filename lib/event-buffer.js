
class EventBuffer {
    constructor(emitter, event) {
        this._emitter = emitter;
        this._event = event;

        this._collecter = (...args) => {
            this._buffer.push(args);
        };
        this._buffer = [];
        this._emitter.on(event, this._collecter);
    }

    condense() {
        this._emitter.off(this._event, this._collecter);
        return this._buffer;
    }
}

module.exports = EventBuffer;
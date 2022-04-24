
class Queue {
    constructor({maxConcurrency} = {}) {
        this._pending = 0;
        this._concurrency = maxConcurrency ?? Infinity;
        this._queue = [];
    }

    push(fn) {
        return new Promise((resolve, reject) => {
            this._queue.push({
                fn,
                resolve,
                reject,
            });
    
            this._next();
        });
    }

    async _next() {
        if (this._pending >= this._concurrency) {
            return false;
        }
    
        const job = this._queue.shift();
        if (!job) {
            return false;
        }
    
        this._pending++;

        try {
            job.resolve(await job.fn());
        } catch (err) {
            job.reject(err);
        }

        this._pending--;
        this._next();
    }
}

module.exports = Queue;

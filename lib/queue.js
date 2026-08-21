import EventEmitter, { once } from "node:events";

/**
 * @typedef Job
 * @prop {function(): Promise.<void>} fn
 * @prop {function(void | PromiseLike.<void>): void} resolve
 * @prop {function(?any): void} reject
 */

/**
 * A Promise-resolution queue.
 */
export class Queue extends EventEmitter {
    constructor() {
        super();

        /**
         * Number of jobs remaining in the queue.
         * 
         * @type {number}
         */
        this._pending = 0;

        /**
         * Queue concurrency
         * 
         * @type {number}
         */
        this._concurrency = Infinity;

        /**
         * Job list.
         * 
         * @type {Array.<Job>}
         */
        this._queue = [];
    }

    get length() {
        return this._queue.length;
    }

    /**
     * 
     * @param {object} [options] 
     * @param {AbortSignal} [options.signal] 
     * @returns {Promise<void>}
     */
    async waitForEmpty(options) {
        options ??= {};

        if (!this.length) {
            return;
        }
        
        // else
        await once(this, 'empty', options);
    }

    /**
     * Change the queue concurrency.
     * 
     * @param {number} concurrency 
     */
    setConcurrency(concurrency) {
        this._concurrency = concurrency;
        this._next();
    }

    /**
     * Adds a job to the queue.
     * 
     * @param {function(): Promise.<void>} fn A callable async function.
     * @returns {Promise.<void>} A promise which resolves when the job has completed.
     */
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

    /**
     * Call the next function in the queue.
     * 
     * @returns {Promise.<void>}
     */
    async _next() {
        if (this._pending >= this._concurrency) {
            return;
        }
    
        const job = this._queue.shift();
        if (!job) {
            this.emit('empty');
            return;
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

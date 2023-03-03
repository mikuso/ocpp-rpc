export default class Queue {
    private _queue;
    private _pending;
    private _concurrency;
    constructor();
    setConcurrency(concurrency: number): void;
    push(fn: Function): Promise<unknown>;
    _next(): Promise<false | undefined>;
}

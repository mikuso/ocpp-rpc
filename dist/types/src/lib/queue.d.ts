export default class Queue {
    private _queue;
    private _pending;
    private _concurrency;
    constructor();
    setConcurrency(concurrency: number): void;
    push<T>(fn: () => Promise<T>): Promise<T>;
    _next(): Promise<false | undefined>;
}

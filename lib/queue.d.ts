declare class Queue {
    private _pending;
    private _concurrency;
    private _queue;
    constructor();
    setConcurrency(concurrency: number): void;
    push(fn: any): Promise<unknown>;
    private _next;
}
export default Queue;

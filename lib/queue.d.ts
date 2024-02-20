declare class Queue {
    _pending: number;
    _concurrency: number;
    _queue: any[];
    constructor();
    setConcurrency(concurrency: number): void;
    push(fn: any): Promise<unknown>;
    _next(): Promise<false | undefined>;
}
export default Queue;

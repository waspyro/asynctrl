export default class Tokenizer {
    #queue: EmptyCallback[] = []
    #arrAccess: 'pop' | 'shift' = 'pop'
    private concurrency: number

    constructor(concurrency = 1, lastInFirstOut = false) {
        if(lastInFirstOut) this.#arrAccess = 'shift'
        this.concurrency = concurrency
    }

    free = () => {
        if(this.#queue.length) this.#queue.shift()()
        else this.concurrency++
        return this
    }

    #hold = (onFree: EmptyCallback): number => {
        if(this.concurrency === 0) return 0 - this.#queue.push(onFree)
        setImmediate(() => onFree())
        return this.concurrency--
    }

    hold = this.#hold

    holdp = () => new Promise(resolve => this.hold(resolve as EmptyCallback))

    freet = (timeout = 0) => {
        setTimeout(this.free, timeout)
        return this
    }

    blockAsyncFn = (asyncFn: AsyncFn, ctx?: any) => (...args: any[]) =>
        this.hold(() => asyncFn.apply(ctx, args).finally(this.free))

    freeOnTimeout = (mcTime: number) => {
        this.hold = (onFree: EmptyCallback) => {
            this.freet(mcTime)
            return this.#hold(onFree)
        }
        return this
    }

    disableFreeOnTimeout = () => {
        this.hold = this.#hold
        return this
    }

}

type EmptyCallback = () => void
type AsyncFn = (...args: any[]) => Promise<any>
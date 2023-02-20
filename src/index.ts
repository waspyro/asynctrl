import {AsyncFnWrapper, DataCallback, NotifyCallback} from "./types";

export default class Tokenizer {
    #queue: NotifyCallback[] = []
    #arrAccess: 'pop' | 'shift' = 'pop'
    private concurrency: number

    constructor(concurrency = 1, lastInFirstOut = false) {
        if(lastInFirstOut) this.#arrAccess = 'shift'
        this.concurrency = concurrency
    }

    #free = () => {
        if(this.#queue.length) this.#queue.shift()!()
        else this.concurrency++
    }

    #freeOnce = () => {
        let freed = false
        return () => {
            if (freed) return false
            this.#free()
            return freed = true
        }
    }

    #hold = (onOpen: DataCallback) => {
        if(this.concurrency === 0) {
            let cancelled = false
            let free = (): void => {cancelled = true}
            this.#queue.push(() => cancelled || onOpen(free = this.#freeOnce()))
            return () => free()
        } else {
            const free = this.#freeOnce()
            setImmediate(() => onOpen(free))
            this.concurrency--
            return free
        }
    }

    hold = this.#hold

    holdp = (): Promise<()=>void> => new Promise(resolve => this.hold(resolve))

    wrap: AsyncFnWrapper = (fn, ctx?) => (...args) =>
        this.holdp().then(free => fn.apply(ctx, args).finally(free))

    autoFreeOnTimeout = (mcTime: number, allowFreeWhenResolved = false) => {
        this.hold = (onFree: DataCallback) => this.#hold((free) => {
            setTimeout(free, mcTime)
            onFree(() => allowFreeWhenResolved && free())
        })
        return this
    }

    disableAutoFreeOnTimeout = () => {
        this.hold = this.#hold
        return this
    }

}
export type NotifyCallback = () => void
export type DataCallback = (data: any) => void
export type AsyncFn = (...args: any[]) => Promise<any>
export type AsyncFnWrapper = <Args extends any[]>(fn: AsyncFn, ctx?: any)
    => (...args: Args) => ReturnType<typeof fn>
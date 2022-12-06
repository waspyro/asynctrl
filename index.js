export function Tokenizer(concurrency = 1) {
  const queue = []

  const next = () => {
    if(queue.length) queue.shift()(next)
    concurrency++
  }

  return cb => {
    if(!concurrency) return 0 - queue.push(cb)
    cb(next)
    return concurrency--
  }

}

export const AsyncTokenizer = (concurrency = 1) => {
  const tokenizer = Tokenizer(concurrency)
  return () => new Promise(resolve => tokenizer(resolve))
}

export const AsyncBlocker = (fn, concurrency) => {
  const getToken = AsyncTokenizer(concurrency)
  return function() {
    return getToken().then(next => fn.call(this, ...arguments).finally(next))
  }
}

export const AsyncDelayBlocker = (fn, concurrency, delay) => {
  const getToken = AsyncTokenizer(concurrency)
  return function () {
    return getToken().then(next => {
      setTimeout(next, delay)
      return fn.call(this, ...arguments)
    })
  }
}
export function Tokenizer(concurrency = 1) {
  const queue = []

  const next = () => {
    if(queue.length) queue.shift()(next)
    else concurrency++
  }

  return cb => {
    if(!concurrency) return 0 - queue.push(cb)
    cb(next)
    return concurrency--
  }

}

export const DelayTokenizer = (autoResolveDelayMc = 1000, tokenizer = Tokenizer(1)) => {
  return cb => tokenizer(next => {
    setTimeout(next, autoResolveDelayMc)
    cb()
  })
}

export const AsyncTokenizer = (tokenizer = Tokenizer(1)) => () =>
  new Promise(resolve => tokenizer(resolve))

export const AsyncDelayTokenizer = (autoResolveMc = 1000, tokenizer = Tokenizer(1)) =>
  new Promise(resolve => tokenizer(next => {
    setTimeout(next, autoResolveMc)
    resolve()
  }))

export const AsyncBlocker = (fn, tokenizer = Tokenizer(1)) => function() {
  return tokenizer().then(next => fn.call(this, ...arguments).finally(next))
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
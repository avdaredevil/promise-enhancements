/**
 * Promise enhancements for JavaScript by Apoorv Verma [AP] on 2/27/2020
 * 
 * This file contains all the static and dynamic changes to the Promise base class in JS
 * To improve complex chaining, allow delaying, sequencing the tasks, and more.
 */

const sleep = t => new Promise(res => setTimeout(res, t))

Promise.prototype.return = Promise.prototype.returns = function(ret) {return this.then(_ => ret)}

Promise.prototype.sleep = function(time) {
    return this.then(r => sleep(time).return(r))
}

Promise.prototype.map = function(callback) {
    return this.then(arr => {
        if (!(arr instanceof Array)) {
            console.warn(`Argument passed to Promise.map is not an array ${JSON.stringify(arr)}, will run as .then()`)
            return callback(arr)
        }
        return Promise.all(arr.map(callback))
    })
}

Promise.prototype.print = function(str, printer) {
    printer = printer || Promise.printer || console.log
    return this.then(d => (printer(
        typeof str === 'function' ? str(d) : str
    ), d))
}

Promise.prototype.sync = function(callback) {
    return this.then(arr => {
        if (!(arr instanceof Array)) return this.then(r => callback(r, 0))
        arr = arr.map(inp => (last, i) => callback(inp, i, last))
        return Promise.sync(arr)
    })
}

Promise.prototype.retry = function(callback, options = {}) {
    return this.then(val => {
        return Promise.retry(remainingAttempts => callback(val, remainingAttempts), options)
    })
}

Promise.sync = async (tasks, seedValue) => {
    const ret = []
    for (let task of tasks) {
        const idx = ret.length
        const value = typeof task === 'function'
            ? (idx < 0
                ? await task(seedValue, idx)
                : await task(ret[idx-1], idx))
            : await task
        ret.push(value)
    }
    return ret
}

Promise.retry = async (fn, options, _collectedErrors = []) => {
    const {times=1, delay=500, printErrors=false, errorPrefix = ''} = options
    if (times <= 0) throw Error(`${errorPrefix}Exhausted retry loops:\n${_collectedErrors.join('\n')}`)
    try {
        const out = await fn(times)
        return out
    } catch(e) {
        if (printErrors) console.error(`${errorPrefix}Retry loop failed:`, e)
        _collectedErrors.push(e)
    }
    await sleep(delay)
    return await Promise.retry(fn, Object.assign(options, {times: times - 1}), _collectedErrors)
}

Promise.firstSuccess = arr => {
    const {all, reject, resolve} = Promise
    return all(arr.map(p => p.then(
        val => reject(val),
        err => resolve(err),
    ))).then(
        errors => reject(errors),
        val => resolve(val),
    )
}

// If an unhandled Rejection Occurs, someone messed up their code, so let's fix it
typeof process != 'undefined' && process.on('unhandledRejection', console.log)

module.exports = Promise
module.exports.sleep = sleep

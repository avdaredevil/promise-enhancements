/**
 * Promise enhancements for JavaScript by Apoorv Verma [AP] on 2/27/2020
 * 
 * This file contains all the static and dynamic changes to the Promise base class in JS
 * To improve complex chaining, allow delaying, sequencing the tasks, and more.
 */

/**
 * Sleep for a specified amount of ms
 * @param {Number} t Time in ms
 * @returns {Promise}
 */
const sleep = t => new Promise(res => setTimeout(res, t))

/**
 * Uses the value provided as the argument as the seed for the next step
 * @param {any} ret What should be the output of this promise chain
 * @return {Promise}
 */
Promise.prototype.return = Promise.prototype.returns = function(ret) {return this.then(_ => ret)}

/**
 * Delay the next step of the promise chain by time specified
 * @param {Number} time What should be the output of this promise chain
 * @return {Promise}
 */
Promise.prototype.sleep = function(time) {
    return this.then(r => sleep(time).return(r))
}

/**
 * Convenience function provided when the output from the last promise returns an array
 * @param {function} callback Use like you would `.then()` assuming input is one of the elements
 * @return {Promise}
 */
Promise.prototype.map = function(callback) {
    return this.then(arr => {
        if (!(arr instanceof Array)) {
            console.warn(`Argument passed to Promise.map is not an array ${JSON.stringify(arr)}, will run as .then()`)
            return callback(arr)
        }
        return Promise.all(arr.map(callback))
    })
}

/**
 * Output printing function between chains that does not modify the value being passed along the promise chain
 * @param {string | function} str What to print OR callback that can use current data to print something
 * @param {function} printer Function to use to print, uses the function provided OR `Promise.printer()` (if defined) OR `console.log()`
 * @return {Promise}
 */
Promise.prototype.print = function(str, printer) {
    printer = printer || Promise.printer || console.log
    return this.then(d => (printer(
        typeof str === 'function' ? str(d) : str
    ), d))
}

/**
 * Runs the following callback on each element asynchrounously, but in sequence.
 * Unline `Promise.sync` all callback executions will get the input value from the previous value in the chain
 * Example:
 * ```js
 * await cb(input[0]) -> await cb(input[1]) -> ... -> await cb(input[n])
 * ```
 * 
 * @param {function} callback The promise callback
 * @return {Promise}
 */
Promise.prototype.sync = function(callback) {
    return this.then(arr => {
        if (!(arr instanceof Array)) return this.then(callback)
        arr = arr.map(inp => _ => callback(inp))
        return Promise.sync(arr)
    })
}

/**
 * Retry the current step in the promise chain till success or exausted retries
 * Example:
 * ```js
 * await cb(input[0]) -> await cb(input[1]) -> ... -> await cb(input[n])
 * ```
 * 
 * @param {function} callback The promise callback
 * @param {{times: 1, delay: 500, printErrors: false, errorPrefix: ''}} options Options to run this retry with
 * @return {Promise}
 */
Promise.prototype.retry = function(callback, options = {}) {
    return this.then(val => {
        return Promise.retry(_ => callback(val), options)
    })
}

/**
 * Runs an array of async functions in sequence (where the output of the previous callback is the input for the next)
 * Example:
 * ```js
 * await task0() -> await task1() -> ... -> await taskN()
 * ```
 * 
 * @param {function[]} tasks Array of tasks
 * @return {Promise<any[]>}
 */
Promise.sync = async tasks => {
    const ret = []
    for (let task of tasks) {
        const value = typeof task === 'function'
            ? await task(ret[ret.length-1])
            : await task
        ret.push(value)
    }
    return ret
}

/**
 * Retry function for repeated validation on Promise
 * @param {function} fn Simple async / sync function to run
 * @param {{times: 1, delay: 500, printErrors: false, errorPrefix: ''}} options Options to run this retry with
 * @return {Promise}
 */
Promise.retry = async (fn, options, _collectedErrors = []) => {
    const {times=1, delay=500, printErrors=false, errorPrefix = ''} = options
    if (times <= 0) throw Error(`${errorPrefix}Exhausted retry loops:\n${_collectedErrors.join('\n')}`)
    try {
        const out = await fn()
        return out
    } catch(e) {
        if (printErrors) console.error(`${errorPrefix}Retry loop failed:`, e)
        _collectedErrors.push(e)
    }
    await sleep(delay)
    return await Promise.retry(fn, Object.assign(options, {times: times - 1}), _collectedErrors)
}

/**
 * Like `Promise.map`, but will yield at the first success. It will fail if all cases are rejections
 * @param {function[]} arr Array of functions to run
 * @return {Promise}
 */
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
process.on('unhandledRejection', console.log)

module.exports = Promise
module.exports.sleep = sleep

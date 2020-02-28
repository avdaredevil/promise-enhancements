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
export function sleep(t: number): Promise<void>

export type Callback<T> = (elem: T) => any;
export type Callback<T, J> = (elem: T) => J | PromiseLike<J>;
export type LinePrinter<T> = (output: T) => T;
export type PrintAdapter = typeof console.log;
export type RetryOptions = {times: 1, delay: 500, printErrors: false, errorPrefix: ''};

declare global {
    interface Promise<T> {
        /**
         * Uses the value provided as the argument as the seed for the next step
         * @param {any} ret What should be the output of this promise chain
         * @return {Promise}
         */
        returns<J>(ret: J): Promise<J>;

        /**
         * Delay the next step of the promise chain by time specified
         * @param {Number} time What should be the output of this promise chain
         * @return {Promise} With value from last execution
         */
        sleep(time: Number): Promise<T>;

        /**
         * Convenience function provided when the output from the last promise returns an array
         * @param {function} callback Use like you would `.then()` assuming input is one of the elements
         * @return {Promise}
         */
        map<J>(callback: Callback<T, J>): Promise<J>[];

        /**
         * Output printing function between chains that does not modify the value being passed along the promise chain
         * @param {string | function} str What to print OR callback that can use current data to print something
         * @param {function} printer Function to use to print, uses the function provided OR `Promise.printer()` (if defined) OR `console.log()`
         * @return {Promise} With value from last promise execution
         */
        print(str: string | LinePrinter<T>, printer?: PrintAdapter): Promise<any>;

        /**
         * Runs the following callback on each element asynchrounously, but in sequence.
         * Unlike `Promise.sync` all callback executions will get the input value from the previous value in the chain
         * Example:
         * ```js
         * await cb(input[0]) -> await cb(input[1]) -> ... -> await cb(input[n])
         * ```
         * 
         * @param {function} callback The promise callback
         * @return {Promise}
         */
        sync<J>(callback: (elem: T, index: number, lastResult: J) => J | PromiseLike<J>): Promise<J[]>;

        /**
         * Retry the current step in the promise chain till success or exausted retries
         * Example:
         * ```js
         * await cb(input[0]) -> await cb(input[1]) -> ... -> await cb(input[n])
         * ```
         * 
         * @param {function} callback The promise callback
         * @param {RetryOptions} options Options to run this retry with
         * @return {Promise}
         */
        retry<J>(callback: (input: T, remainingAttempts: number) => J | PromiseLike<J>, options: RetryOptions = {}): Promise<J>;

        /**
         * Runs an array of async functions in sequence (where the output of the previous callback is the input for the next)
         * Example:
         * ```js
         * await task0() -> await task1() -> ... -> await taskN()
         * ```
         * 
         * @param {function[]} tasks Array of tasks
         * @param {any} seedValue What should the first task callback recieve as a value
         * @return {Promise<T[]>}
         */
        static sync(tasks: (lastResult: typeof seedValue | any, index: number) => any, seedValue?: any): Promise<any[]>;

        /**
         * Retry function for repeated validation on Promise
         * @param {function} fn Simple async / sync function to run
         * @param {RetryOptions} options Options to run this retry with
         * @return {Promise}
         */
        static retry<J>(
            fn: (attempt?: number) => J,
            options: RetryOptions,
            _collectedErrors: Error[],
        ): Promise<J>;

        /**
         * Like `Promise.map`, but will yield at the first success. It will fail if all cases are rejections
         * @param {function[]} arr Array of functions to run
         * @return {Promise}
         */
        static firstSuccess(arr: any): any;
    }
    interface PromiseConstructor {
        new <T>(callback: (resolve: (thenableOrResult?: T | PromiseLike<T>) => void, reject: (error?: any) => void, onCancel?: (callback: () => void) => void) => void): Promise<T>; 
    }
}

export as namespace Promise

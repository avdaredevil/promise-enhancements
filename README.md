# Promise-Enhancements
This library enhances the `Promise` base class by adding many various additional functions: (with examples)

## Installation
Standard npm install:
```shell
npm install promise-enhancements
```

## API
### Static functions
- `Promise.retry(fn, options)`: 
    > Retry function for repeated validation on Promise
    > Other options: `{times: 1, delay: 500, printErrors: false, errorPrefix: ''}`
    ```js
    async function worksFifthTime() {
        const c = window.count = (window.count || 0) + 1
        if (c > 4) return 'Yay'
        throw 'Nay'
    }
    Promise.retry(worksFifthTime, {retries: 2}) // Error: Nay, Nay
    Promise.retry(worksFifthTime, {retries: 8}) // Yay
    ```
    
- `Promise.firstSuccess(arr)`:
    > Like `Promise.map`, but will yield at the first success. It will fail if all cases are rejections
    ```js
    Promise.firstSuccess([
        Promise.reject(10),
        Promise.reject(20),
    ]) // = Error: 10, 20

    Promise.firstSuccess([
        Promise.reject(10),
        20,
        Promise.reject(30),
    ]) // = 20
    ```
- `Promise.sync(tasks)`
    > Runs an array of async functions in sequence (where the output of the previous callback is the input for the next)
    ```js
    const increment = n => n+1
    const getServerCount = async domain => /* returns a number */

    Promise.sync(['domain.com', getServerCount, increment, increment])
    // Output: ['domain.com', 10, 11, 12]
    ```

### Dynamic functions
- `<promise>.returns(value)`: 
    > Uses the value provided as the argument as the seed for the next step
    ```js
    Promise.resolve(1)
        .then(add1)
        .returns(0)
        .then(add1) // = await add1(0) = 1
    // While all steps in the chain ran, the next element after return uses the new value
    ```
- `<promise>.sleep(value)`: 
    > Sleeps on current step in the chain
    ```js
    Promise.resolve('//computername')
        .then(restartComputer)
        .return('//computername')
        .sleep(10e3) // 10s
        .then(checkIfOnline)
    ```
- `<promise>.print(value)`: 
    > Uses the value provided as the argument as the seed for the next step
    ```js
    Promise.resolve(1)
        .print('Starting Chain with 1')
        .then(add1)
        .print(v => `New Value = ${v}`)       // Callback print syntax
        .print('Ending Chain', console.error) // Prints as an error
    ```
- `<promise>.map(value)`: 
    > Same usage as `Array.map` but on promises! Same as `<promise>.then(arr => Promise.all(arr.map(callback))`.
    ```js
    Promise.resolve([1,2,3,4,5])
        .map(i => i**2)
        .map(fetchGithubUserByID) // Async task
        .map(i => i.user.image)

    // Fetches github profile images for Users: 1, 4, 9, 16, and 25
    ```
- `<promise>.sync(callback)`: 
    > Like `<promise>.map` but each task runs in sequence.
    > Task = `callback(input[task_index])` where task_index = `0..(input.length)`
    ```js
    Promise.resolve(['jon', 'ally', 'ap'])
        .sync(restartComputer)

    // Restart('jon'), if success only then restart('ally'), etc
    ```
# PPG's Promise Generator Library

## Queue

A [CSP][] style queue implemented with [Promises][].

### Creating queues
```js
var Queue = require('ppgs-pg').Channel;
var queue = new Queue(5); // buffer capacity 5
var queueWithUnlimitedCapacity = new Queue(); // unlimited buffer capacity
                                              // not recommended
```

### Putting items
```js
queue.put(x).then(() => console.log("put"));
```

### Getting items
```js
queue.get().then((x) => console.log(x));
```

### Getting current buffer size
```js
queue.size()
```

### Check if buffer is full or empty
```js
queue.isFull();
queue.isEmpty();
```

---

## Channel

A channel is essentially a queue with 0 capacity. Every put() only resolves when get() is called, and vise versa.

---

## Pipeline

A [pipeline][] implemenation that takes a series of asynchronous processes and run them [concurrently][].

### Rationale
Consider the case where multiple asynchronous functions that can be run concurrently need to be run on a number of inputs to complete a task.
```js
co(function *() {
    ...
    for (var w of workSet) {
        yield Promise.all([
            asyncFunc1(w),
            asyncFunc2(w),
            asyncFunc3(w),
            asyncFunc4(w),
            asyncFunc5(w),
            ...
        ]);
    }
    ...
});
```
If these asynchronous functions take different times to complete, the total time will be determined by the slowest function.

Instead of running all of the functions on a single input concurrently, a pipeline runs all of the functions on the same input sequentially, and different inputs concurrently. This has several significant advantages compared to the method above.

  - Each function only waits on the previous function with the help of buffers.
  - Multiple instances of the same function can be run to "speed up" slow ones.
  - Even if the functions must be run sequentially, pipeline can also provide concurrency.

### Creating Pipelines
```js
var Pipeline = require('ppgs-pg').Pipeline;
var pipeline = new Pipeline();
```

#### Adding Processes
Adding a generator
```js
pipeline.addStation({
    f: function *() {
    }
});
```
Adding a plain old function that returns promises
```js
pipeline.addStation({
    f: function () {
        return new Promise((resolve, reject) => {});
    }
});
```
Setting minWorkers and maxWorkers. These controls the minimum and maximum number of concurrent invocation of your process
```js
pipeline.addStation({
    f: function *() {
    },
    minWorkers: 2,
    maxWorkers: 5
});
```

### Putting Data
```js
pipeline.put(x).then(() => {});
```

### Getting Data
```js
pipeline.get().then((x) => {});
```

### Handling Errors
These have the same effect.
```js
pipeline.addStation({
    f: function *() {
        throw 'my error';
    }
});
```
```js
pipeline.addStation({
    f: function *() {
        yield Promise.reject('my error');
    }
});
```
```js
pipeline.addStation({
    f: function () {
        return Promise.reject('my error');
    }
});
```
```js
pipeline.addStation({
    f: function () {
        return new Promise((resolve, reject) => {
            reject('my error');
        })
    }
});
```

Catching the error.
```js
pipeline.get().catch((e) => { e == 'my error' });
```

### A Helper Function

A helper function that converts an array of functions/generator into a pipeline

```js
var pipelinefy = require('ppgs-pg').pipelinefy;

var pipeline = pipelinefy(
    // an array of functions/generators/station configuration objects
    [
        function (x) { /* ...  */ },
        function *(x) { /* ... */ },
        { // this has the same structure as Pipeline#addStation(opts)
            f: function *() { /* ...  */ },
            minWorker: 2,
            maxWorker: 10
        }
    ],
    // pipeline configurations & default station parameters
    {
        feed: new Queue(1),
        queueCapacity: 5,
        minWorker: 1,
        maxWorker: 1
    });

// use pipeline
```

### Benchmarking
```sh
npm run pipeline-benchmark
```

### An Example
pipeline-example.js

---

## Select

A function to select available channels and queues. It mimics the behavior of the [select][] statement in Go, except that it can only select reading.

This is an example that produces the first 10 elements in the Fibonacci sequence.

```js
"use strict";

var { Queue, Channel, select } = require('ppgs-pg');
var co = require('co');

var c = new Channel,
    next = new Channel,
    quit = new Channel;

co(function *() {
    var n0 = 0, n1 = 1;
    var f = select([next, quit]);
    while (true) {
        var { s, x } = yield f();
        if (s === next) {
            yield c.put(n1);
            var tmp = n1;
            n1 = n1 + n0;
            n0 = tmp;
        } else if (s === quit) {
            console.log('quit');
            break;
        }
    }
});

co(function *() {
    for (var i = 0; i < 10; ++i) {
        yield next.put(0);
    }
    yield quit.put(0);
});

co(function *() {
    while (true) {
        console.log(yield c.get());
    }
});
```

---

## Tests
```sh
npm test
```




[CSP]:http://en.wikipedia.org/wiki/Communicating_sequential_processes
[Promises]:https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise
[pipeline]:https://en.wikipedia.org/wiki/Pipeline_(computing)
[concurrently]:https://vimeo.com/49718712
[select]:https://tour.golang.org/concurrency/5

"use strict";

const co = require('co');
const pg = require('./index');

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms || 1)) }

var pipeline = pg.pipelinefy([
        function *(x) {
            yield sleep(2);
            return Promise.resolve(x + 1);
        },
        function *(x) {
            yield sleep(5);
            return Promise.resolve(x * 2);
        },
        {
            f: function *(x) {
                yield sleep(10);
                return Promise.resolve(x * x);
            }
        }
    ], {
        maxWorkers: 5,
        minWorkers: 2,
        queueCapacity: 1
    });

co(function *() {
    for (var i = 0; i < 10; ++i) {
        yield pipeline.put(i);
    }
});

co(function *() {
    for (var i = 0; i < 10; ++i) {
        console.log(yield pipeline.get());
    }
});

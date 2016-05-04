"use strict";

var co = require('co');
var nrand = require('gauss-random')
var Pipeline = require('./lib/pipeline');

// the maximum number of items each buffer in the pipeline can hold
const pipelineCapacity = 100;
// how many items are passed through the task
const testSize = 2000;
// how many asynchronous functions the task consists of
const fSize = 100;
// coefficient of time needed to run each asynchronous function
const fCoef = 3;
// maximum of instances each asynchronous function is allowed in the pipeline
const maxWorkers = 5;

// to simulate a time consuming work
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms || 1))
}

// to verify how many times the function is called.
var callCount = 0;

function fFactory() {
    // use a normal distributed random number generator
    var n = Math.floor(nrand() * fCoef);
    return () => {
        return wait(n).then(() => ++callCount)
    }
};

// all the asynchronous functions with the task
var fs = [];
for (var i = 0; i < fSize; ++i) {
    fs.push(fFactory());
}

co(function *() {

    // the Promise.all() benchmark
    yield co(function *() {
        console.time('promise.all');
        for (var i = 0; i < testSize; ++i) {
            yield Promise.all(fs.map(f => f(i)));
        }
        console.timeEnd('promise.all');
        console.log('promise.all: call count assert (callCount == testSize * fSize): ' + (callCount == testSize * fSize ? 'passed' : 'failed'));
    }).catch(e => console.error(e));

    // the pipeline benchmark
    yield co(function *() {
        callCount = 0;
        var pipeline = new Pipeline(pipelineCapacity);
        for (var f of fs) {
            pipeline.addStation({
                f: f,
                maxWorkers: maxWorkers
            });
        }

        co(function *() {
            console.time('pipeline');

            // The following three loops ensures the pipeline is saturated,
            // but not run too fast for fair comparison.

            // First put items into the pipeline with a number of fSize.
            // This is the least possible number that could make sure all the asynchronous
            // functions within the pipeline run concurrently.
            for (var i = 0; i < fSize; ++i) {
                yield pipeline.put(i);
            }
            // Only put one item in when one is out.
            // Otherwise the maxWorker feature in the pipeline will overdrive the pipeline,
            // making it an unfair comparison.
            // refer to lib/pipeline/multi-worker-station.js for detailed explanation how
            // maxWorker works
            for (var i = fSize; i < testSize; ++i) {
                yield pipeline.get();
                yield pipeline.put(i);
            }
            // Get the left items.
            for (var i = 0; i < fSize; ++i) {
                yield pipeline.get();
            }

            console.timeEnd('pipeline');
            console.log('pipeline: call count assert (callCount == testSize * fSize): ' + (callCount == testSize * fSize ? 'passed' : 'failed'));
        }).catch(e => console.error(e));
    }).catch(e => console.error(e));
});




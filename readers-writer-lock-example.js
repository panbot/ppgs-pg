"use strict";

const co = require('co');
const { Channel, select } = require('./index');

var chanRead = new Channel,
    chanWrite = new Channel;

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms || 1)) }

// co forever
var cof = function (f) {
    return co(function *() {
        while (true) {
            yield* f();
        }
    }).catch(e => console.error(e.stack || e));
}

function readerWriterFactory(doRead, doWrite) {
    var chanRead = new Channel,
        chanWrite = new Channel;

    var reads = [];

    var f = select([chanRead, chanWrite]);
    cof(function *() {
        var { s, x } = yield f();
        if (s === chanRead) {
            // no yield here so that the reads can be concurrent
            var p = doRead.apply(null, x.args);
            p.then(x.resolve, x.reject);
            reads.push(p);
        } else if (s === chanWrite) {
            // wait for all the reads to finish
            yield Promise.all(reads);
            reads = [];
            // wait for the write to complete
            yield doWrite.apply(null, x.args).then(x.resolve, x.reject);
        }
    });

    return {
        read: function read() {
            return new Promise((resolve, reject) => chanRead.put({ args: arguments, resolve: resolve, reject: reject }));
        },
        write: function write() {
            return new Promise((resolve, reject) => chanWrite.put({ args: arguments, resolve: resolve, reject: reject }));
        }

    }
}

// a pair of mock reader and mock writer
// that needs to be concurrently controlled using a readers-writer lock
var conCurrentRead = 0, conCurrentWrite = 0;

function doRead() {
    ++conCurrentRead;
    return sleep(Math.random() * 1000).then(() => {
        return Promise.resolve({
            reads: conCurrentRead--,
            writes: conCurrentWrite,
        });
    });
}

function doWrite() {
    ++conCurrentWrite;
    return sleep(Math.random() * 1000).then(() => {
        return Promise.resolve({
            reads: conCurrentRead,
            writes: conCurrentWrite--,
        });
    });
}

// the read() and write() here are concurrently controlled
var { read, write } = readerWriterFactory(doRead, doWrite);

// start some readers
for (var i = 0; i < 10; ++i) {
    cof(function *() {
        var r = yield read();
        console.log(`reading... { reads: ${r.reads}, writes: ${r.writes} }`);
        yield sleep(1000 * Math.random());
    });
}

// start some writers
for (var i = 0; i < 5; ++i) {
    cof(function *() {
        var r = yield write();
        console.log(`writing... { reads: ${r.reads}, writes: ${r.writes} }`);

        yield sleep(10000 * Math.random());
    });
}

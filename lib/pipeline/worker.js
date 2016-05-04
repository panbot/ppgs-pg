"use strict";

var co = require('co');
var Packet = require('./packet');

class Worker {
    constructor(opts) {
        this.name = opts.name || '';
        this.feed = opts.feed;
        this.drain = opts.drain;
        this.f = opts.f;

        this.working = false;
        this.stopped = false;

        this.done = new Promise(resolve => this.doneResolve = resolve);

        this.cycleResolves = [];

        this.start();
    }

    start() {
        var f = this.f,
            feed = this.feed,
            drain = this.drain,
            worker = this,
            cycles = 0;
        co(function *() {
            while (true) {
                while (cycles ++ > 0 && worker.cycleResolves.length) {
                    worker.cycleResolves.shift()();
                }

                if (worker.stopped) {
                    break;
                }

                var packet = yield feed.get(),
                    promise, product, error;

                if (packet.error) {
                    yield drain.put(packet);
                    continue;
                }

                worker.working = true;

                try {
                    if (f.constructor.name === 'GeneratorFunction') {
                        promise = co(f, packet.data);
                    } else {
                        promise = f(packet.data);
                    }

                    product = yield promise;
                } catch (e) {
                    error = e;
                }

                worker.working = false;

                yield drain.put(new Packet(product, error));
            }
        }).then(this.doneResolve).catch((e) => console.error(e.stack || e));
    }

    stop() {
        this.stopped = true;
        return this.done;
    }

    anotherCycle() {
        return new Promise(resolve => this.cycleResolves.push(resolve));
    }

    isWorking() {
        return this.working;
    }
}

module.exports = Worker;

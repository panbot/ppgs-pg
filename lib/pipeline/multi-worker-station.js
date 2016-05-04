"use strict";

var Worker = require('./worker');
var co = require('co');

class MultiWorkerStation {
    constructor(opts) {
        this.name = opts.name || '';
        this.feed = opts.feed;
        this.drain = opts.drain;
        this.f = opts.f;
        this.minWorkers = opts.minWorkers || 1;
        this.maxWorkers = opts.maxWorkers || 1;

        this.workers = [];

        this.start();
    }

    start() {
        for (var i = 0; i < this.minWorkers; ++i) {
            this.increaseWorkers();
        }

        var that = this, d = 0, d0, dd;
        co(function *() {
            while (true) {
                d0 = d;
                d = that.feed.size() - that.drain.size();
                dd = d - d0;

                if (d == 0) {

                } else if (d > 0) {
                    that.increaseWorkers();
                } else {
                    yield that.decreaseWorkers();
                }

                yield Promise.race(that.workers.map(w => w.anotherCycle()));
            }
        }).catch(e => console.error(e.stack || e));
    }

    increaseWorkers() {
        if (this.workers.length >= this.maxWorkers) {
            return;
        }

        var worker = new Worker({
            feed: this.feed,
            drain: this.drain,
            f: this.f
        });

        this.workers.push(worker);
    }

    decreaseWorkers() {
        if (this.workers.length <= this.minWorkers) {
            return Promise.resolve(null);
        }

        return this.workers[this.workers.length - 1].stop().then(() => this.workers.pop());
    }

    stopAllWorkers() {
        for (var ps = [], i = this.minWorkers; i < this.workers.length; ++i) {
            ps.push(this.workers[i].stop());
        }

        return Promise.all(ps).then(() => {
            while (this.workers.length > this.minWorkers) {
                this.workers.pop();
            }
        });
    }

    isWorking() {
        return this.workers.findIndex(o => o.isWorking()) >= 0;
    }

    getCurrentWorkers() {
        return this.workers.length;
    }
}

module.exports = MultiWorkerStation;

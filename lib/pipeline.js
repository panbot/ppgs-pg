"use strict";

var Packet = require('./pipeline/packet'),
    Queue = require('./queue'),
    stationFactory = require('./pipeline/station-factory');

class Pipeline {
    constructor(opts) {
        this.drain = this.feed = opts && opts.feed || new Queue(10);

        this.queueCapacity = opts && opts.queueCapacity || 10;

        if (typeof this.queueCapacity != 'number') {
            throw 'wrong queueCapacity type, int expected'
        }

        if (this.queueCapacity < 0) {
            throw 'queueCapacity must not be less than 0'
        }

        this.stations = [];
    }

    put(o) {
        return this.feed.put(new Packet(o))
    }

    get() {
        return this.drain.get().then((packet) => {
            if (packet.error) {
                return Promise.reject(packet.error)
            } else {
                return Promise.resolve(packet.data)
            }
        })
    }

    addStation(opts) {
        opts.feed = this.drain;
        opts.drain = new Queue(this.queueCapacity);
        var s = stationFactory(opts);
        this.stations.push(s);
        this.drain = opts.drain;
    }

    getConcurrency() {
        return this.stations.filter((s) => s.isWorking()).length;
    }
}

module.exports = Pipeline;

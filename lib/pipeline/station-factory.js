"use strict";

var Worker = require('./worker'),
    MultiWorkerStation = require('./multi-worker-station');

function stationFactory(opts) {
    if (!opts.f) {
        throw 'missing f'
    }

    if (!opts.feed) {
        throw 'missind feed'
    }

    if (!opts.drain) {
        throw 'missing drain'
    }

    if (opts.maxWorkers) {
        if (typeof opts.maxWorkers != 'number') {
            throw 'wrong type of maxWorkers, int required'
        }

        opts.maxWorkers = parseInt(opts.maxWorkers);

        if (opts.maxWorkers < 1) {
            throw 'maxWorkers must be greater than 0'
        }

        if (opts.minWorkers) {
            if (typeof opts.minWorkers != 'number') {
                throw 'wrong type of minWorkers, int required'
            }

            opts.minWorkers = parseInt(opts.minWorkers);

            if (opts.minWorkers < 1) {
                throw 'minWorkers must be greater than 0'
            }

            if (opts.minWorkers > opts.maxWorkers) {
                throw 'minWorkers cannot be greater than maxWorkers'
            }
        }
    }

    if (opts.maxWorkers && opts.maxWorkers > 1) {
        return new MultiWorkerStation(opts);
    } else {
        return new Worker(opts);
    }
}

module.exports = stationFactory;

"use strict";

exports.Channel = require('./lib/channel');

exports.Queue = require('./lib/queue');

exports.Pipeline = require('./lib/pipeline');

exports.pipelinefy = function (arrOfFuncs, opts) {
    opts = opts || {};

    var pipeline = new exports.Pipeline({
        queueCapacity: opts.queueCapacity,
        feed: opts.feed
    });

    for (var f of arrOfFuncs) {
        if (typeof f == 'object') {
            pipeline.addStation(f);
        } else {
            pipeline.addStation({
                f: f,
                maxWorker: opts.maxWorker,
                minWorker: opts.minWorker
            });
        }

    }

    return pipeline;
};

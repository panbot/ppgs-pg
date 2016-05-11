"use strict";

var Queue = require('./queue');
var Channel = require('./channel');
var co = require('co');

module.exports = function (selectables) {
    var resolveChannel = new Channel();

    var run = function (s) {
        co(function *() {
            while (true) {
                var x = yield s.get();
                var r = yield resolveChannel.get();
                r({ s: s, x: x });
            }
        }).catch(e => console.error(e.stack || e));
    }

    for (var s of selectables) {
        run(s);
    }

    return function () {
        return new Promise(resolve => resolveChannel.put(resolve));
    };
};

"use strict";

var sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms || 1))
}
exports.sleep = sleep;

exports.resolved = (p) => {
    var resolved = false;
    p.then(() => resolved = true);
    return sleep().then(() => { return Promise.resolve(resolved) })
}

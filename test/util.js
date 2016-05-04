"use strict";

var wait = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms || 1))
}
exports.wait = wait;

exports.resolved = (p) => {
    var resolved = false;
    p.then(() => resolved = true);
    return wait().then(() => { return Promise.resolve(resolved) })
}

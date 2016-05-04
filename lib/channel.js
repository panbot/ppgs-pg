"use strict";

class Channel {
    constructor() {
        this.getters = [];
        this.putters = [];
    }

    get() {
        if (this.putters.length) {
            return Promise.resolve(this.putters.shift()());
        } else {
            var p = new Promise(resolve => this.getters.push(resolve));

            return p;
        }
    }

    put(o) {
        if (this.getters.length) {
            this.getters.shift()(o);
            return Promise.resolve(null);
        } else {
            var p = new Promise(resolve => this.putters.push(() => { resolve(); return o }));
            return p;
        }
    }
}

module.exports = Channel;

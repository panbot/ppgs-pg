"use strict";

class Queue {
    constructor(capacity) {
        if (capacity) {
            if (typeof capacity != 'number') {
                throw 'wrong type of capacity, number required'
            }

            capacity = parseInt(capacity);

            if (capacity < 0) {
                throw 'capacity must be greater than 0'
            }
        } else {
            capacity = Infinity
        }

        this.capacity = capacity;

        this.getters = [];
        this.putters = [];

        this.buf = [];
    }

    get() {
        if (this.isEmpty()) {
            var p = new Promise(
                resolve => this.getters.push(resolve)
            ).then(
                () => this.get()
            );

            return p;
        } else {
            var ret = this.buf.shift();

            if (this.putters.length) {
                this.putters.shift()();
            }

            return Promise.resolve(ret);
        }
    }

    put(o) {
        if (this.isFull()) {
            var p = new Promise(
                resolve => this.putters.push(resolve)
            ).then(
                () => this.put(o)
            );

            return p;
        } else {
            this.buf.push(o);

            if (this.getters.length) {
                this.getters.shift()();
            }

            return Promise.resolve(this);
        }
    }

    isFull() {
        return this.buf.length === this.capacity;
    }

    isEmpty() {
        return this.buf.length === 0;
    }

    size() {
        return this.buf.length;
    }
}

module.exports = Queue;
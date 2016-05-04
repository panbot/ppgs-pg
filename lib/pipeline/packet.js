"use strict";

class Packet {
    constructor(data, error) {
        this.data = data;
        this.error = error;
    }
}

module.exports = Packet;

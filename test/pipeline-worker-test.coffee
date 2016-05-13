"use strict";

chai = require 'chai'
chai.use require 'chai-as-promised'
chai.should()
expect = chai.expect
{ resolved, sleep } = require './util'
Worker = require '../lib/pipeline/worker'
Packet = require '../lib/pipeline/packet'
{ Queue } = require '../index'

describe 'Worker', ->
    it 'gets items from feed and puts the results into drain after processing', ->
        feed = new Queue(5)
        drain = new Queue(5)
        f = (o) ->
            yield sleep(10)
            Promise.resolve o * 2

        w = new Worker({
                feed: feed,
                drain: drain,
                f: f
            })

        list = [1, 2, 3, 4, 5]
        target = list.map (o) -> o * 2

        feed.put new Packet(i) for i in list
        Promise.all(drain.get().then((p) -> Promise.resolve(p.data)) for i in list).should.eventually.eql target

    it 'puts a Packet with error into the drain in case of an exception', ->
        test = (f) ->
            feed = new Queue(5)
            drain = new Queue(5)

            w = new Worker({
                    feed: feed,
                    drain: drain,
                    f: f
                })

            o = Math.random()
            feed.put new Packet(o)
            drain.get().then((p) -> Promise.resolve(p.error)).should.eventually.equal o

        p = []

        p.push(test (o) ->
            new Promise (resolve, reject) ->
                reject(o)
        )

        p.push(test (o) ->
            Promise.reject o
        )

        p.push(test (o) ->
            yield sleep 1
            throw o
            Promise.resolve o
        )

        Promise.all p

    it 'generates cycles', ->
        feed = new Queue(5)
        drain = new Queue(5)
        f = (o) -> Promise.resolve o

        w = new Worker({
                feed: feed,
                drain: drain,
                f: f
            })

        p = []

        o1 = Math.random()
        p.push w.anotherCycle().then(-> Promise.resolve o1).should.eventually.equal o1
        feed.put new Packet(Math.random())

        o2 = Math.random()
        p.push w.anotherCycle().then(-> Promise.resolve o2).should.eventually.equal o2
        feed.put new Packet(Math.random())

        Promise.all p

    it 'generates a state that shows if the worker is working', ->
        feed = new Queue(5)
        drain = new Queue(5)
        f = (o) ->
            yield sleep 10
            Promise.resolve o

        w = new Worker({
                feed: feed,
                drain: drain,
                f: f
            })

        o = Math.random()
        feed.put new Packet(Math.random())
        sleep(1).then(-> w.isWorking()).should.eventually.be.true

    it 'can be stopped', ->
        feed = new Queue(5)
        drain = new Queue(5)
        f = (o) -> Promise.resolve o

        w = new Worker({
                feed: feed,
                drain: drain,
                f: f
            })

        o = Math.random()
        feed.put Math.random()
        w.stop().then(-> Promise.resolve o).should.eventually.equal o

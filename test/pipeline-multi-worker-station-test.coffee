"use strict";

chai = require 'chai'
chai.use require 'chai-as-promised'
chai.should()
expect = chai.expect
{ resolved, sleep } = require './util'
Worker = require '../lib/pipeline/worker'
Station = require '../lib/pipeline/multi-worker-station'
Packet = require '../lib/pipeline/packet'
{ Queue } = require '../index'
co = require 'co'

describe 'MultiWorkerStation', ->
    it 'starts a minimum number of workers according to configuration', ->
        feed = new Queue(5)
        drain = new Queue(5)
        f = (o) -> Promise.resolve o

        s = new Station({
                feed: feed,
                drain: drain,
                f: f,
                minWorkers: 2
                maxWorkers: 5
            })

        expect(s.getCurrentWorkers()).to.equal 2

    it 'schedules a maximum number of workers according to configuration', ->
        feed = new Queue(100)
        drain = new Queue(100)
        f = (o) ->
            yield sleep 10
            Promise.resolve o

        s = new Station({
                feed: feed,
                drain: drain,
                f: f,
                minWorkers: 2
                maxWorkers: 5
            })

        co ->
            while true
                yield feed.put Math.random()
                yield sleep 1

        co ->
            while true
                yield drain.get()
                yield sleep 1

        maxWorkers = 0;
        co ->
            while true
                yield sleep 5
                maxWorkers = Math.max maxWorkers, s.getCurrentWorkers()

        sleep(50).then(-> maxWorkers).should.eventually.equal 5

    it 'generates a state that shows if the any of the workers is working', ->
        feed = new Queue(100)
        drain = new Queue(100)
        f = (o) ->
            yield sleep 10
            yield Promise.resolve o

        s = new Station({
                feed: feed,
                drain: drain,
                f: f,
                minWorkers: 2
                maxWorkers: 5
            })

        expect(s.isWorking()).to.be.false

        co ->
            while true
                yield feed.put Math.random()
                yield sleep 1

        co ->
            while true
                yield drain.get()
                yield sleep 1

        sleep(5).then(-> s.isWorking()).should.eventually.be.true

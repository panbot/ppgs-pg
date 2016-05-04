"use strict";

chai = require 'chai'
chai.use require 'chai-as-promised'
chai.should()
expect = chai.expect
{ resolved, wait } = require './util'
co = require 'co'
Pipeline = require '../lib/pipeline.js'

describe 'Pipeline', ->
    it 'processes data with configured functions in configured order', ->
        p = new Pipeline
        p.addStation({
                f: (o) -> Promise.resolve o + 1
            })

        p.addStation({
                f: (o) -> Promise.resolve o * 2
            })

        list = [1, 2, 3, 4, 5]
        target = list.map (o) -> (o + 1) * 2
        p.put i for i in list

        Promise.all(p.get() for i in list).should.eventually.eql target

    it 'does this concurrently', ->
        p = new Pipeline
        p.addStation({
                f: (o) ->
                    yield wait 5
                    Promise.resolve o + 1
            })

        p.addStation({
                f: (o) ->
                    yield wait 5
                    Promise.resolve o * 2
            })

        co ->
            while true
                yield p.put 1
                yield wait 1

        co ->
            while true
                yield p.get()

        cMax = 0
        co ->
            while true
                cMax = Math.max cMax, p.getConcurrency()
                yield wait 1

        wait(50).then(-> Promise.resolve cMax).should.eventually.equal 2

    describe '#get()', ->
        it 'rejects with error if any happens', ->
            p = new Pipeline
            p.addStation({
                    f: (o) ->
                        throw 'mock err'
                })

            p.put 1
            p.get().should.eventually.be.rejectedWith 'mock err'

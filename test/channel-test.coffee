"use strict";

chai = require 'chai'
chai.use require 'chai-as-promised'
chai.should()
expect = chai.expect
{ resolved } = require './util'
{ Channel } = require '../index'

describe 'Channel', ->
    describe '#get()', ->
        c = new Channel()
        p = c.get()

        it 'should retuns a promise', ->
            p.should.be.an.instanceof Promise

        describe 'the promise', ->
            it 'should not resovle before put', ->
                resolved(p).should.eventually.be.false

            it 'should resolve to whatever is put', ->
                o = Math.random()
                c.put o
                p.should.eventually.equal o

    describe '#put()', ->
        c = new Channel()
        o = Math.random()
        p = c.put(o)

        it 'should retuns a promise', ->
            p.should.be.an.instanceof Promise

        describe 'the promise', ->
            it 'should not resovle before get', ->
                resolved(p).should.eventually.be.false

            it 'should resolve after get and pass the item', ->
                Promise.all [
                    resolved(p).should.eventually.be.true
                    c.get().should.eventually.equal o
                ]

    it 'should follow FIFO principle', ->
        c = new Channel()
        list = (Math.random() for i in [1..5])
        result = []

        c.put i for i in list

        Promise.all(
            c.get() for i in [1..list.length]
        ).should.eventually.eql list


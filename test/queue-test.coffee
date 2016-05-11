"use strict";

chai = require 'chai'
chai.use require 'chai-as-promised'
co = require 'co'
chai.should()
expect = chai.expect
{ resolved } = require './util'
{ Queue } = require '../index';

describe 'Queue', ->

    describe '#put()', ->
        q = new Queue(1) # queue capacity = 1
        p = q.put 1      # this immediately resolve
        p2 = q.put 2     # this doesn't

        it 'should return a promise', ->
            p.should.be.an.instanceof Promise

        describe 'the promise', ->
            it 'should resolve if the queue is not full', ->
                resolved(p).should.eventually.be.true

            it 'should not resolve if the queue is full', ->
                resolved(p2).should.eventually.be.false

    describe '#get()', ->
        q = new Queue(1)
        p = q.get()
        p2 = q.get()

        it 'should return a promise', ->
            p.should.be.an.instanceof Promise

        describe 'the promise', ->
            it 'should resolve to whatever is put', ->
                o = Math.random()
                q.put o
                Promise.all [
                    p.should.eventually.equal o
                    resolved(p).should.eventually.be.true
                ]

        describe 'the promise', ->
            it 'should not resolve before put', ->
                resolved(p2).should.eventually.be.false

    describe '#size()', ->
        it 'should return the current size of the queue', ->
            q = new Queue(10)
            q.put 1
            q.put 2

            expect(q.size()).to.equal 2

    describe '#isEmpty()', ->
        it 'should return true if the queue is empty and false if otherwise', ->
            q = new Queue(10)
            expect(q.isEmpty()).to.be.true

            q.put 1
            expect(q.isEmpty()).to.be.false

    describe '#isFull()', ->
        it 'should return true if the queue is full and false if otherwise', ->
            q = new Queue(1)
            expect(q.isFull()).to.be.false

            q.put 1
            expect(q.isFull()).to.be.true

    it 'should follow FIFO principle', ->
        q = new Queue();
        list = (Math.random() for i in [1..5])
        result = []

        q.put i for i in list

        Promise.all(q.get() for i in [1..list.length]).should.eventually.eql list

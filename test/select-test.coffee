"use strict";

chai = require 'chai'
chai.use require 'chai-as-promised'
co = require 'co'
chai.should()
expect = chai.expect
{ resolved } = require './util'
{ Queue, Channel, select } = require '../index'

describe 'select()', ->
    c1 = new Channel
    c2 = new Channel
    s = select [c1, c2]
    p = s()

    it 'accepts an array of "selectables" and returns a function that returns a promise when called', ->
        s.should.be.a('function')
        p.should.be.an.instanceof Promise

    describe 'the promise', ->
        it 'should only resolve when one of the selectables receives an item', ->
            o = Math.random()
            c1.put o
            p.should.eventually.eql { s: c1, x: o }

describe 'select()', ->
    it "should produce everything that's put into the selectables", ->
        c1 = new Channel
        c2 = new Channel
        s = select [c1, c2]

        e1 = { s: c1, x: Math.random() }
        e2 = { s: c1, x: Math.random() }
        e3 = { s: c2, x: Math.random() }
        e4 = { s: c1, x: Math.random() }
        e5 = { s: c1, x: Math.random() }
        e6 = { s: c2, x: Math.random() }
        e7 = { s: c2, x: Math.random() }

        n = [ e1, e2, e3, e4, e5, e6, e7 ]

        # the following order is determined by the nature of channels
        # consective put() on the same channel will be separated by other channels
        e = [
            e1
            e3
            e2
            e6
            e4
            e7
            e5
        ]

        t.s.put(t.x) for t in n
        Promise.all(
            s() for _ in n
        ).should.eventually.eql e

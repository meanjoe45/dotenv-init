
'use strict'

var sinon = require('sinon')
var Lab = require('lab')
var lab = exports.lab = Lab.script()
var describe = lab.experiment
var before = lab.before
var beforeEach = lab.beforeEach
var afterEach = lab.afterEach
var it = lab.test
var dotenvInit = require('../init')
var s

describe('dotenv-init', function () {
  beforeEach(function (done) {
    s = sinon.sandbox.create()
    done()
  })

  afterEach(function (done) {
    s.restore()
    done()
  })

  describe('config', function () {
    beforeEach(function (done) {
      done()
    })

    it('takes option for safe', function (done) {
      done()
    })
  })

  describe('parse', function () {
    before(function (done) {
      dotenvInit({
        args: './init.js',
        output: 'normal',
        fileOutput: 'normal',
        filename: '.env',
        safeFilename: '.env.example'
      })
      done()
    })

    it('should return an object', function (done) {
      done()
    })
  })
})

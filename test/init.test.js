
'use strict'

// Node modules
var fs = require('fs')

// Dependency modules

// Dev Dependency modules
require('should')
var sinon = require('sinon')
var Lab = require('lab')

// System Under Test (SUT)
var init = require('../init')

var lab = exports.lab = Lab.script()
var describe = lab.experiment
// var before = lab.before
var beforeEach = lab.beforeEach
var afterEach = lab.afterEach
var it = lab.test
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

  describe('#init() (parse)', function () {
    var defaultArgs
    var consoleLog
    var statSync
    var stats
    var readFileSync
    var writeFileSync

    beforeEach(function (done) {
      defaultArgs = {
        output: 'normal',
        fileOutput: 'normal',
        safe: false,
        filename: '.env',
        safeFilename: '.env.example',
        args: ['file.js']
      }

      stats = sinon.createStubInstance(fs.Stats)
      stats.isFile.returns(true)

      consoleLog = sinon.stub(console, 'log')
      statSync = sinon.stub(fs, 'statSync').returns(stats)
      readFileSync = sinon.stub(fs, 'readFileSync').returns('')
      writeFileSync = sinon.stub(fs, 'writeFileSync')

      done()
    })

    afterEach(function (done) {
      consoleLog.restore()
      statSync.restore()
      readFileSync.restore()
      writeFileSync.restore()

      done()
    })

    it('takes option for output', function (done) {
      defaultArgs.output = 'silent'

      init(defaultArgs)
      consoleLog.callCount.should.eql(0)

      done()
    })

    it('takes option for safe', function (done) {
      defaultArgs.safe = true

      init(defaultArgs)
      writeFileSync.callCount.should.eql(2)

      done()
    })

    it('takes option for filename', function (done) {
      defaultArgs.filename = '.test'

      init(defaultArgs)
      writeFileSync.args[0][0].should.eql(defaultArgs.filename)

      done()
    })

    it('takes option for safeFilename', function (done) {
      defaultArgs.safe = true
      defaultArgs.safeFilename = '.test.example'

      init(defaultArgs)
      writeFileSync.args[1][0].should.eql(defaultArgs.safeFilename)

      done()
    })

    it('takes a list of files to scan as args', function (done) {
      init(defaultArgs)
      statSync.args[0][0].should.containEql(defaultArgs.args[0])

      done()
    })
  })
})

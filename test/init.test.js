
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
// var after = lab.after
var beforeEach = lab.beforeEach
var afterEach = lab.afterEach
var it = lab.test
var s

var file1 = `
/*
 * Copyright (c) 2017 test1, All rights reserved
 */
'use strict';

require('dotenv-safe').load();
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var testObj = {
    testString: process.env.TEST_STRING || 'testString',
    testNumber: process.env.TEST_NUMBER || 'testNumber',
    testBoolean: process.env.TEST_BOOLEAN || 'testBoolean',
    testRequired: process.env.TEST_REQUIRED
};
`
var file2 = `
//
// Copyright (c) 2017 test2, All rights reserved
//
var testString = process.env.TEST_STRING || 'testString';
var testNumber = process.env.TEST_NUMBER || 100;
var testBoolean = process.env.TEST_BOOLEAN || true;
var testRequired = process.env.TEST_REQUIRED;

// commentedEnvvar = process.env.COMMENTED_ENVVAR;
`

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
    var fileStats
    var dirStats
    var readFileSync
    var writeFileSync

    beforeEach(function (done) {
      defaultArgs = {
        output: 'normal',
        fileOutput: 'normal',
        safe: false,
        filename: '.env',
        safeFilename: '.env.example',
        args: ['file1.js', 'file2.js']
      }

      fileStats = sinon.createStubInstance(fs.Stats)
      fileStats.isFile.returns(true)
      fileStats.isDirectory.returns(false)
      dirStats = sinon.createStubInstance(fs.Stats)
      dirStats.isFile.returns(false)
      fileStats.isDirectory.returns(true)

      consoleLog = sinon.stub(console, 'log')
      statSync = sinon.stub(fs, 'statSync')
      readFileSync = sinon.stub(fs, 'readFileSync')
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

    it('takes option for console output', function (done) {
      // TODO: create assertions to test validity
      statSync.returns(fileStats)
      readFileSync.returns(file1)

      defaultArgs.output = 'silent'

      init(defaultArgs)
      consoleLog.callCount.should.eql(0)

      consoleLog.reset()
      defaultArgs.output = 'normal'
      init(defaultArgs)

      consoleLog.reset()
      defaultArgs.output = 'verbose'
      init(defaultArgs)

      done()
    })

    it('takes option for file output', function (done) {
      // TODO: create assertions to test validity
      statSync.returns(fileStats)
      readFileSync.returns('empty file')

      defaultArgs.fileOutput = 'minimal'
      init(defaultArgs)

      defaultArgs.fileOutput = 'normal'
      statSync.returns(dirStats)
      init(defaultArgs)

      defaultArgs.fileOutput = 'verbose'
      statSync.returns(fileStats)
      init(defaultArgs)

      done()
    })

    it('takes option for safe', function (done) {
      statSync.returns(fileStats)
      readFileSync.returns('empty file')

      defaultArgs.safe = true

      init(defaultArgs)
      writeFileSync.callCount.should.eql(2)

      done()
    })

    it('takes option for filename', function (done) {
      statSync.returns(fileStats)
      readFileSync.returns('empty file')

      defaultArgs.filename = '.test'

      init(defaultArgs)
      consoleLog.restore()
      writeFileSync.args[0][0].should.eql(defaultArgs.filename)

      done()
    })

    it('takes option for safeFilename', function (done) {
      statSync.returns(fileStats)
      readFileSync.returns('empty file')

      defaultArgs.safe = true
      defaultArgs.safeFilename = '.test.example'

      init(defaultArgs)
      writeFileSync.args[1][0].should.eql(defaultArgs.safeFilename)

      done()
    })

    it('takes a list of files to scan as args', function (done) {
      statSync.returns(fileStats)
      readFileSync.withArgs(sinon.match('file1.js'), sinon.match.string).returns(file1)
      readFileSync.withArgs(sinon.match('file2.js'), sinon.match.string).returns(file2)

      init(defaultArgs)
      statSync.args[0][0].should.containEql(defaultArgs.args[0])
      statSync.args[1][0].should.containEql(defaultArgs.args[1])

      done()
    })

    it('should not allow options for filename and safeFilename be the same', function (done) {
      // TODO: create assertions to test validity
      statSync.returns(fileStats)
      readFileSync.returns('empty file')

      defaultArgs.safe = true
      defaultArgs.output = 'silent'
      defaultArgs.filename = '.test'
      defaultArgs.safeFilename = '.test'

      init(defaultArgs)
      consoleLog.reset()

      defaultArgs.output = 'normal'
      init(defaultArgs)
      consoleLog.restore()

      done()
    })

    it('should exclude file list items that are directories', function (done) {
      // TODO: create assertions to test validity
      statSync.onFirstCall().returns(fileStats)
              .onSecondCall().returns(dirStats)
      readFileSync.returns(file1)

      init(defaultArgs)
      statSync.args[0][0].should.containEql(defaultArgs.args[0])
      statSync.args[1][0].should.containEql(defaultArgs.args[1])
      readFileSync.callCount.should.eql(1)

      done()
    })

    it('should exclude file list items that do not exist', function (done) {
      // TODO: create assertions to test validity
      statSync.onFirstCall().throws()
              .onSecondCall().returns(fileStats)
      readFileSync.returns(file1)

      init(defaultArgs)
      // (() => init(defaultArgs)).should.throw()
      // statSync.args[0][0].should.containEql(defaultArgs.args[0])
      // statSync.args[1][0].should.containEql(defaultArgs.args[1])
      // readFileSync.callCount.should.eql(1)

      done()
    })

    it('should scan all files for process environment variables', function (done) {
      statSync.returns(fileStats)
      readFileSync.withArgs(sinon.match('file1.js'), sinon.match.string).returns(file1)
      readFileSync.withArgs(sinon.match('file2.js'), sinon.match.string).returns(file2)

      init(defaultArgs)
      statSync.args[0][0].should.containEql(defaultArgs.args[0])
      statSync.args[1][0].should.containEql(defaultArgs.args[1])
      // TODO: test for the individual environment variables in the console/file output

      done()
    })
  })
})

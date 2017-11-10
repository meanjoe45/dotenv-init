
'use strict'

// Node modules
var fs = require('fs')

// Dependency modules
var glob = require('glob')

// Dev Dependency modules
require('should')
var sinon = require('sinon')
require('should-sinon')
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

var orderedEnvvars = [
  'NODE_ENV',
  'TEST_BOOLEAN',
  'TEST_NUMBER',
  'TEST_REQUIRED',
  'TEST_STRING1',
  'TEST_STRING2'
]

var orderedCommentEnvvars = [
  'COMMENTED_ENVVAR1',
  'COMMENTED_ENVVAR2'
]

var file1 = `
/*
 * Copyright (c) 2017 test1, All rights reserved
 */
'use strict';

require('dotenv-safe').load();
process.env.${orderedEnvvars[0]} = process.env.${orderedEnvvars[0]} || 'development';

var testObj = {
    testString: process.env.${orderedEnvvars[4]} || 'testString1',
    testNumber: process.env.${orderedEnvvars[2]} || 'testNumber',
    testBoolean: process.env.${orderedEnvvars[1]} || 'testBoolean',
    testRequired: process.env.${orderedEnvvars[3]}
};

/*
 *  commentedEnvvar = process.env.${orderedCommentEnvvars[0]};
 */
`

var file2 = `
//
// Copyright (c) 2017 test2, All rights reserved
//
var testString = process.env.${orderedEnvvars[5]} || 'testString2';
var testNumber = process.env.${orderedEnvvars[2]} || 100;
var testBoolean = process.env.${orderedEnvvars[1]} || true;
var testRequired = process.env.${orderedEnvvars[3]};

// commentedEnvvar = process.env.${orderedCommentEnvvars[1]};
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
    var defaultGlobResult
    var consoleLog
    var globSync
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
        comments: false,
        ignore: 'node_modules/**,test/**',
        filename: '.env',
        safeFilename: '.env.example',
        args: ['**.js']
      }
      defaultGlobResult = ['file1.js', 'file2.js']

      fileStats = sinon.createStubInstance(fs.Stats)
      fileStats.isFile.returns(true)
      fileStats.isDirectory.returns(false)
      dirStats = sinon.createStubInstance(fs.Stats)
      dirStats.isFile.returns(false)
      fileStats.isDirectory.returns(true)

      consoleLog = sinon.stub(console, 'log')
      globSync = sinon.stub(glob, 'sync')
      statSync = sinon.stub(fs, 'statSync')
      readFileSync = sinon.stub(fs, 'readFileSync')
      writeFileSync = sinon.stub(fs, 'writeFileSync')

      done()
    })

    afterEach(function (done) {
      consoleLog.restore()
      globSync.restore()
      statSync.restore()
      readFileSync.restore()
      writeFileSync.restore()

      done()
    })

    it('takes option for console output', function (done) {
      globSync.returns(defaultGlobResult)
      statSync.returns(fileStats)
      readFileSync.returns(file1)

      defaultArgs.output = 'silent'
      init(defaultArgs)
      consoleLog.should.not.be.called()

      consoleLog.reset()
      defaultArgs.output = 'normal'
      init(defaultArgs)
      consoleLog.callCount.should.be.aboveOrEqual(1)
      var normalLength = consoleLog.args[0][0].length

      consoleLog.reset()
      defaultArgs.output = 'verbose'
      init(defaultArgs)
      consoleLog.callCount.should.be.aboveOrEqual(1)
      consoleLog.args[0][0].length.should.be.above(normalLength)

      done()
    })

    it('takes option for file output', function (done) {
      globSync.returns(defaultGlobResult)
      statSync.returns(fileStats)
      readFileSync.returns(file1)

      defaultArgs.fileOutput = 'minimal'
      init(defaultArgs)
      var minimalLength = writeFileSync.args[0][1].length
      minimalLength.should.be.above(0)

      writeFileSync.reset()
      defaultArgs.fileOutput = 'normal'
      statSync.returns(fileStats)
      init(defaultArgs)
      var normalLength = writeFileSync.args[0][1].length
      normalLength.should.be.above(minimalLength)

      writeFileSync.reset()
      defaultArgs.fileOutput = 'verbose'
      statSync.returns(fileStats)
      init(defaultArgs)
      writeFileSync.args[0][1].length.should.be.above(normalLength)

      done()
    })

    it('takes option for safe', function (done) {
      globSync.returns(defaultGlobResult)
      statSync.returns(fileStats)
      readFileSync.returns('empty file')

      defaultArgs.safe = true

      init(defaultArgs)
      writeFileSync.callCount.should.eql(2)

      done()
    })

    it('takes option for allowing comments', function (done) {
      globSync.returns(defaultGlobResult)
      statSync.returns(fileStats)
      readFileSync.withArgs(sinon.match('file1.js'), sinon.match.string).returns(file1)
      readFileSync.withArgs(sinon.match('file2.js'), sinon.match.string).returns(file2)

      defaultArgs.comments = true

      var envvars = init(defaultArgs)

      var orderedNames = orderedEnvvars
        .concat(orderedCommentEnvvars)
        .sort()
        .map((envvar) => { return { name: envvar } })
      envvars.should.containDeepOrdered(orderedNames)

      done()
    })

    it('takes option for ignore', function (done) {
      globSync.returns(defaultGlobResult)
      statSync.returns(fileStats)
      readFileSync.returns('empty file')

      defaultArgs.ignore = 'otherDir/**'

      init(defaultArgs)
      consoleLog.restore()
      globSync.args[0][1].should.eql({ ignore: defaultArgs.ignore.split(',') })

      done()
    })

    it('takes option for ignore (empty string)', function (done) {
      globSync.returns(defaultGlobResult)
      statSync.returns(fileStats)
      readFileSync.returns('empty file')

      defaultArgs.ignore = ''

      init(defaultArgs)
      consoleLog.restore()
      globSync.args[0][1].should.eql({ ignore: null })

      done()
    })

    it('takes option for filename', function (done) {
      globSync.returns(defaultGlobResult)
      statSync.returns(fileStats)
      readFileSync.returns('empty file')

      defaultArgs.filename = '.test'

      init(defaultArgs)
      consoleLog.restore()
      writeFileSync.args[0][0].should.eql(defaultArgs.filename)

      done()
    })

    it('takes option for safeFilename', function (done) {
      globSync.returns(defaultGlobResult)
      statSync.returns(fileStats)
      readFileSync.returns('empty file')

      defaultArgs.safe = true
      defaultArgs.safeFilename = '.test.example'

      init(defaultArgs)
      writeFileSync.args[1][0].should.eql(defaultArgs.safeFilename)

      done()
    })

    it('takes a list of files to scan as args', function (done) {
      globSync.returns(defaultGlobResult)
      statSync.returns(fileStats)
      readFileSync.withArgs(sinon.match('file1.js'), sinon.match.string).returns(file1)
      readFileSync.withArgs(sinon.match('file2.js'), sinon.match.string).returns(file2)

      init(defaultArgs)
      statSync.args[0][0].should.containEql(defaultGlobResult[0])
      statSync.args[1][0].should.containEql(defaultGlobResult[1])

      done()
    })

    it('should not allow options for filename and safeFilename be the same', function (done) {
      globSync.returns(defaultGlobResult)
      defaultArgs.safe = true
      defaultArgs.output = 'silent'
      defaultArgs.filename = '.test'
      defaultArgs.safeFilename = '.test'
      init(defaultArgs)
      consoleLog.should.not.be.called()
      statSync.should.not.be.called()

      defaultArgs.output = 'normal'
      init(defaultArgs)
      consoleLog.should.be.calledOnce()
      statSync.should.not.be.called()

      done()
    })

    it('should disregard safeFilename option if safe option is false', function (done) {
      globSync.returns(defaultGlobResult)
      statSync.returns(fileStats)
      readFileSync.returns('empty file')

      defaultArgs.filename = '.test'
      defaultArgs.safeFilename = '.test'
      init(defaultArgs)
      statSync.should.be.called()

      done()
    })

    it('should exclude file list items that are directories', function (done) {
      globSync.returns(defaultGlobResult)
      statSync.onFirstCall().returns(fileStats)
              .onSecondCall().returns(dirStats)
      readFileSync.returns(file1)

      init(defaultArgs)
      statSync.args[0][0].should.containEql(defaultGlobResult[0])
      statSync.args[1][0].should.containEql(defaultGlobResult[1])
      readFileSync.callCount.should.equal(1)

      done()
    })

    it('should exclude file list items that do not exist', function (done) {
      globSync.returns(defaultGlobResult)
      statSync.onFirstCall().throws()
              .onSecondCall().returns(fileStats)
      readFileSync.returns(file1)

      init(defaultArgs).should.not.throw()
      statSync.should.be.calledTwice()
      statSync.args[0][0].should.containEql(defaultGlobResult[0])
      statSync.args[1][0].should.containEql(defaultGlobResult[1])
      readFileSync.callCount.should.equal(1)

      done()
    })

    it('should exclude file list items that fail when removing comments', function (done) {
      globSync.returns(defaultGlobResult)
      statSync.returns(fileStats)
      readFileSync.onFirstCall().returns(file1)
                  .onSecondCall().returns('#!/usr/bin/env node')

      init(defaultArgs).should.not.throw()
      statSync.should.be.calledTwice()
      statSync.args[0][0].should.containEql(defaultGlobResult[0])
      statSync.args[1][0].should.containEql(defaultGlobResult[1])
      readFileSync.callCount.should.equal(2)

      done()
    })

    it('should exit without writing files if file list is empty', function (done) {
      defaultArgs.args = []

      init(defaultArgs)
      readFileSync.should.not.be.called()
      writeFileSync.should.not.be.called()

      consoleLog.reset()
      defaultArgs.output = 'silent'
      init(defaultArgs)
      consoleLog.should.not.be.called()
      readFileSync.should.not.be.called()
      writeFileSync.should.not.be.called()

      done()
    })

    it('should scan all files for process environment variables', function (done) {
      globSync.returns(defaultGlobResult)
      statSync.returns(fileStats)
      readFileSync.withArgs(sinon.match('file1.js'), sinon.match.string).returns(file1)
      readFileSync.withArgs(sinon.match('file2.js'), sinon.match.string).returns(file2)

      var envvars = init(defaultArgs)
      statSync.args[0][0].should.containEql(defaultGlobResult[0])
      statSync.args[1][0].should.containEql(defaultGlobResult[1])

      var orderedNames = orderedEnvvars.map((envvar) => { return { name: envvar } })
      envvars.should.containDeepOrdered(orderedNames)

      var orderedCommentNames = orderedCommentEnvvars.map((envvar) => { return { name: envvar } })
      envvars.should.not.containDeepOrdered(orderedCommentNames)

      done()
    })
  })
})

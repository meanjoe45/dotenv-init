#!/usr/bin/env node
'use strict'

// Node Modules
const path = require('path')

// Dependency Modules
const program = require('commander')
const init = require('../init')

// Local Modules
const pkg = require(path.resolve(__dirname, '../package.json'))

program
  .version(pkg.version)
  .usage('[options] <file ...>')
  .option('-s, --safe', '.env.example is also output for use with dotenv-safe')
  .option('-c, --comments', 'include comments when parsing for environment variables')
  .option('-i, --ignore <patterns>', 'files to ignore as part of file patterns; overrides default (\'node_modules/**,test/**\')', 'node_modules/**,test/**')
  .option('-o, --output [level]', 'set the console output level [normal] (silent|normal|verbose)', /^(silent|normal|verbose)$/i, 'normal')
  .option('-O, --file-output [level]', 'set the file output level [normal] (minimal|normal|verbose)', /^(minimal|normal|verbose)$/i, 'normal')
  .option('--filename [name]', 'chose the name of the output file [.env]', '.env')
  .option('--safe-filename [name]', 'chose the name of the safe output file [.env.example]', '.env.example')
  .parse(process.argv)

// TODO: possible future features
// .option('--merge', 'Merge new files with specified existing file')

init(program)

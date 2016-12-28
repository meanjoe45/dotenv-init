#!/usr/bin/env node
'use strict';

// Node Modules
const path = require('path');

// Dependency Modules
const program = require('commander');
const init = require('../init');

// Local Modules
const pkg = require(path.resolve(__dirname, '../package.json'));

/* eslint-disable max-len */
program
  .version(pkg.version)
  .usage('[options] <file ...>')
  .option('-s, --safe',             '.env.example is also output for use with dotenv-safe')
  .option('--output [level]',       'set the output level for the console [normal]', /^(silent|normal|verbose)$/i, 'normal')
  .option('--file-output [level]',  'set the output level for the .env files [normal]', /^(minimal|normal|verbose)$/i, 'normal')
  .option('--filename [name]',      'chose the name of the output file [.env]', '.env')
  .option('--safe-filename [name]', 'chose the name of the safe output file [.env.example]', '.env.example')
  .parse(process.argv);
/* eslint-enable max-len */

// TODO: possible future features
//.option('--merge', 'Merge new files with specified existing file')

init(program);

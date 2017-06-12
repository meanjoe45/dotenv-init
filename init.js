
'use strict'

// Node Modules
var fs = require('fs')
var path = require('path')

// Dependency Modules
var decomment = require('decomment')

// Local Modules
var pkg = require(path.resolve('package.json'))

module.exports = init

var OUTPUT_MINIMAL = 0
var OUTPUT_SILENT = 0
var OUTPUT_NORMAL = 1
var OUTPUT_VERBOSE = 2
function parseOutputLevel (level) {
  var result

  switch (level) {
    case 'minimal':
      result = OUTPUT_MINIMAL
      break

    case 'silent':
      result = OUTPUT_SILENT
      break

    case 'normal':
    default:
      result = OUTPUT_NORMAL
      break

    case 'verbose':
      result = OUTPUT_VERBOSE
      break
  }

  return result
}

function writeHeader (program) {
  var header = ''
  // $lab:coverage:off$
  if (pkg && pkg.name) {
    header += `\n# Project:     ${pkg.name}`
  }
  // $lab:coverage:on$
  header += `\n# Node.js:     v${process.versions.node}`
  header += `\n# dotenv-init: v${program._version}`
  header += `\n# ${new Date().toLocaleString()}`
  header += '\n'

  return header
}

function verifyFiles (inputFiles) {
  var cwd = process.cwd()
  var files = []

  for (var file of inputFiles) {
    var absFile = path.resolve(cwd, file)

    try {
      var stats = fs.statSync(absFile)

      if (stats.isFile()) {
        files.push({ path: absFile, original: file, include: true })
      } else {
        files.push({ path: absFile, original: file, include: false })
      }
    } catch (error) {
      files.push({ path: absFile, original: file, include: false })
    }
  }

  return files
}

function writeFileList (files) {
  var fileList = ''

  for (var file of files) {
    var include = (file.include) ? '+' : '-'

    fileList += `\n# ${include} ${file.original}`
  }

  fileList += '\n'
  return fileList
}

// TODO: allow for jsdoc style defining
function scanFiles (files, comments) {
    // Breakdown of the regular expression used to parse environment variables:
    // - get the process.env section with variable name: (?:[:=]{1}\s*process\.env\.)([A-Z0-9_]*)
    //                                                   (?:
    // - get the optional '||' OR operator for defaults:   (?:\s*\|\|\s*)
    //                                                       (
    // - get the default value ("string"):                   (?:["])[^\n\r"]*(?:["]) |
    // - get the default value ('string'):                   (?:['])[^\n\r']*(?:[']) |
    // - get the default value (boolean):                    [Tt][Rr][Uu][Ee]|[Ff][Aa][Ll][Ss][Ee] |
    // - get the default value (number):                     [\d.]*
    //                                                       )
    //                                                   )?
  var envRegexp = new RegExp('(?:[:=]{1}\\s*process\\.env\\.)([A-Z0-9_]*)' +
                               '(?:' +
                               '(?:\\s*\\|\\|\\s*)' +
                               '(' +
                               '(?:["])[^\\n\\r"]*(?:["])|' +
                               '(?:[\'])[^\\n\\r\']*(?:[\'])|' +
                               '[Tt][Rr][Uu][Ee]|[Ff][Aa][Ll][Ss][Ee]|' +
                               '[\\d.]*' +
                               ')' +
                               ')?', 'g')
  var envvars = []

  files.forEach(function (file) {
    if (file.include) {
      var data = fs.readFileSync(file.path, 'utf-8')
      if (!comments) {
        data = decomment(data)
      }

      var match = envRegexp.exec(data)
      while (match) {
        if (!envvars.some(envvar => envvar.name === match[1])) {
          envvars.push({ name: match[1], desc: null, default: match[2] })
        }
        match = envRegexp.exec(data)
      }
    }
  })

  return envvars
}

function writeEnvvars (envvars) {
  var output = ''

  if (envvars.length > 0) {
    envvars = envvars.sort((a, b) => a.name > b.name)

    for (var envvar of envvars) {
      output += `\n# ${envvar.name}=`

      if (envvar.default) {
        output += `${envvar.default}`
      }
    }
  } else {
    output += '\n# NO ENVIRONMENT VARIABLES FOUND'
  }

  return output
}

function writeSafeEnvvars (envvars) {
  var output = ''

  if (envvars.length > 0) {
    envvars = envvars.sort((a, b) => a.name > b.name)

    for (var envvar of envvars) {
      if (!envvar.default) {
        output += `\n# ${envvar.name}=`
      }
    }
  }

  if (output === '') {
    output += '\n# NO REQUIRED ENVIRONMENT VARIABLES FOUND'
  }

  return output
}

function writeConsole (data) {
  console.log(data)
}

function writeFile (file, data) {
  fs.writeFileSync(file, data, {})
}

function init (program) {
  var consoleOutput = parseOutputLevel(program.output)
  var fileOutput = parseOutputLevel(program.fileOutput)

  if (program.safe && (program.filename === program.safeFilename)) {
    if (consoleOutput > OUTPUT_SILENT) {
      writeConsole('ERROR: OUTPUT FILES CANNOT HAVE THE SAME NAME')
    }
    return
  }

    // print header information
  var envConsole = ''
  var envFile = ''

  var header = writeHeader(program)
  envConsole += (consoleOutput >= OUTPUT_NORMAL) ? header : ''
  envFile += (fileOutput >= OUTPUT_NORMAL) ? header : ''

    // determine file list
  var files = verifyFiles(program.args)

  if (!files.some(file => file.include)) {
    envConsole += '\nNO FILES TO PROCESS, exiting ...'
    if (consoleOutput > OUTPUT_SILENT) {
      writeConsole(envConsole)
    }
    return
  }

  var fileList = writeFileList(files)

  envConsole += (consoleOutput >= OUTPUT_VERBOSE) ? fileList : ''
  envFile += (fileOutput >= OUTPUT_VERBOSE) ? fileList : ''

    // scan files for environment variables
  var envvars = scanFiles(files, program.comments)

  var envSafeFile = envFile
  var envvarList = writeEnvvars(envvars)

  envConsole += `${envvarList}\n`
  envFile += `${envvarList}\n`
  envSafeFile += `${writeSafeEnvvars(envvars)}\n`

    // output results
  writeFile(program.filename, envFile)

  if (program.safe) {
    writeFile(program.safeFilename, envSafeFile)
  }

  if (consoleOutput > OUTPUT_SILENT) {
    writeConsole(envConsole)
  }

  return envvars
}

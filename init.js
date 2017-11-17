
'use strict'

// Node Modules
const fs = require('fs')
const path = require('path')

// Dependency Modules
const decomment = require('decomment')
const globs = require('globs')

// Local Modules
const pkg = require(path.resolve('package.json'))

module.exports = init

const OUTPUT_MINIMAL = 0
const OUTPUT_SILENT = 0
const OUTPUT_NORMAL = 1
const OUTPUT_VERBOSE = 2
function parseOutputLevel (level) {
  let result

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
  let header = ''
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
  const cwd = process.cwd()
  const files = []

  if (!inputFiles) {
    return files
  }

  for (let file of inputFiles) {
    const absFile = path.resolve(cwd, file)

    try {
      const stats = fs.statSync(absFile)

      if (stats.isFile()) {
        files.push({ path: absFile, original: file, include: true, error: null })
      } else {
        files.push({ path: absFile, original: file, include: false, error: null })
      }
    } catch (error) {
      files.push({ path: absFile, original: file, include: false, error: error.message })
    }
  }

  return files
}

function writeFileList (files) {
  let fileList = ''

  for (let file of files) {
    const include = (file.include) ? '+' : '-'

    fileList += `\n# ${include} ${file.original}`
    if (file.error) {
      fileList += ` -- ${file.error}`
    }
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
  const envRegexp = new RegExp('(?:[:=]{1}\\s*process\\.env\\.)([A-Z0-9_]*)' +
                               '(?:' +
                               '(?:\\s*\\|\\|\\s*)' +
                               '(' +
                               '(?:["])[^\\n\\r"]*(?:["])|' +
                               '(?:[\'])[^\\n\\r\']*(?:[\'])|' +
                               '[Tt][Rr][Uu][Ee]|[Ff][Aa][Ll][Ss][Ee]|' +
                               '[\\d.]*' +
                               ')' +
                               ')?', 'g')
  const envvars = []

  files.forEach(function (file) {
    if (file.include) {
      let data = fs.readFileSync(file.path, 'utf-8')
      if (!comments) {
        try {
          data = decomment(data)
        } catch (error) {
          file.include = false
          file.error = `decomment: ${error.message}`
        }
      }

      let match = envRegexp.exec(data)
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
  let output = ''

  if (envvars.length > 0) {
    envvars = envvars.sort((a, b) => a.name > b.name)

    for (let envvar of envvars) {
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
  let output = ''

  if (envvars.length > 0) {
    envvars = envvars.sort((a, b) => a.name > b.name)

    for (let envvar of envvars) {
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
  const consoleOutput = parseOutputLevel(program.output)
  const fileOutput = parseOutputLevel(program.fileOutput)

  if (program.safe && (program.filename === program.safeFilename)) {
    if (consoleOutput > OUTPUT_SILENT) {
      writeConsole('ERROR: OUTPUT FILES CANNOT HAVE THE SAME NAME')
    }
    return
  }

  const ignore = (program.ignore) ? program.ignore.split(',') : null

    // print header information
  let envConsole = ''
  let envFile = ''

  const header = writeHeader(program)
  envConsole += (consoleOutput >= OUTPUT_NORMAL) ? header : ''
  envFile += (fileOutput >= OUTPUT_NORMAL) ? header : ''

    // extract files from globs
  let files = globs.sync(program.args, { ignore: ignore })

    // determine file list
  files = verifyFiles(files)

  if (!files.some(file => file.include)) {
    envConsole += '\nNO FILES TO PROCESS, exiting ...'
    if (consoleOutput > OUTPUT_SILENT) {
      writeConsole(envConsole)
    }
    return
  }

    // scan files for environment variables
  const envvars = scanFiles(files, program.comments)

  const fileList = writeFileList(files)

  envConsole += (consoleOutput >= OUTPUT_VERBOSE) ? fileList : ''
  envFile += (fileOutput >= OUTPUT_VERBOSE) ? fileList : ''

  let envSafeFile = envFile
  const envvarList = writeEnvvars(envvars)

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

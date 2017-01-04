
'use strict'

// Node Modules
const fs = require('fs')
const path = require('path')

// Dependency Modules

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

function writeHeader () {
  let header = ''
  if (pkg && pkg.name) {
    header += `\n# Project: ${pkg.name}`
  }
  header += `\n# Node.js: ${process.versions.node}`
  header += `\n# ${new Date().toLocaleString()}`
  header += '\n'

  return header
}

function verifyFiles (inputFiles) {
  const cwd = process.cwd()
  let files = []

  for (let file of inputFiles) {
    let absFile = path.resolve(cwd, file)

    try {
      let stats = fs.statSync(absFile)

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
  let fileList = ''

  for (let file of files) {
    let include = (file.include) ? '+' : '-'

    fileList += `\n# ${include} ${file.original}`
  }

  fileList += '\n'
  return fileList
}

// TODO: allow for jsdoc style defining
function scanFiles (files) {
    // Breakdown of the regular expression used to parse environment variables:
    // - get the process.env section with variable name: (?:[:=]{1}\s*process\.env\.)([A-Z0-9_]*)
    //                                                   (?:
    // - get the optional '||' OR operator for defaults:   (?:\s*\|\|\s*)
    //                                                       (
    // - get the default value ("string"):                   (?:["])[^\n\r"]*(?:["])
    // - get the default value ('string'):                   (?:['])[^\n\r\']*(?:['])
    // - get the default value (boolean):                    [Tt][Rr][Uu][Ee]|[Ff][Aa][Ll][Ss][Ee]
    // - get the default value (number):                     [\d.]*
    //                                                       )
    //                                                   )?
  const envRegexp = new RegExp('(?:[:=]{1}\\s*process\\.env\\.)([A-Z_]*)' +
                               '(?:' +
                               '(?:\\s*\\|\\|\\s*)' +
                               '(' +
                               '(?:["])[^\\n\\r"]*(?:["])|' +
                               '(?:[\'])[^\\n\\r\']*(?:[\'])|' +
                               '[Tt][Rr][Uu][Ee]|[Ff][Aa][Ll][Ss][Ee]|' +
                               '[\\d.]*' +
                               ')' +
                               ')?', 'g')
  let envvars = []

  files.forEach(function (file) {
    if (file.include) {
      const data = fs.readFileSync(file.path)

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
  var output = ''

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
  var output = ''

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
  console.log(data) // eslint-disable-line no-console
}

function writeFile (file, data) {
  fs.writeFileSync(file, data, {})
}

function init (cliArgs) { // eslint-disable-line max-statements, consistent-return
  const consoleOutput = parseOutputLevel(cliArgs.output)
  const fileOutput = parseOutputLevel(cliArgs.fileOutput)

  if (cliArgs.filename === cliArgs.safeFilename) {
    if (consoleOutput > OUTPUT_SILENT) {
      writeConsole('ERROR: OUTPUT FILES CANNOT HAVE THE SAME NAME')
    }
    return
  }

    // print header information
  let envConsole = ''
  let envFile = ''

  const header = writeHeader()
  envConsole += (consoleOutput >= OUTPUT_NORMAL) ? header : ''
  envFile += (fileOutput >= OUTPUT_NORMAL) ? header : ''

    // determine file list
  const files = verifyFiles(cliArgs.args)

  if (!files.some(file => file.include)) {
    envConsole += '\nNO FILES TO PROCESS, exiting ...'
    if (consoleOutput > OUTPUT_SILENT) {
      writeConsole(envConsole)
    }
    return
  }

  const fileList = writeFileList(files)

  envConsole += (consoleOutput >= OUTPUT_VERBOSE) ? fileList : ''
  envFile += (fileOutput >= OUTPUT_VERBOSE) ? fileList : ''

    // scan files for environment variables
  const envvars = scanFiles(files)

  let envSafeFile = envFile
  const envvarList = writeEnvvars(envvars)

  envConsole += `${envvarList}\n`
  envFile += `${envvarList}\n`
  envSafeFile += `${writeSafeEnvvars(envvars)}\n`

    // output results
  if (consoleOutput > OUTPUT_SILENT) {
    writeConsole(envConsole)
  }

  if (cliArgs.safe) {
    writeFile(cliArgs.safeFilename, envSafeFile)
  }

  writeFile(cliArgs.filename, envFile)
}

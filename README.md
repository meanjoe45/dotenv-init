
# dotenv-init

<!-- <img src="https://raw.githubusercontent.com/motdotla/dotenv/master/dotenv.png" alt="dotenv" /> -->

Creates an initial `.env` file by parsing a project's source code. The `.env` is intended for use with [dotenv][dotenv]. The optional `.env.example` file is intended for use with [dotenv-safe][dotenv-safe].

[![BuildStatus](https://img.shields.io/travis/meanjoe45/dotenv-init/master.svg?style=flat-square)](https://travis-ci.org/meanjoe45/dotenv-init)
[![NPM version](https://img.shields.io/npm/v/dotenv-init.svg?style=flat-square)](https://www.npmjs.com/package/dotenv-init)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)
[![Coverage Status](https://img.shields.io/coveralls/meanjoe45/dotenv-init/master.svg?style=flat-square)](https://coveralls.io/github/meanjoe45/dotenv-init?branch=coverall-intergration)

## Installation

```
npm install -g dotenv-init
```

## Usage

This package accepts a list of files which are parsed for the usage of any environment variables. The environment variables are searched for with a basic set of guidelines. First, the string `process.env.` must follow a `=` or `:` to indicate its value is being used. Second, if the `process.env.ENV_VAR` is followed by `||`, the or'ed value is used as the default value in the `.env` files.

When processing the files, if an environment variable is not assigned a default value, it is assumed to be required. Any environment variables that are required will still be output to the `.env` file with an empty value (`# NODE_ENV=`). If the `--safe` option is used, the required environment variables are also output to the `.env.example` file for use by [dotenv-safe][dotenv-safe].

After parsing all the files, the list of environment variables are sorted into alphabetical order.

## Examples

When installed globally, running the following command from the root directory of the target project works well for sending the list of `.js` files to dotenv-init.

```
dotenv-init $(find . -type f -not -path "*/node_modules*" -not -path "*/test*" -name "*.js")
```

### Assigned with `=`

```javascript
const environment = process.env.NODE_ENV || 'development'
const tokenSecret = process.env.TOKEN_SECRET
// .env output:
// # NODE_ENV=development
// # TOKEN_SECRET=

// .env.example output:
// # TOKEN_SECRET=
```

### Assigned as part of an object `:`

```javascript
const dbSettings = {
  username: process.env.DB_USER,
  password: process.env.DB_PWRD,
  dialect: process.env.DB_DIALECT || 'mysql'
}
// outputs:
// # DB_DIALECT=mysql
// # DB_PWRD=
// # DB_USER=

// .env.example output:
// # DB_PWRD=
// # DB_USER=
```

## Options

```
  Usage: dotenv-init [options] <file ...>

  Options:

    -h, --help              output usage information
    -V, --version           output the version number
    -s, --safe              .env.example is also output for use with dotenv-safe
    --output [level]        set the output level for the console [normal]
    --file-output [level]   set the output level for the .env files [normal]
    --filename [name]       chose the name of the output file [.env]
    --safe-filename [name]  chose the name of the safe output file [.env.example]
```

### `--help, -h`

This option outputs the help menu as shown above.

### `--version, -V`

This option outputs the current version of dotenv-init.

### `--safe, -s`

This option will output the `.env.example` file.

### `--output [level]`

This option adjust the level of output sent to the console (silent, normal or verbose).

### `--file-output [level]`

This option adjust the level of output sent to the files that are written (minimal, normal or verbose).

### `--filename [name]`

This option allows the output file to be given a different name from the default `.env`.

### `--safe-filename [name]`

This option allows the safe output file to be given a different name from the default `.env.example`.

## Contributing

This project is very new and does not cover all the corner cases that it should. If there is a feature you would like added or a corner case not properly covered, please open an issue on [Github][repo-issues].

## Roadmap

### v1.0
- Add ability to exclude environment variables that are only part of comments in the source code
- Add unit tests

### Future
- make current functionality a separate command (probably "parse")
- create a new command initialize(?) for setting up initial .env
- create a new command merge(?) that takes an existing .env file and merges in newly parsed results

## License

MIT

[repo-issues]: https://github.com/meanjoe45/dotenv-init/issues
[dotenv]: https://www.npmjs.com/package/dotenv
[dotenv-safe]: https://www.npmjs.com/package/dotenv-safe

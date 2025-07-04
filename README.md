# @devjskit/copy-files

> Copy files

## Why

- Fast by using streams.
- Resilient by using [graceful-fs](https://github.com/isaacs/node-graceful-fs).
- User-friendly by accepting [globs](https://github.com/sindresorhus/globby#globbing-patterns) and creating non-existent destination directories.
- User-friendly error messages.

## Install

```sh
npm install --global @devjskit/copy-files
```

## Usage

```bash
$ copy --help

  Usage
    $ copy <source …> <destination>

  Options
    --no-overwrite       Don't overwrite the destination
    --cwd=<dir>          Working directory for files
    --rename=<filename>  Rename all <source> filenames to <filename>. Supports string templates.
    --dot                Allow patterns to match entries that begin with a period (.)
    --flat               Flatten directory structure. All copied files will be put in the same directory.
    --concurrency        Number of files being copied concurrently

  <source> can contain globs if quoted

  Examples
    Copy all .png files in src folder into dist except src/goat.png
    $ copy 'src/*.png' '!src/goat.png' dist

    Copy all files inside src folder into dist and preserve path structure
    $ copy . '../dist/' --cwd=src

    Copy all .png files in the src folder to dist and prefix the image filenames
    $ copy 'src/*.png' dist --cwd=src --rename=hi-{{basename}}
```

import { afterEach, beforeEach, expect, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { execa } from "execa";
import tempfile from "tempfile";

const read = (...arguments_) => fs.readFileSync(path.join(...arguments_), "utf8");
const indexPath = path.resolve("./index.js");

let tmp;

beforeEach(() => {
  tmp = tempfile();
});

afterEach(() => {
  if (fs.existsSync(tmp)) {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("missing file operands", async () => {
  try {
    await execa(indexPath);
    throw new Error("Should have thrown");
  } catch (err) {
    expect(err.stderr || err.message).toMatch(/`source` and `destination` required/);
  }
});

test("source file does not exist", async () => {
  try {
    await execa(indexPath, [path.join(tmp, "nonexistentfile"), tmp]);
    throw new Error("Should have thrown");
  } catch (err) {
    expect(err.stderr || err.message).toMatch(/nonexistentfile/);
  }
});

test("cwd", async () => {
  fs.mkdirSync(tmp, { recursive: true });
  fs.mkdirSync(path.join(tmp, "cwd"), { recursive: true });
  fs.writeFileSync(path.join(tmp, "cwd/hello.js"), 'console.log("hello");');

  await execa(indexPath, ["hello.js", "dest", "--cwd", path.join(tmp, "cwd")]);

  expect(read(tmp, "cwd/hello.js")).toBe(read(tmp, "cwd/dest/hello.js"));
});

test("path structure", async () => {
  fs.mkdirSync(tmp, { recursive: true });
  fs.mkdirSync(path.join(tmp, "cwd"), { recursive: true });
  fs.mkdirSync(path.join(tmp, "out"), { recursive: true });
  fs.writeFileSync(path.join(tmp, "cwd/hello.js"), 'console.log("hello");');

  await execa(indexPath, [path.join(tmp, "**"), path.join(tmp, "out")]);

  expect(read(tmp, "cwd/hello.js")).toBe(read(tmp, "out/cwd/hello.js"));
});

test("rename filenames but not filepaths", async () => {
  fs.mkdirSync(tmp, { recursive: true });
  fs.mkdirSync(path.join(tmp, "dest"), { recursive: true });
  fs.writeFileSync(path.join(tmp, "hello.js"), 'console.log("hello");');

  await execa(indexPath, [path.join(tmp, "hello.js"), path.join(tmp, "dest"), "--rename=hi.js"]);
  expect(read(tmp, "hello.js")).toBe(read(tmp, "dest/hi.js"));

  await execa(indexPath, [path.join(tmp, "hello.js"), path.join(tmp, "dest"), "--rename=hi-{{basename}}-1"]);
  expect(read(tmp, "hello.js")).toBe(read(tmp, "dest/hi-hello-1.js"));
});

test("overwrite files by default", async () => {
  fs.mkdirSync(tmp, { recursive: true });
  fs.mkdirSync(path.join(tmp, "dest"), { recursive: true });
  fs.writeFileSync(path.join(tmp, "hello.js"), 'console.log("hello");');
  fs.writeFileSync(path.join(tmp, "dest/hello.js"), 'console.log("world");');

  await execa(indexPath, [path.join(tmp, "hello.js"), path.join(tmp, "dest")]);

  expect(read(tmp, "dest/hello.js")).toBe('console.log("hello");');
});

test("do not copy files in the negated glob patterns", async () => {
  fs.mkdirSync(tmp, { recursive: true });
  fs.mkdirSync(path.join(tmp, "src"), { recursive: true });
  fs.mkdirSync(path.join(tmp, "dest"), { recursive: true });
  fs.writeFileSync(path.join(tmp, "src/hello.js"), 'console.log("hello");');
  fs.writeFileSync(path.join(tmp, "src/hello.jsx"), 'console.log("world");');
  fs.writeFileSync(path.join(tmp, "src/hello.es2015"), 'console.log("world");');

  await execa(indexPath, ["src/*.*", "!src/*.jsx", "!src/*.es2015", path.join(tmp, "dest"), "--cwd", tmp]);

  expect(read(tmp, "dest/hello.js")).toBe('console.log("hello");');
  expect(fs.existsSync(path.join(tmp, "dest/hello.jsx"))).toBe(false);
  expect(fs.existsSync(path.join(tmp, "dest/hello.es2015"))).toBe(false);
});

test("flatten directory tree", async () => {
  fs.mkdirSync(tmp, { recursive: true });
  fs.mkdirSync(path.join(tmp, "source"), { recursive: true });
  fs.mkdirSync(path.join(tmp, "source", "nested"), { recursive: true });
  fs.writeFileSync(path.join(tmp, "foo.js"), 'console.log("foo");');
  fs.writeFileSync(path.join(tmp, "source/bar.js"), 'console.log("bar");');
  fs.writeFileSync(path.join(tmp, "source/nested/baz.ts"), 'console.log("baz");');

  await execa(indexPath, ["**/*.js", "destination/subdir", "--cwd", tmp, "--flat"]);

  expect(read(tmp, "foo.js")).toBe(read(tmp, "destination/subdir/foo.js"));
  expect(read(tmp, "source/bar.js")).toBe(read(tmp, "destination/subdir/bar.js"));
  expect(fs.existsSync(path.join(tmp, "destination/subdir/baz.ts"))).toBeFalsy();
});

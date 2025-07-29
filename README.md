# @averay/gulp-clean-unmodified

A Gulp plugin to remove unmodified files after tasks have completed.

A usual Gulp workflow is first cleaning the destination directory, then writing the generated files to it. For situations where the destination directory is being watched or otherwise in use, the gap between the old files being removed and the new files being written can cause issues or unnecessary reloads. This plugin allows reversing the order, by first writing the generated files to the destination directory (overwriting any existing files), then after going through and removing any outdated files, ensuring files that persist the previous build and the new build remain present throughout the process.

## Usage

For simple cases, first import the plugin:

```js
import cleaner from '@averay/gulp-clean-unmodified';
```

Next, register created files by piping `.register()` in to the end of all streams:

```js
export function css() {
  gulp
    .src('src/**/*.scss')
    // (Other plugins)
    .pipe(gulp.dest('dest'))
    .pipe(cleaner.register());
}
```

Finally, call `.clean()` in a subsequent task to remove unmodified files, providing the path to the output directory root:

```js
// Either async
export async function clean() {
  cleaner.clean('dest');
}
// or using a callback
export function clean(done) {
  cleaner.clean('dest');
  done();
}
```

_(Note that for a simple clean task like this either the function must be asynchronous or invoke the callback to prevent Gulp incomplete task errors.)_

The two tasks must then be run in series:

```js
export const build = gulp.series(css, clean);
```

See [the example gulpfile](./examples/simple.gulpfile.mjs).

### Parallel Outputs

For advanced Gulp usage with parallel-but-unrelated destinations (e.g. bundling a Node app and compiling static web assets in the same gulpfile), separate cleaner instances should be created and generated files piped into the appropriate instance's processor, to allow the separate components to operate independently. See [the example gulpfile](./examples/multiple.gulpfile.js).

---

[MIT License](./LICENSE)

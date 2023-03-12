/* eslint import/no-unresolved: "off" -- For demonstration only */

import { UnmodifiedCleaner } from '@averay/gulp-clean-unmodified';
import gulp from 'gulp';

const appCleaner = new UnmodifiedCleaner();
const assetsCleaner = new UnmodifiedCleaner();

export function app() {
  return gulp
    .src('src/entry.ts')
    .pipe(/* Compile TypeScript */)
    .pipe(gulp.dest('dest/app/entry.js'))
    .pipe(appCleaner.register());
}

export function css() {
  return gulp
    .src('assets/**/*.scss')
    .pipe(/* Compile SASS */)
    .pipe(gulp.dest('dest/www/css'))
    .pipe(assetsCleaner.register());
}

export function js() {
  return gulp
    .src('assets/**/*.js')
    .pipe(/* Process JavaScript */)
    .pipe(gulp.dest('dest/www/js'))
    .pipe(assetsCleaner.register());
}

export function clean_assets(done) {
  assetsCleaner.clean('dest/www');
  done();
}

export function clean_app(done) {
  appCleaner.clean('dest/app');
  done();
}

export const build = gulp.parallel(gulp.series(app, clean_app), gulp.series(gulp.parallel(css, js), clean_assets));
export default build;

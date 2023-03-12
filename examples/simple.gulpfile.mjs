/* eslint import/no-unresolved: "off" -- For demonstration only */

import cleaner from '@averay/gulp-clean-unmodified';
import gulp from 'gulp';

export function css() {
  return gulp
    .src('assets/**/*.scss')
    .pipe(/* Apply plugins here e.g. compile SASS */)
    .pipe(gulp.dest('dest/css'))
    .pipe(cleaner.register());
}

export function js() {
  return gulp
    .src('assets/**/*.js')
    .pipe(/* Apply plugins here e.g. process JavaScript */)
    .pipe(gulp.dest('dest/js'))
    .pipe(cleaner.register());
}

export function clean(done) {
  cleaner.clean('dest');
  done();
}

export const build = gulp.series(gulp.parallel(css, js), clean);
export default build;

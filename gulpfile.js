const gulp = require('gulp');

gulp.task('clean', () => {
    return del('public/style.css');
});
gulp.task('fonts', function() {
  return gulp.src('node_modules/@fortawesome/fontawesome-free/webfonts/**.*')
      .pipe(gulp.dest('public/fonts'));
});
gulp.task('styles', function() {
  return gulp.src('node_modules/@fortawesome/fontawesome-free/css/**.*')
      .pipe(gulp.dest('public/css'));
});
gulp.task('bootstrapcss', function() {
  return gulp.src('node_modules/bootstrap/dist/css/bootstrap.min.css')
      .pipe(gulp.dest('public/css'));
});
gulp.task('bootstrapjs', function() {
  return gulp.src('node_modules/bootstrap/dist/js/bootstrap.min.js')
      .pipe(gulp.dest('public/css'));
});
gulp.task('default', gulp.series(['fonts', 'styles', 'bootstrapcss', 'bootstrapjs']));
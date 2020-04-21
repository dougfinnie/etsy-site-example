const gulp = require('gulp')
  gulp.task('default', function() {
    return gulp.src('~/node_modules/@fortawesome/fontawesome-free/webfonts/**.*')
        .pipe(gulp.dest('~/public/fonts'));
});

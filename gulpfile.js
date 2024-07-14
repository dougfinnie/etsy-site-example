import gulp from 'gulp';
import del from 'del';

gulp.task('clean', () => {
     return del([
       'public/fonts/**', '!public/fonts', 
       'public/css/**', '!public/css', 
       'public/js/**', '!public/js'
     ]);
});
gulp.task('bootstrapcss', function() {
  return gulp.src('node_modules/bootstrap/dist/css/bootstrap.min.css', {allowEmpty:true})
      .pipe(gulp.dest('public/css'));
});
gulp.task('bootstrapjs', function() {
  return gulp.src(['node_modules/bootstrap/dist/js/bootstrap.min.js',
                  'node_modules/bootstrap/dist/js/bootstrap.min.js.map'], {allowEmpty:true})
      .pipe(gulp.dest('public/js'));
});
gulp.task('datatablesjs', function() {
  return gulp.src(['node_modules/datatables.net/js/dataTables.min.js',
                  'node_modules/datatables.net-bs5/js/dataTables.bootstrap5.min.js'], {allowEmpty:true})
    .pipe(gulp.dest('public/js'));
});
gulp.task('datatablescss', function() {
  return gulp.src('node_modules/datatables.net-bs5/css/dataTables.bootstrap5.min.css', {allowEmpty:true})
      .pipe(gulp.dest('public/css'));
});
gulp.task('jquery', function() {
  return gulp.src('node_modules/jquery/dist/jquery.min.js', {allowEmpty:true})
    .pipe(gulp.dest('public/js'));
});

gulp.task('data-folders', function() {
  return gulp.src('*.*', {read: false})
        .pipe(gulp.dest('./data')) // this exists by default, but just in case
        .pipe(gulp.dest('./data/products'))
        .pipe(gulp.dest('./data/patterns'));
});
gulp.task('default', gulp.series(['clean',
                                  'bootstrapcss',
                                  'bootstrapjs',
                                  'data-folders',
                                  'datatablesjs',
                                  'datatablescss',
                                  'jquery'
                                 ]));
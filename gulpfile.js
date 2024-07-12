const gulp = require('gulp');
const del = require('del');
const fs = require('fs');

gulp.task('clean', () => {
     return del([
       'public/fonts/**', '!public/fonts', 
       'public/css/**', '!public/css', 
       'public/js/**', '!public/js'
     ]);
});
gulp.task('fonts', function() {
  return gulp.src('node_modules/@fortawesome/fontawesome-free/webfonts/**.*', {allowEmpty:true})
      .pipe(gulp.dest('public/fonts'));
});
gulp.task('styles', function() {
  return gulp.src('node_modules/@fortawesome/fontawesome-free/css/*.min.*', {allowEmpty:true})
      .pipe(gulp.dest('public/css'));
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
gulp.task('jqueryjs', function() {
  return gulp.src(['node_modules/jquery/dist/jquery.min.js',
                  'node_modules/jquery/dist/jquery.min.map'], {allowEmpty:true})
      .pipe(gulp.dest('public/js'));
});
gulp.task('data-folders', function() {
  //TODO fix
  const folders = [
      './data/products',
      './data/patterns'
    ];

    folders.forEach(dir => {
        if(!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
            console.log('📁  folder created:', dir);    
        }   
    });
  return;
});
gulp.task('default', gulp.series(['clean', 'fonts', 'styles', 'bootstrapcss', 'bootstrapjs', 'jqueryjs']));
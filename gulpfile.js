const gulp = require('gulp')
const babel = require('gulp-babel')

gulp.task('default', () =>
  gulp
    .src('index.js')
    .pipe(
      babel({
        presets: ['es2015'],
        plugins: ['async-to-promises']
      })
    )
    .pipe(gulp.dest('dist'))
)

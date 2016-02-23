'use strict';

var gulp = require('gulp'),
    run = require('gulp-run');

gulp.task('clean', function() {
  var del = require('del');
  return del(['./output/']);
});

gulp.task('kramdown', function() {
  var rename = require('gulp-rename');
  return gulp
  .src('draft-*.md', {read: false})
  .pipe(run("kramdown-rfc2629 '<%%= file.path %>'", {verbosity: 1}))
  .pipe(rename(function (path) {
    path.extname = ".xml";
    return path;
  }))
  .pipe(gulp.dest('./output'))
});

gulp.task('xml2rfc', ['kramdown'], function() {
  return gulp
  .src('output/*.xml', {read: false})
  .pipe(run("xml2rfc --text --html '<%%= file.path %>'"));
});

gulp.task('watch', ['xml2rfc'], function() {
  return gulp.watch(['draft-*.md'], ['xml2rfc']);
});

gulp.task('open', ['serve'], function() {
  var through = require('through2');
  var open = require('open');
  return gulp
  .src('output/*.html', {read: false})
  .pipe(through.obj(function(file) {
    open('http://localhost:3000/' + file.relative);
  }));
});

gulp.task('serve', ['watch'], function() {
  var gls = require('gulp-live-server');
  var server = gls['static']('output');
  server.start();

  return gulp
  .watch(['output/*.html'], function(file) {
    return server.notify.apply(server, [file]);
  });
});

gulp.task('default', ['open']);

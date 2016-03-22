'use strict';

const gulp = require('gulp'),
      gutil = require('gulp-util'),
      spawn = require('child_process').spawn,
      through2 = require('through2');

function run(cmd, params, ready) {
  return new Promise((res, rej) => {
    var child = spawn(cmd, params, {stdio: 'pipe'});
    child.on('error', er => {
      rej(new gutil.PluginError(cmd, er));
    });
    child.stderr.on('data', data => {
      gutil.log(gutil.colors.red(cmd + ':'), data.toString('utf8'));
    });
    child.on('close', (code, sig) => {
      if (code || sig) {
        var er = new gutil.PluginError(cmd, 'Exited with code: ' + code);
        return rej(er);
      }
      res();
    });
    if (ready) {
      ready(child);
    }
  });
}

function kramdown(ignoreErrors) {
  return through2.obj(function(file, enc, cb) {
    run('kramdown-rfc2629', file.isNull() ? [file.path] : [], child => {
      if (file.isStream()) {
        file.contents.pipe(child.stdin);
      } else {
        child.stdin.end(file.contents); // might be null
      }
      file.path = gutil.replaceExtension(file.path, '.xml');
      file.contents = child.stdout;
    })
    .then(cb, er => {
      file.prevError = er;
      if (ignoreErrors) {
        gutil.beep();
        gutil.log(gutil.colors.red('kramdown-rfc2629'), er.message);
        cb()
      } else {
        cb(er);
      }
    });

    this.push(file);
  });
}

function xml2rfc(ignoreErrors) {
  return through2.obj(function(file, enc, cb) {
    if (file.prevError) {
      return cb();
    }
    run('xml2rfc', ['--text', '--html', file.path], child => {
      child.stdin.end();
    })
    .then(cb, er => {
      file.prevError = er;
      if (ignoreErrors) {
        gutil.beep();
        gutil.log(gutil.colors.red('xml2rfc'), er.message);
        cb();
      } else {
        cb(er);
      }
    });

    this.push(file);
  });
}

gulp.task('kramdown', function() {
  return gulp
  .src(['*.md', '!README.md'])
  .pipe(kramdown())
  .pipe(gulp.dest('./output'))
});

gulp.task('xml2rfc', ['kramdown'], function() {
  return gulp
  .src('output/*.xml', {read: false})
  .pipe(xml2rfc());
});

gulp.task('bothIgnore', function() {
  return gulp
  .src(['*.md', '!README.md'])
  .pipe(kramdown(true))
  .pipe(gulp.dest('./output'))
  .pipe(xml2rfc(true));
});

gulp.task('clean', function() {
  var del = require('del');
  return del(['./output/']);
});

gulp.task('watch', ['bothIgnore'], function() {
  return gulp.watch(['*.md', '!README.md', '*.cddl', '*.json'], ['bothIgnore']);
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

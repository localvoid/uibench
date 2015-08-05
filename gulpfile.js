'use strict';
var gulp = require('gulp');
var gutil = require('gulp-util');
var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var webpackConfig = require('./webpack.config.js');
var ghPages = require('gulp-gh-pages');

gulp.task('html', function() {
  gulp.src('web/index.html')
      .pipe(gulp.dest('build'));
});

gulp.task('build', function(callback) {
  var myConfig = Object.create(webpackConfig);
  myConfig.entry = [
    './web/js/main.jsx'
  ];
  myConfig.plugins = myConfig.plugins || [];
  myConfig.plugins = myConfig.plugins.concat(
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: JSON.stringify('production')
        }
      }),
      new webpack.optimize.DedupePlugin(),
      new webpack.optimize.UglifyJsPlugin()
  );

  // run webpack
  webpack(myConfig, function(err, stats) {
    if (err) {
      throw new gutil.PluginError('build', err);
    }
    gutil.log('[build]', stats.toString({
      colors: true
    }));
    callback();
  });
});


gulp.task('serve', function(callback) {
  var myConfig = Object.create(webpackConfig);
  myConfig.devtool = 'eval';
  myConfig.debug = true;

  new WebpackDevServer(webpack(myConfig), {
    contentBase: './build',
    stats: {
      colors: true
    }
  }).listen(8080, '0.0.0.0', function (err) {
    if (err) throw new gutil.PluginError('webpack-dev-server', err);
    gutil.log('[serve]', 'http://localhost:8080/webpack-dev-server/index.html');
  });
});

gulp.task('deploy', ['default'], function () {
  return gulp.src('./build/**/*')
      .pipe(ghPages());
});

gulp.task('default', ['html', 'build']);

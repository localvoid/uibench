'use strict';
var gulp = require('gulp');
var gutil = require('gulp-util');
var webpack = require('webpack');
var WebpackDevServer = require('webpack-dev-server');
var ghPages = require('gulp-gh-pages');
var path = require('path');

gulp.task('html', function() {
  gulp.src('web/index.html')
      .pipe(gulp.dest('build'));
});

gulp.task('build', function(callback) {
  var cfg = {
    entry: ['./web/js/main.jsx'],
    output: {
      path: path.join(__dirname, 'build'),
      filename: 'bundle.js'
    },
    resolve: {
      extensions: ['', '.js', '.jsx']
    },
    module: {
      loaders: [{
        test: /\.jsx?$/,
        exclude: /(node_modules)/,
        loaders: ['babel']
      }]
    },
    plugins: [
      new webpack.NoErrorsPlugin(),
      new webpack.DefinePlugin({'process.env': {NODE_ENV: JSON.stringify('production')}}),
      new webpack.optimize.DedupePlugin(),
      new webpack.optimize.UglifyJsPlugin()
    ]
  };

  webpack(cfg, function(err, stats) {
    if (err) throw new gutil.PluginError('build', err);
    gutil.log('[build]', stats.toString({colors: true}));
    callback();
  });
});


gulp.task('serve', ['html'], function(callback) {
  var cfg = {
    entry: [
      'webpack-dev-server/client?http://0.0.0.0:8080',
      './web/js/main.jsx'
    ],
    devtool: 'eval',
    debug: true,
    output: {
      path: path.join(__dirname, 'build'),
      filename: 'bundle.js'
    },
    resolve: {
      extensions: ['', '.js', '.jsx']
    },
    module: {
      loaders: [{
        test: /\.jsx?$/,
        exclude: /(node_modules)/,
        loaders: ['babel']
      }]
    },
    plugins: [
      new webpack.NoErrorsPlugin()
    ]
  };

  new WebpackDevServer(webpack(cfg), {
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

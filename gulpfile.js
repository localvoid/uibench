const gulp = require('gulp');
const gutil = require('gulp-util');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const path = require('path');

const WPConfig = {
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  module: {
    loaders: [{
      test: /\.jsx?$/,
      exclude: /(node_modules)/,
      loaders: ['babel?{ "presets": ["es2015-loose", "react"], "plugins": ["transform-react-inline-elements"] }']
    }]
  },
};

function copyHtml() {
  return gulp.src('web/index.html')
    .pipe(gulp.dest('build'));
}

function buildJS(done) {
  webpack(Object.assign({}, WPConfig, {
    entry: ['./web/main.jsx'],
    output: {
      path: path.join(__dirname, 'build'),
      filename: 'bundle.js'
    },
    plugins: [
      new webpack.NoErrorsPlugin(),
      new webpack.DefinePlugin({ 'process.env': { NODE_ENV: JSON.stringify('production') } }),
      new webpack.optimize.DedupePlugin(),
      new webpack.optimize.UglifyJsPlugin()
    ],
  }), (err, stats) => {
    if (err) {
      throw new gutil.PluginError('build', err);
    }
    gutil.log('[build]', stats.toString({ colors: true }));
    done();
  });
}

function serve() {
  new WebpackDevServer(webpack(Object.assign({}, WPConfig, {
    entry: [
      'webpack-dev-server/client?http://0.0.0.0:8080',
      './web/main.jsx'
    ],
    devtool: 'eval',
    debug: true,
    output: {
      path: path.join(__dirname, 'build'),
      filename: 'bundle.js'
    },
    plugins: [
      new webpack.NoErrorsPlugin()
    ],
  })), {
    contentBase: './build',
    stats: {
      colors: true
    }
  }).listen(8080, '0.0.0.0', (err) => {
    if (err) {
      throw new gutil.PluginError('webpack-dev-server', err);
    }
    gutil.log('[serve]', 'http://localhost:8080/webpack-dev-server/index.html');
  });
}

function deploy() {
  const ghPages = require('gulp-gh-pages');

  return gulp.src('./build/**/*')
    .pipe(ghPages());
}

const build = gulp.parallel(copyHtml, buildJS);

exports.default = build;
exports.deploy = gulp.series(build, deploy);
exports.serve = serve;

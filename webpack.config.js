const path = require("path");

module.exports = {
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "docs"),
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      },
    ],
  },
  resolve: {
    extensions: [".js", ".jsx"],
  },

  devServer: {
    port: 9000,
    host: "localhost",
    historyApiFallback: true,
    noInfo: false,
    stats: "minimal",
    contentBase: path.join(__dirname, "docs"),
  },
};

import path from 'node:path';
import webpack from 'webpack';

import HtmlWebpackPlugin from 'html-webpack-plugin';

const prod = process.env.NODE_ENV === 'production';

const __dirname = 'dist';

export default {
  mode: prod ? 'production' : 'development',
  devtool: 'eval-cheap-module-source-map',
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, './public'),
    filename: 'bundle.js',
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx', '.json', '.mjs', '.wasm'],
  },
  module: {
    rules: [
      {
        test: /\.ts(x)?$/,
        use: {
          loader: 'ts-loader',
        },
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
    new webpack.DefinePlugin({
      NODE_ENV: JSON.stringify(process.env.NODE_ENV),
    }),
  ],
  devServer: {
    open: false,
    hot: true,
  },
};

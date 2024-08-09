/**
 * Base webpack config used across other specific configs
 */

import webpack from 'webpack';
import TsconfigPathsPlugins from 'tsconfig-paths-webpack-plugin';
import webpackPaths from './webpack.paths';
import { dependencies as externals } from '../../release/app/package.json';

const configuration: webpack.Configuration = {
  externals: [...Object.keys(externals || {})],

  stats: 'errors-only',

  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            // Remove this line to enable type checking in webpack builds
            transpileOnly: true,
            compilerOptions: {
              module: 'esnext',
            },
          },
        },
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf|svg)$/,
        use: ['file-loader'],
      },
      // {
      //   test: /\.svg$/,
      //   use: ['@svgr/webpack'],
      // },
      {
        test: /.node$/,
        loader: 'node-loader',
      },
      /* {
      //   test: /\.(LICENSE|\.d.ts|\.md|\.apk|\.sh|\.ps1|\.css|\.dmg|\.html|\.exe|\.ttf)$/,
      //   include: "/node_modules/playwright-core/",
      //   use: ["null-loader"]
      // },

      //the below are scuffed for now :)
      {
        test: /\/node_modules\/playwright-core\/lib\/vite\/recorder\/index\.html$/,
        use: ["null-loader"]
      },
      {
        test: /\/node_modules\/playwright-core\/lib\/vite\/recorder\/index\.html$/,
        use: ["null-loader"]
      },
      {
        test: /\/node_modules\/playwright-core\/lib\/vite\/recorder\/assets\/index-ljsTwXtJ\.css$/,
        use: ["null-loader"]
      },
      {
        test: /\/node_modules\/playwright-core\/lib\/vite\/recorder\/assets\/codeMirrorModule-Hs9-1ZG4\.css$/,
        use: ["null-loader"]
      },*/

    ],
  },

  output: {
    path: webpackPaths.srcPath,
    // https://github.com/webpack/webpack/issues/1114
    library: {
      type: 'commonjs2',
    },
  },

  /**
   * Determine the array of extensions that should be used to resolve modules.
   */
  resolve: {
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
    modules: [webpackPaths.srcPath, 'node_modules'],
    // There is no need to add aliases here, the paths in tsconfig get mirrored
    plugins: [new TsconfigPathsPlugins()],
    fallback: {
      fs: false,
      path: require.resolve('path-browserify'),
      os: require.resolve('os-browserify/browser'),
      url: require.resolve("url/"),
      // assert: require.resolve('assert/'),
    },
  },

  plugins: [
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'production',
    }),
  ],
};

export default configuration;

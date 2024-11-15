import path from 'path';
import webpack from 'webpack';
import { merge } from 'webpack-merge';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import baseConfig from './webpack.config.base';
import webpackPaths from './webpack.paths';
import checkNodeEnv from '../scripts/check-node-env';
import CopyWebpackPlugin from 'copy-webpack-plugin';

// When an ESLint server is running, we can't set the NODE_ENV so we'll check if it's
// at the dev webpack config is not accidentally run in a production environment
if (process.env.NODE_ENV === 'production') {
  checkNodeEnv('development');
}

const configuration: webpack.Configuration = {
  devtool: 'inline-source-map',

  mode: 'development',

  target: 'electron-preload',

  entry: async () => {
    const fs = require('fs');
    const getAllFiles = async (dir: string): Promise<string[]> => {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });
      const files = await Promise.all(
        entries.map(async (entry) => {
          const res = path.resolve(dir, entry.name);
          return entry.isDirectory() ? getAllFiles(res) : res;
        }),
      );
      return files
        .flat()
        .filter((file) => file.endsWith('.js') || file.endsWith('.json'));
    };

    const platformsDir = path.join(webpackPaths.srcMainPath, 'platforms');
    const files = await getAllFiles(platformsDir);

    const entry = {
      main: path.join(webpackPaths.srcMainPath, 'main.ts'),
      preload: path.join(webpackPaths.srcMainPath, 'preload.ts'),
      preloadWebview: path.join(webpackPaths.srcMainPath, 'preloadWebview.js'),
      preloadFunctions: path.join(
        webpackPaths.srcMainPath,
        'preloadFunctions.js',
      ),
      preloadElectron: path.join(
        webpackPaths.srcMainPath,
        'preloadElectron.js',
      ),
    };

    files.forEach((file) => {
      const relativePath = path.relative(platformsDir, file);
      const name = relativePath.replace(/\.(js|json)$/, '').replace(/\\/g, '/');
      entry[name] = file;
    });

    return entry;
  },
  output: {
    path: webpackPaths.dllPath,
    filename: '[name].js',
    library: {
      type: 'umd',
    },
  },

  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: process.env.ANALYZE === 'true' ? 'server' : 'disabled',
    }),

    new webpack.EnvironmentPlugin({
      NODE_ENV: 'development',
    }),

    new webpack.LoaderOptionsPlugin({
      debug: true,
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.join(webpackPaths.srcMainPath, 'platforms'),
          globOptions: {
            ignore: ['**/*.js', '**/*.md'],
          },
          to: path.join(webpackPaths.distMainPath),
          noErrorOnMissing: true,
        },
      ],
    }),
  ],

  node: {
    __dirname: false,
    __filename: false,
  },

  watch: true,
};

export default merge(baseConfig, configuration);
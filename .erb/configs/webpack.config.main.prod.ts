import path from 'path';
import webpack from 'webpack';
import { merge } from 'webpack-merge';
import TerserPlugin from 'terser-webpack-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import baseConfig from './webpack.config.base';
import webpackPaths from './webpack.paths';
import checkNodeEnv from '../scripts/check-node-env';
import deleteSourceMaps from '../scripts/delete-source-maps';

checkNodeEnv('production');
deleteSourceMaps();

const configuration: webpack.Configuration = {
  devtool: 'source-map',

  mode: 'production',

  target: 'electron-main',

  entry: async () => {
    const fs = require('fs');
    const getAllJsFiles = async (dir: string): Promise<string[]> => {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });
      const files = await Promise.all(
        entries.map(async (entry) => {
          const res = path.resolve(dir, entry.name);
          return entry.isDirectory() ? getAllJsFiles(res) : res;
        }),
      );
      return files.flat().filter((file) => file.endsWith('.js'));
    };

    const scrapersDir = path.join(webpackPaths.srcMainPath, 'Scrapers');
    const jsFiles = await getAllJsFiles(scrapersDir);

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

    jsFiles.forEach((file) => {
      const relativePath = path.relative(scrapersDir, file);
      const name = relativePath.replace(/\.js$/, '').replace(/\\/g, '/');
      entry[name] = file;
    });

    return entry;
  },

  output: {
    path: webpackPaths.distMainPath,
    filename: '[name].js',
    library: {
      type: 'umd',
    },
  },

  optimization: {
    minimizer: [
      new TerserPlugin({
        parallel: true,
      }),
    ],
  },

  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: process.env.ANALYZE === 'true' ? 'server' : 'disabled',
      analyzerPort: 8888,
    }),

    new webpack.EnvironmentPlugin({
      NODE_ENV: 'production',
      DEBUG_PROD: false,
      START_MINIMIZED: false,
    }),

    new webpack.DefinePlugin({
      'process.type': '"browser"',
    }),
  ],

  node: {
    __dirname: false,
    __filename: false,
  },
};

export default merge(baseConfig, configuration);
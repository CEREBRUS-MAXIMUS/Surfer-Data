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
    const getAllFiles = async (
      dir: string,
      extensions: string[],
    ): Promise<string[]> => {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });
      const files = await Promise.all(
        entries.map(async (entry) => {
          const res = path.resolve(dir, entry.name);
          return entry.isDirectory() ? getAllFiles(res, extensions) : res;
        }),
      );
      return files
        .flat()
        .filter((file) => extensions.some((ext) => file.endsWith(ext)));
    };

    const scrapersDir = path.join(webpackPaths.srcMainPath, 'Scrapers');
    const files = await getAllFiles(scrapersDir, ['.js', '.json']);

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
      const relativePath = path.relative(scrapersDir, file);
      const name = relativePath.replace(/\.(js|json)$/, '').replace(/\\/g, '/');
      if (file.endsWith('.js')) {
        entry[name] = file;
      }
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

  module: {
    rules: [
      {
        test: /\.json$/,
        include: path.join(webpackPaths.srcMainPath, 'Scrapers', 'Google'),
        type: 'javascript/auto',
        use: [
          {
            loader: 'file-loader',
            options: {
              name(resourcePath, resourceQuery) {
                const relativePath = path.relative(webpackPaths.srcMainPath, resourcePath);
                console.log('this relative path', relativePath);
                return `${relativePath}`;
              },
            },
          },
        ],
      },
    ],
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
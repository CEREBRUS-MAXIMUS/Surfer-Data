const { notarize } = require('@electron/notarize');
require('dotenv').config();
const { build } = require('../../package.json');

exports.default = async function notarizeMacos(context) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== 'darwin') {
    return;
  }

  if (process.env.CI !== 'true') {
    console.warn('Skipping notarizing step. Packaging is not running in CI');
    return;
  }

  if (
    !('APPLE_ID' in process.env && 'APPLE_APP_SPECIFIC_PASSWORD' in process.env)
  ) {
    console.warn(
      'Skipping notarizing step. APPLE_ID and APPLE_APP_SPECIFIC_PASSWORD env variables must be set',
    );
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  console.log(`Notarizing ${appName}`);
  console.log(`  appBundleId: ${build.appId}`);
  console.log(`  appPath: ${appOutDir}/${appName}.app`);
  console.log(`  appleId: ${process.env.APPLE_ID}`);
  console.log(`  teamId: ${process.env.APPLE_TEAM_ID}`);
  console.log(` appleIdPassword: ${process.env.APPLE_APP_SPECIFIC_PASSWORD}`);
  console.log();

  try {
    await notarize({
      appBundleId: build.appId,
      appPath: `${appOutDir}/${appName}.app`,
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
    });
  } catch (error) {
    console.log(`Failed to notarize ${appName}`);
    console.log(`  appBundleId: ${build.appId}`);
    console.error(`Failed to notarize ${appName}`, error);
    console.error(error)
  }

  console.log('Notarization complete');
};

import schedule from 'node-schedule';
import { isToday, parseISO, format } from 'date-fns';
import { waitForExportCompletion } from '../main';
import { BrowserWindow } from 'electron';
import { ipcMain } from 'electron';

export const scheduledJobs = new Map();


export const runInitialExports = async (platform: any, runs: any) => {
  const now = parseISO(new Date().toISOString());
  const twentyFourHoursAgo = parseISO(new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());
  const oneHourAgo = parseISO(new Date(now.getTime() - 60 * 60 * 1000).toISOString());

  const todayRuns = runs.filter(
    (run: any) =>
      run.platformId === platform.id &&
      run.status === 'success' &&
      parseISO(run.endDate || run.startDate) > twentyFourHoursAgo
  );

  const hourlyRuns = runs.filter(
    (run: any) =>
      run.platformId === platform.id &&
      run.status === 'success' &&
      parseISO(run.endDate || run.startDate) > oneHourAgo
  );

  if (platform.exportFrequency === 'daily') {
    if (todayRuns.length === 0) {
      await waitForExportCompletion(platform.id);
    }
    else {
        console.log(`Export already completed for ${platform.name}`)
    }
  } else if (platform.exportFrequency === 'hourly') {
    if (hourlyRuns.length === 0) {
      await waitForExportCompletion(platform.id);
    } else {
      console.log(`Export already completed for ${platform.name}`);
    }
  }
};

export const scheduleNextExport = async (platform: any, runs: any) => {
  if (scheduledJobs.has(platform.id)) {
    scheduledJobs.get(platform.id).cancel();
  }

  const lastSuccessfulRun = runs
    .filter((run: any) => run.platformId === platform.id && run.status === 'success')
    .sort((a: any, b: any) => 
      parseISO(b.endDate || b.startDate).getTime() - parseISO(a.endDate || a.startDate).getTime()
    )[0];

  let nextRun = new Date();
  const now = new Date();

  if (lastSuccessfulRun) {
    const lastRunTime = parseISO(lastSuccessfulRun.endDate || lastSuccessfulRun.startDate);

    if (platform.exportFrequency === 'hourly') {
      // Schedule for 1 hour after the last successful run
      nextRun = new Date(lastRunTime.getTime() + 60 * 60 * 1000);
      
      // If the calculated next run is in the past, schedule for the next hour from now
      if (nextRun < now) {
        nextRun = new Date(now.getTime() + 60 * 60 * 1000);
      }
    } else if (platform.exportFrequency === 'daily') {
      // Schedule for 24 hours after the last successful run
      nextRun = new Date(lastRunTime.getTime() + 24 * 60 * 60 * 1000);
      
      // If the calculated next run is in the past, schedule for the next day at midnight
      if (nextRun < now) {
        nextRun = new Date(now.setHours(24, 0, 0, 0));
      }
    }
  } else {
    // If no successful runs yet, schedule relative to now
    if (platform.exportFrequency === 'hourly') {
      nextRun = new Date(now.getTime() + 60 * 60 * 1000);
    } else if (platform.exportFrequency === 'daily') {
      nextRun = new Date(now.setHours(24, 0, 0, 0));
    }
  }

  console.log(
    `Scheduled export for ${platform.name} for ${format(nextRun, 'yyyy-MM-dd HH:mm:ss')} ` +
    `(${lastSuccessfulRun ? 'based on last run' : 'no previous runs'})`
  );

  const job = schedule.scheduleJob(nextRun, async () => {
    try {
      await waitForExportCompletion(platform.id);
      scheduleNextExport(platform, runs);
      console.log(`Export completed for ${platform.name}, next run scheduled`);
    } catch (error) {
      console.error(`Scheduled export failed for ${platform.name}:`, error);
      // Still schedule next run even if this one failed
      scheduleNextExport(platform, runs);
    }
  });

  scheduledJobs.set(platform.id, job);
};


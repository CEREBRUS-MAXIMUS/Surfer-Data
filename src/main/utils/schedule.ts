import schedule from 'node-schedule';
import { isToday, parseISO, format } from 'date-fns';
import { waitForExportCompletion } from '../main';

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

export const scheduleNextExport = (platform: any) => {
  if (scheduledJobs.has(platform.id)) {
    scheduledJobs.get(platform.id).cancel();
  }

  const now = parseISO(new Date().toISOString());
  let nextRun = parseISO(new Date().toISOString());

  if (platform.exportFrequency === 'hourly') {
    nextRun.setTime(now.getTime() + 60 * 1000 * 60);
    console.log(
      `Scheduled export for ${platform.name} for ${format(nextRun, 'yyyy-MM-dd HH:mm:ss')}`,
    );
  } else if (platform.exportFrequency === 'daily') {
    nextRun.setDate(now.getDate() + 1);
    nextRun.setHours(0, 0, 0, 0);
    console.log(
      `Scheduled export for ${platform.name} for ${format(nextRun, 'yyyy-MM-dd HH:mm:ss')}`,
    );
  }

  const job = schedule.scheduleJob(nextRun, async () => {
    try {
      await waitForExportCompletion(platform.id);
      scheduleNextExport(platform);
      console.log(`Export scheduled for ${platform.name}`)
    } catch (error) {
      console.error(`Scheduled export failed for ${platform.name}:`, error);
      // Still schedule next run even if this one failed
      scheduleNextExport(platform);
    }
  });

  scheduledJobs.set(platform.id, job);
};


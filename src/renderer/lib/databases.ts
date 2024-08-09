
export async function deleteRunFromDB(runId: string) {
  try {
    const db = await openDB('dataExtractionDB', 1);
    await db.delete('runs', runId);
    console.log(`Run ${runId} deleted from database`);
  } catch (error) {
    console.error('Error deleting run from database:', error);
    throw error;
  }
}

export async function deleteRunsForPlatformFromDB(platformId: string) {
  try {
    const db = await openDB('dataExtractionDB', 1);
    await db.delete('runs', platformId);
    console.log(`Runs for platform ${platformId} deleted from database`);
  } catch (error) {
    console.error('Error deleting runs for platform from database:', error);
    throw error;
  }
}

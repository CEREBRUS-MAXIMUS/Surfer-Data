const {
  customConsoleLog,
  wait,
  waitForElement,
  bigStepper,
} = require('../../preloadFunctions');
const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

async function exportCalendar(id, platformId, filename, company, name) {
  const userDataPath = await ipcRenderer.invoke('get-user-data-path');
  const calendarPath = path.join(
    userDataPath,
    'surfer_data',
    company,
    name,
    platformId,
    'extracted',
    `${platformId}.json`,
  );

  customConsoleLog(id, 'Not first export, getting current calendar events!');

  if (!window.location.href.includes('calendar.google.com') && !window.location.href.includes('calendar')) {
    customConsoleLog(id, 'Navigating to Google Calendar');
    bigStepper(id, 'Navigating to Google Calendar');
    window.location.assign('https://calendar.google.com/calendar/u/0/r/week');
  }

  await wait(2);

  const events = [];
  bigStepper(id, 'Getting calendar events');

  // Extract events from the calendar view
  const eventElements = document.querySelectorAll('.GTG3wb');
  customConsoleLog(id, 'Found ' + eventElements.length + ' events');

  for (const eventElement of eventElements) {
    // Click on the event to open the modal
    eventElement.click();
    await wait(1); // Wait for the modal to open

    const eventJSON = extractEventDetails();

    // Close the modal
    const closeButton = document.querySelector('.Tnsqdc [aria-label="Close"]');
    if (closeButton) {
      closeButton.click();
      await wait(1); // Wait for the modal to close
    }

    eventJSON.added_to_db = new Date().toISOString();

    ipcRenderer.send(
      'handle-update',
      company,
      name,
      platformId,
      JSON.stringify(eventJSON),
      id,
      calendarPath,
    );
    events.push(eventJSON);
  }

  const uniqueEvents = [...new Set(events.map(JSON.stringify))].map(JSON.parse);
  customConsoleLog(id, 'Unique events collected:', uniqueEvents.length);

  ipcRenderer.send(
    'handle-update-complete',
    id,
    platformId,
    company,
    name,
    calendarPath,
  );
  return 'HANDLE_UPDATE_COMPLETE';
}

function extractEventDetails() {
  const title = document.querySelector('#rAECCd')?.textContent.trim() || '';
  const dateTime =
    document.querySelector('.AzuXid.O2VjS.CyPPBf')?.textContent.trim() || '';
  const location =
    document.querySelector('#xDetDlgLoc .UfeRlc.HRaT6d')?.textContent.trim() ||
    '';
  const description =
    document
      .querySelector('#xDetDlgDesc span[jsaction="rcuQ6b:g0mjXe"]')
      ?.textContent.trim() || '';
  const status =
    document.querySelector('.GbZFNe')?.textContent.trim() || 'Needs RSVP';

  const organizerElement = document.querySelector('#xDetDlgCal .UfeRlc');
  const organizer = organizerElement
    ? organizerElement.textContent.replace('Organizer: ', '').trim()
    : '';

  const createdByElement = document.querySelector('#xDetDlgCal .AzuXid.O2VjS');
  const createdBy = createdByElement
    ? createdByElement.textContent.replace('Created by: ', '').trim()
    : '';

  const attachments = Array.from(
    document.querySelectorAll('#xDetDlgAtm .gCeV0e.sYtJOd'),
  ).map((attachment) => ({
    name: attachment.querySelector('.PdReTd.rEYZee')?.textContent.trim() || '',
    url: attachment.querySelector('a')?.href || '',
  }));

  const notifications = Array.from(
    document.querySelectorAll('#xDetDlgNot .oIOto li'),
  ).map((notification) => notification.textContent.trim());

  return {
    title,
    dateTime,
    location,
    description,
    status,
    organizer,
    createdBy,
    attachments,
    notifications,
  };
}

module.exports = exportCalendar;

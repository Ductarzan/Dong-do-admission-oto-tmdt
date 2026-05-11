/**
 * Google Apps Script cho landing page tuyển sinh.
 * Nhận dữ liệu qua query string (e.parameter) cho cả GET/POST.
 */
const SHEET_NAME = 'Leads';
const HEADERS = [
  'submitted_at',
  'form_name',
  'full_name',
  'name',
  'phone',
  'email',
  'major',
  'method',
  'gpa_sum',
  'page_url'
];

function doGet(e) {
  return handleRequest_(e);
}

function doPost(e) {
  return handleRequest_(e);
}

function handleRequest_(e) {
  try {
    const sheet = getOrCreateSheet_();
    ensureHeaderRow_(sheet);

    const data = (e && e.parameter) ? e.parameter : {};
    const row = HEADERS.map((key) => safeCell_(data[key]));
    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  return sheet;
}

function ensureHeaderRow_(sheet) {
  const firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const isEmpty = firstRow.every((v) => String(v).trim() === '');
  if (isEmpty) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
}

function safeCell_(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

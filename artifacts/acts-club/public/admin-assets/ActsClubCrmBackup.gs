/**
 * ACTS Club CRM backup. Bind this file to the dedicated ACTS workbook.
 * Script Properties (never paste passwords/tokens into this source):
 * API_BASE_URL, WORKBOOK_ID, ACTS_ADMIN_PASSWORD, ACTS_SHEETS_SYNC_TOKEN.
 * API_BASE_URL is the full HTTPS API prefix, ending in /api.
 * After authorizing, run installActsClubBackup() once.
 */
const ACTS_HEADERS = Object.freeze([
  "Submission ID", "Full Name", "Contact Number", "WhatsApp Number", "City",
  "Instagram ID", "You Are", "Creator Type", "Other Type", "Primary Skill",
  "Other Skill", "Looking For", "Guidelines Accepted", "Payment Status",
  "Amount INR", "Currency", "Order ID", "Payment ID", "Paid At UTC",
  "Review Status", "CRM Stage", "CRM Notes", "Follow-up At UTC", "Archived",
  "Submitted At UTC", "Updated At UTC",
]);

function actsProperties_() {
  const p = PropertiesService.getScriptProperties();
  const base = (p.getProperty("API_BASE_URL") || "").replace(/\/+$/, "");
  const workbookId = p.getProperty("WORKBOOK_ID") || "";
  const password = p.getProperty("ACTS_ADMIN_PASSWORD") || "";
  if (!/^https:\/\/[A-Za-z0-9.-]+(?::443)?\/[A-Za-z0-9._/-]+$/.test(base) ||
      !/^[A-Za-z0-9_-]{20,100}$/.test(workbookId) || !password) {
    throw new Error("Configure API_BASE_URL, WORKBOOK_ID and ACTS_ADMIN_PASSWORD in Script Properties.");
  }
  return { base: base, workbookId: workbookId, password: password };
}

function actsApi_(config, path, method, token, body) {
  const options = { method: method, muteHttpExceptions: true, followRedirects: false, headers: {} };
  if (token) options.headers.Authorization = "Bearer " + token;
  if (body !== undefined) {
    options.contentType = "application/json";
    options.payload = JSON.stringify(body);
  }
  const response = UrlFetchApp.fetch(config.base + path, options);
  const status = response.getResponseCode();
  if (status < 200 || status >= 300) throw new Error("ACTS API returned HTTP " + status + ". No backup was confirmed.");
  if (status === 204) return null;
  let data;
  try { data = JSON.parse(response.getContentText()); }
  catch (_) { throw new Error("ACTS API returned invalid JSON. Existing backup was retained."); }
  return data;
}

function actsText_(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "boolean" || typeof value === "number") return value;
  const text = String(value);
  // Apps Script setValues otherwise executes user-supplied spreadsheet formulas.
  return /^[=+\-@\t\r]/.test(text) ? "'" + text : text;
}

function actsRow_(r) {
  const a = r.application;
  return [
    r.id, a.fullName, a.contactNumber, a.whatsappNumber, a.city, a.instagramId,
    a.youAre, a.creatorType, a.otherType, a.primarySkill, a.otherSkill, a.lookingFor,
    a.agreesToGuidelines, r.paymentStatus, r.amount / 100, r.currency,
    r.orderId, r.paymentId, r.paidAt, r.reviewStatus, r.stage, r.notes,
    r.followUpAt, r.archived, r.createdAt, r.updatedAt,
  ].map(actsText_);
}

function actsReadAll_(config, token) {
  // A new submission can shift offset pagination; retry rather than certify a partial snapshot.
  for (let attempt = 0; attempt < 3; attempt++) {
    const rows = [];
    const seen = {};
    let expected = null;
    let consistent = true;
    for (let page = 1; page <= 500; page++) {
      const data = actsApi_(config, "/acts/admin/crm?includeArchived=true&limit=100&page=" + page, "get", token);
      if (!data || !Array.isArray(data.items) || !Number.isInteger(data.total) || data.total < 0) {
        throw new Error("Invalid CRM data. Existing backup was retained.");
      }
      if (expected === null) expected = data.total;
      if (data.total !== expected) { consistent = false; break; }
      for (const row of data.items) {
        if (!row || !row.id || !row.application || seen[row.id]) { consistent = false; break; }
        seen[row.id] = true;
        rows.push(row);
      }
      if (!consistent) break;
      if (rows.length === expected) return rows;
      if (data.items.length === 0) { consistent = false; break; }
    }
    if (attempt < 2) Utilities.sleep(500);
  }
  throw new Error("CRM changed during export or exceeded 50,000 records. Existing backup was retained; retry.");
}

function actsWriteSheet_(workbook, title, headers, rows) {
  const sheet = workbook.getSheetByName(title) || workbook.insertSheet(title);
  const values = [headers].concat(rows);
  if (sheet.getMaxRows() < values.length) sheet.insertRowsAfter(sheet.getMaxRows(), values.length - sheet.getMaxRows());
  if (sheet.getMaxColumns() < headers.length) sheet.insertColumnsAfter(sheet.getMaxColumns(), headers.length - sheet.getMaxColumns());
  // Write before clearing trailing rows: an API error never erases the old backup first.
  sheet.getRange(1, 1, values.length, headers.length).setValues(values);
  if (sheet.getLastRow() > values.length) {
    sheet.getRange(values.length + 1, 1, sheet.getLastRow() - values.length, headers.length).clearContent();
  }
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#1b1a18").setFontColor("#fff9f0");
}

function syncActsClubCrm() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) throw new Error("Another ACTS backup is running. Retry shortly.");
  let config;
  let token;
  try {
    const startedAt = new Date().toISOString();
    config = actsProperties_();
    const login = actsApi_(config, "/acts/admin/login", "post", null, { password: config.password });
    token = login.token;
    if (!/^[a-f0-9]{64}$/.test(token || "")) throw new Error("ACTS admin session was not returned.");
    const settings = actsApi_(config, "/acts/admin/backup", "get", token);
    if (settings.workbookId !== config.workbookId) throw new Error("The CRM workbook ID and Apps Script WORKBOOK_ID differ.");
    const records = actsReadAll_(config, token);
    const workbook = SpreadsheetApp.openById(config.workbookId);
    actsWriteSheet_(workbook, "All Submissions", ACTS_HEADERS, records.map(actsRow_));
    actsWriteSheet_(workbook, "Paid Members", ACTS_HEADERS, records.filter(r => r.paymentStatus === "successful").map(actsRow_));
    actsWriteSheet_(workbook, "Pending & Unpaid", ACTS_HEADERS, records.filter(r => r.paymentStatus !== "successful").map(actsRow_));
    actsWriteSheet_(workbook, "Archived", ACTS_HEADERS, records.filter(r => r.archived).map(actsRow_));
    actsWriteSheet_(workbook, "Overview", ["Metric", "Value"], [
      ["Last successful backup (UTC)", new Date().toISOString()],
      ["All submissions including archived", records.length],
      ["Captured payments", records.filter(r => r.paymentStatus === "successful").length],
      ["Captured amount INR", records.filter(r => r.paymentStatus === "successful").reduce((total, r) => total + r.amount / 100, 0)],
      ["Pending checkouts", records.filter(r => r.paymentStatus === "pending").length],
      ["Forms without checkout", records.filter(r => r.paymentStatus === "form_submitted").length],
      ["Archived records (retained)", records.filter(r => r.archived).length],
    ]);
    SpreadsheetApp.flush();
    const result = { synced: records.length, workbookId: config.workbookId, startedAt: startedAt };
    actsApi_(config, "/acts/admin/backup/report", "post", token, result);
    PropertiesService.getScriptProperties().setProperty("LAST_SYNC_AT", new Date().toISOString());
    return result;
  } finally {
    if (config && token) {
      try { actsApi_(config, "/acts/admin/session", "delete", token); } catch (_) { /* expires in 24h */ }
    }
    lock.releaseLock();
  }
}

function installActsClubBackup() {
  actsProperties_();
  syncActsClubCrm(); // Authorize and prove access before installing a schedule.
  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (trigger.getHandlerFunction() === "syncActsClubCrm") ScriptApp.deleteTrigger(trigger);
  });
  ScriptApp.newTrigger("syncActsClubCrm").timeBased().everyMinutes(5).create();
}

function doPost(event) {
  const json = value => ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
  let request;
  try { request = JSON.parse(event.postData.contents); } catch (_) { return json({ ok: false, error: "Invalid request." }); }
  const expected = PropertiesService.getScriptProperties().getProperty("ACTS_SHEETS_SYNC_TOKEN") || "";
  const supplied = typeof request.token === "string" ? request.token : "";
  // Equal-length hash comparison avoids leaking token prefix matches.
  const a = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, supplied);
  const b = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, expected);
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  if (expected.length < 32 || difference !== 0) return json({ ok: false, error: "Unauthorized." });
  if (request.workbookId !== PropertiesService.getScriptProperties().getProperty("WORKBOOK_ID")) {
    return json({ ok: false, error: "Workbook mismatch." });
  }
  try { return json(Object.assign({ ok: true }, syncActsClubCrm())); }
  catch (_) { return json({ ok: false, error: "Backup failed. Check Script Properties and API availability; CRM data remains in the database." }); }
}
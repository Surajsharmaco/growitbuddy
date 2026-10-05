import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createContext, runInContext } from "node:vm";

const source = await readFile(new URL("../../acts-club/public/admin-assets/ActsClubCrmBackup.gs", import.meta.url), "utf8");
test("ACTS Apps Script exports all fields safely, reports only completed writes and authenticates its bridge", () => {
  const workbookId = "acts_workbook_fixture_12345";
  const properties = new Map([
    ["API_BASE_URL", "https://api.example.test/api"], ["WORKBOOK_ID", workbookId],
    ["ACTS_ADMIN_PASSWORD", "synthetic-owner"], ["ACTS_SHEETS_SYNC_TOKEN", "synthetic-sync-token-of-at-least-32-characters"],
  ]);
  const sheets = new Map();
  let reported = false, flushed = false, revoked = false;
  const record = { id: "test-record", application: {
    fullName: "Synthetic applicant", contactNumber: "+919000000001", whatsappNumber: "+919000000002",
    city: "Test City", youAre: "Creator", creatorType: "Other", otherType: "Tester", primarySkill: "Other",
    otherSkill: "Test skill", instagramId: "test.creator", lookingFor: "Learning", agreesToGuidelines: true,
  }, paymentStatus: "form_submitted", amount: 9900, currency: "INR", stage: "contacted", notes: "=1+1",
    archived: true, followUpAt: "2026-10-06T03:30:00Z", createdAt: "2026-10-05T00:00:00Z", updatedAt: "2026-10-05T00:00:00Z" };
  const workbook = {
    getSheetByName(title) { return sheets.get(title); },
    insertSheet(title) {
      const sheet = { rows: [], getMaxRows: () => 1000, getMaxColumns: () => 30,
        getLastRow() { return this.rows.length; }, setFrozenRows() {},
        getRange(row, column, count) {
          const chain = { setValues: values => { sheet.rows = values; return chain; },
            clearContent: () => chain, setFontWeight: () => chain, setBackground: () => chain, setFontColor: () => chain };
          return chain;
        },
      };
      sheets.set(title, sheet); return sheet;
    },
  };
  const context = createContext({
    PropertiesService: { getScriptProperties: () => ({
      getProperty: key => properties.get(key), setProperty: (key, value) => properties.set(key, value),
    }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
    SpreadsheetApp: { openById: id => { assert.equal(id, workbookId); return workbook; }, flush: () => { flushed = true; } },
    Utilities: { sleep() {}, DigestAlgorithm: { SHA_256: "sha256" }, computeDigest: (_algorithm, value) => Array.from(Buffer.from(value)).concat(Array(64).fill(0)).slice(0, 64) },
    ContentService: { MimeType: { JSON: "json" }, createTextOutput: text => ({ setMimeType: () => JSON.parse(text) }) },
    UrlFetchApp: { fetch(url, options) {
      assert.equal(options.followRedirects, false);
      let status = 200, body;
      if (url.endsWith("/login")) { assert.equal(JSON.parse(options.payload).password, "synthetic-owner"); body = { token: "a".repeat(64) }; }
      else if (url.endsWith("/session")) { revoked = true; status = 204; }
      else {
        assert.equal(options.headers.Authorization, "Bearer " + "a".repeat(64));
        if (url.endsWith("/backup")) body = { workbookId };
        else if (url.includes("/crm?")) { assert.match(url, /includeArchived=true/); body = { total: 1, items: [record] }; }
        else if (url.endsWith("/backup/report")) {
          assert.equal(flushed, true); assert.equal(sheets.size, 5);
          assert.equal(JSON.parse(options.payload).synced, 1); reported = true; status = 204;
        } else throw new Error("Unexpected API request.");
      }
      return { getResponseCode: () => status, getContentText: () => JSON.stringify(body) };
    } },
  });
  runInContext(source, context);
  const result = runInContext("syncActsClubCrm()", context);
  assert.equal(result.synced, 1); assert.equal(reported, true); assert.equal(revoked, true);
  assert.equal(sheets.get("All Submissions").rows[1].length, 26);
  assert.equal(sheets.get("All Submissions").rows[1][2], "'+919000000001");
  assert.equal(sheets.get("All Submissions").rows[1][21], "'=1+1");
  assert.equal(sheets.get("Archived").rows.length, 2);
  assert.equal(sheets.get("Paid Members").rows.length, 1);
  assert.equal(sheets.get("Pending & Unpaid").rows.length, 2);
  context.event = { postData: { contents: JSON.stringify({ token: "wrong", workbookId }) } };
  assert.equal(runInContext("doPost(event)", context).ok, false);
});
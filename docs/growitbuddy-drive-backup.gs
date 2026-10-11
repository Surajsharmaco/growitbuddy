// Install in a PRIVATE Google Apps Script project. Never put the backup key in this file.
// Script Properties: GIB_BACKUP_KEY, GIB_DRIVE_FOLDER_ID, GIB_ALERT_EMAIL.
// Activate only after the CMS safety release and production migration are verified.
var GIB_API = "https://growitbuddy-api.onrender.com/api";

function gibConfig() {
  var p = PropertiesService.getScriptProperties();
  if (!p.getProperty("GIB_BACKUP_KEY") || !p.getProperty("GIB_DRIVE_FOLDER_ID") || !p.getProperty("GIB_ALERT_EMAIL")) {
    throw new Error("Set GIB_BACKUP_KEY, GIB_DRIVE_FOLDER_ID and GIB_ALERT_EMAIL in Script Properties.");
  }
  return p;
}
function gibCanonical(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(gibCanonical).join(",") + "]";
  return "{" + Object.keys(value).sort().map(function (k) { return JSON.stringify(k) + ":" + gibCanonical(value[k]); }).join(",") + "}";
}
function gibSha(bytesOrText) {
  var digest = typeof bytesOrText === "string"
    ? Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytesOrText, Utilities.Charset.UTF_8)
    : Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytesOrText);
  return digest
    .map(function (b) { return ("0" + (b & 255).toString(16)).slice(-2); }).join("");
}
function gibFolder(parent, name) {
  var found = parent.getFoldersByName(name);
  return found.hasNext() ? found.next() : parent.createFolder(name);
}
function gibAlert() {
  var address = PropertiesService.getScriptProperties().getProperty("GIB_ALERT_EMAIL");
  if (address) MailApp.sendEmail(address, "GrowitBuddy backup needs attention",
    "A backup failed. Check Apps Script Executions, the production API and backup-key expiry. Do not assume backups are current. No website content or keys are included in this alert.");
}
function gibSetup() {
  var p = gibConfig();
  var root = DriveApp.getFolderById(p.getProperty("GIB_DRIVE_FOLDER_ID"));
  if (root.getSharingAccess() === DriveApp.Access.ANYONE || root.getSharingAccess() === DriveApp.Access.ANYONE_WITH_LINK) {
    throw new Error("Choose a private Drive folder, not a publicly shared folder.");
  }
  p.setProperty("GIB_JSON_FOLDER_ID", gibFolder(root, "cms-json").getId());
  p.setProperty("GIB_MEDIA_FOLDER_ID", gibFolder(root, "media").getId());
  p.setProperty("GIB_TASK_FOLDER_ID", gibFolder(root, "media-manifests").getId());
  // First verify a real export, before installing timers.
  gibDailyBackup();
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (["gibDailyBackup", "gibMediaBackup"].indexOf(t.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("gibDailyBackup").timeBased().everyDays(1).atHour(2).inTimezone("Asia/Kolkata").create();
  ScriptApp.newTrigger("gibMediaBackup").timeBased().everyHours(1).create();
  gibMediaBackup();
}
function gibDailyBackup() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    var p = gibConfig();
    var response = UrlFetchApp.fetch(GIB_API + "/admin/cms/offsite-export", {
      headers: { Authorization: "Bearer " + p.getProperty("GIB_BACKUP_KEY") },
      muteHttpExceptions: true, followRedirects: false, validateHttpsCertificates: true
    });
    if (response.getResponseCode() !== 200) throw new Error("CMS backup export failed. Check API health and key expiry.");
    var text = response.getContentText();
    var doc = JSON.parse(text);
    if (doc.format !== "growitbuddy-cms-backup" || doc.version !== 1 || gibSha(gibCanonical(doc.sections)) !== doc.checksum ||
      !Array.isArray(doc.mediaManifest) || gibSha(gibCanonical(doc.mediaManifest)) !== doc.mediaManifestChecksum) {
      throw new Error("CMS backup checksum or format is invalid.");
    }
    var folder = DriveApp.getFolderById(p.getProperty("GIB_JSON_FOLDER_ID"));
    var name = "growitbuddy-cms-" + Utilities.formatDate(new Date(), "UTC", "yyyyMMdd-HHmmss") + ".json";
    var file = folder.createFile(Utilities.newBlob(text, "application/json", name));
    p.setProperty("GIB_LATEST_JSON_ID", file.getId());
    p.setProperty("GIB_LAST_JSON_SUCCESS", new Date().toISOString());
    // Retain all files. No automatic Drive deletion; archive older copies manually.
  } catch (e) { gibAlert(); throw e; }
  finally { lock.releaseLock(); }
}
function gibMediaBackup() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    var p = gibConfig(), latest = p.getProperty("GIB_LATEST_JSON_ID");
    if (!latest) throw new Error("Run gibDailyBackup first.");
    var taskFile, task;
    var currentId = p.getProperty("GIB_MEDIA_TASK_ID");
    if (currentId) {
      taskFile = DriveApp.getFileById(currentId);
      task = JSON.parse(taskFile.getBlob().getDataAsString());
    }
    if (!task || task.complete) {
      if (p.getProperty("GIB_MEDIA_COMPLETED_JSON_ID") === latest) return;
      var doc = JSON.parse(DriveApp.getFileById(latest).getBlob().getDataAsString());
      if (!Array.isArray(doc.mediaManifest) || gibSha(gibCanonical(doc.mediaManifest)) !== doc.mediaManifestChecksum ||
        gibSha(gibCanonical(doc.sections)) !== doc.checksum) throw new Error("Stored backup or media manifest is invalid.");
      task = { sourceJsonId: latest, cursor: 0, total: doc.mediaManifest.length, media: doc.mediaManifest, copied: [], failed: [], complete: false };
      taskFile = DriveApp.getFolderById(p.getProperty("GIB_TASK_FOLDER_ID"))
        .createFile(Utilities.newBlob(JSON.stringify(task), "application/json", "media-task-" + latest + ".json"));
      p.setProperty("GIB_MEDIA_TASK_ID", taskFile.getId());
    }
    // Do not reset an unfinished task when a newer daily JSON arrives.
    // Large first-time libraries can therefore finish over multiple days.
    var mediaFolder = DriveApp.getFolderById(p.getProperty("GIB_MEDIA_FOLDER_ID"));
    var start = Date.now(), downloaded = 0, scanned = 0, failuresThisRun = false;
    while (task.cursor < task.media.length && downloaded < 20 && scanned < 100 && Date.now() - start < 200000) {
      var m = task.media[task.cursor];
      try {
      if (!Number.isInteger(m.id) || m.id < 1 || !Number.isInteger(m.size) || m.size < 0 || m.size > 45 * 1024 * 1024 ||
        typeof m.backupFilename !== "string" || !/^[a-zA-Z0-9._-]+$/.test(m.backupFilename)) {
        throw new Error("Invalid or oversized media entry. Complete this asset backup manually.");
      }
      var files = mediaFolder.getFilesByName(m.backupFilename);
      var hashes = mediaFolder.getFilesByName(m.backupFilename + ".sha256");
      var existing = files.hasNext() ? files.next() : null;
      var sha;
      if (existing && existing.getSize() === m.size && hashes.hasNext()) {
        sha = hashes.next().getBlob().getDataAsString().trim();
      } else {
        // Public media endpoint: never send a backup key to an image redirect.
        var r = UrlFetchApp.fetch(GIB_API + "/media/file/" + m.id, { muteHttpExceptions: true, followRedirects: true, validateHttpsCertificates: true });
        if (r.getResponseCode() !== 200) throw new Error("Media backup failed for asset " + m.id + ". No successful full media backup is claimed.");
        var blob = r.getBlob(), bytes = blob.getBytes();
        if (bytes.length !== m.size) throw new Error("Media size changed. Export a fresh JSON and retry this asset.");
        sha = gibSha(bytes);
        if (existing) existing.setName(m.backupFilename + ".unverified-" + Date.now());
        while (hashes.hasNext()) hashes.next().setName(m.backupFilename + ".sha256.superseded-" + Date.now());
        mediaFolder.createFile(blob.setName(m.backupFilename));
        mediaFolder.createFile(Utilities.newBlob(sha, "text/plain", m.backupFilename + ".sha256"));
        downloaded++;
      }
      if (!/^[a-f0-9]{64}$/.test(sha)) throw new Error("Invalid asset checksum sidecar.");
      task.copied.push({ id: m.id, filename: m.backupFilename, size: m.size, sha256: sha });
      } catch (assetError) {
        task.failed = task.failed || [];
        task.failed.push({ id: m.id, reason: String(assetError.message || "Asset could not be copied") });
        failuresThisRun = true;
      }
      task.cursor++; scanned++;
    }
    task.complete = task.cursor === task.total;
    task.updatedAt = new Date().toISOString();
    taskFile.setContent(JSON.stringify(task));
    p.setProperty("GIB_MEDIA_PROGRESS", task.copied.length + "/" + task.total);
    p.setProperty("GIB_MEDIA_FAILURES", String((task.failed || []).length));
    if (task.complete && !(task.failed || []).length) {
      p.setProperty("GIB_MEDIA_COMPLETED_JSON_ID", task.sourceJsonId);
      p.setProperty("GIB_LAST_MEDIA_SUCCESS", new Date().toISOString());
    }
    if (failuresThisRun) gibAlert();
  } catch (e) { gibAlert(); throw e; }
  finally { lock.releaseLock(); }
}

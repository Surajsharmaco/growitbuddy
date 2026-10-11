# GrowitBuddy: ब्लॉग बचाने, backup रखने और restore करने की guide

## पहले यह समझें

कोई website 100% data-loss-proof नहीं होती। Database में Save हुआ लेख, browser का unsaved draft, website का source code और image files—चार अलग चीजें हैं। चारों की सुरक्षा अलग चाहिए।

यह safety release पहले development में तैयार और जाँचा जाता है। Live approval, production migration और activation के बिना नए controls को live protection न मानें। 11 अक्टूबर 2026 की जाँच में जुड़े Neon project की recovery history 6 घंटे दिखी थी; इसे लंबी अवधि का backup न मानें। Provider के production target और वर्तमान recovery window की पुष्टि करके ही restore करें।

## नई सुरक्षा कैसे काम करती है

| सुविधा | क्या बचाती है | सीमा |
|---|---|---|
| Per-post Save + conflict check | पुराना टैब दूसरे व्यक्ति का नया लेख overwrite नहीं कर सकता; अलग posts के edits साथ सुरक्षित रह सकते हैं | Conflict पर नया version पढ़ना और अपने edits मिलाना होगा |
| Version history | हर बदलाव से पहले पुराने article का version रखा जाता है | प्रति post 20 पुराने versions; feature शुरू होने से पहले की history नहीं बन सकती |
| Browser draft recovery | Editor में हर 2 सेकंड और page छोड़ते समय unsaved copy रखने की कोशिश | उसी browser/device पर; storage blocked/full हो तो विफल; team drafts उसी login session तक; यह cloud backup नहीं |
| Daily database snapshots | API चलने पर लगभग हर 24 घंटे CMS snapshot; 15-मिनट checks | 30 daily और 60 अन्य snapshots; उसी DB में, DB delete होने पर ये भी जा सकते हैं |
| JSON export | Blogs/pages का पूरा text, SEO fields, status और metadata बाहर रख सकते हैं | इसमें image bytes नहीं होते |
| Content + photos ZIP | Editable content और downloaded media की portable copy | Manifest में skipped/missing files की जाँच जरूरी; external image URLs अपने आप सुरक्षित नहीं होते |
| Safe JSON restore | Missing URLs Draft में वापस; existing URLs skip; पहले checkpoint और checksum check | Images या whole database का one-click restore नहीं |
| Backup-only key | Scheduled export के लिए अलग read-only access | 90 दिन expiry; इसे private रखें, leak हो तो revoke करें |

## रोज़ का काम

1. पहले **Save Draft**, फिर preview, फिर Publish करें। केवल text लिखकर tab बंद न करें।
2. “Saved”/success देखें। Failed Save या conflict को success न समझें।
3. Conflict हो तो **अपना नया text पहले copy/download करें**, फिर current article reload करें। बिना तुलना किए पुराने edits publish न करें।
4. Browser draft recovery की warning आए तो उसे server backup न समझें।
5. Media Library से ऐसी image delete न करें जो articles में लगी है। Delete से पहले backup लें।
6. लंबे समय से खुला admin tab काम शुरू करने से पहले refresh करें।

## Backup की सही व्यवस्था: 3 अलग copies

- **Copy 1:** Production database—काम करने वाला मूल data।
- **Copy 2:** Private Google Drive folder—daily CMS JSON, copied media और checksum manifests।
- **Copy 3:** आपका computer या external drive—हर सप्ताह JSON + Content/photos ZIP की dated copy।

GitHub में website का code होना blogs का backup नहीं। Leads वाला Google Sheets backup भी blog backup नहीं है। Database के अंदर snapshots independent copy नहीं हैं। Drive public sharing बंद रखें; account में 2-step verification रखें। Backup में draft/private pages भी हो सकते हैं।

## Manual backup: अभी सबसे सरल तरीका

नए release के बाद **Admin → Backup / Migration**:

1. **Create & download CMS JSON backup** दबाएँ। File का नाम/date रखें, edit न करें।
2. **Download content + photos ZIP** भी लें।
3. ZIP खोलकर manifest पढ़ें। `skipped`, `missing` या fetch failures हों तो उन assets को अलग download करके रखें।
4. दोनों files private Drive folder और computer में रखें। Latest file के साथ कई पुरानी dated copies भी रखें।
5. बहुत महत्वपूर्ण article बदलने, bulk delete, import, migration या database/account change से पहले एक fresh backup लें।

## Google Drive में automatic backup activate करना

यह अपने आप चालू नहीं होता। एक बार अपने Google account में setup करना होगा।

1. Private Drive folder बनाएँ। Folder URL में अंतिम ID नोट करें।
2. Live admin के Backup / Migration → **Independent Google Drive backup setup** खोलें।
3. **Create backup-only key** करें और privately copy करें। Admin password या सामान्य login token इस्तेमाल न करें।
4. Google Apps Script में नया private project बनाएँ और साथ दी गई `growitbuddy-drive-backup.gs` script paste करें।
5. Project Settings → Script Properties में ये तीन properties रखें:
   - `GIB_BACKUP_KEY`: ऊपर बनाया backup-only key।
   - `GIB_DRIVE_FOLDER_ID`: private folder ID।
   - `GIB_ALERT_EMAIL`: backup failure की सूचना पाने वाला आपका email।
6. API address script में verified production Render API है। इसे Replit preview URL से न बदलें। Hosting बदलने पर destination को verify करके script और key update करें।
7. `gibSetup` manually Run करें और Google permissions review करके approve करें।
8. Drive में `cms-json`, `media`, `media-manifests` folders और पहला valid JSON देखें। Apps Script में daily और hourly triggers देखें।
9. Script Properties में `GIB_LAST_JSON_SUCCESS`, `GIB_MEDIA_PROGRESS`, `GIB_MEDIA_FAILURES` और `GIB_LAST_MEDIA_SUCCESS` देखें। Failure count zero और media progress पूरा होना चाहिए। सिर्फ trigger बनने को backup success न मानें।

JSON रोज़ लगभग 2 बजे IST में backup होगा। Media hourly batches में copy होगी: एक run में अधिकतम 20 नए assets। 500 नए assets की पहली full copy को लगभग 25 या अधिक runs लग सकते हैं। Media progress पूरा होने तक full image backup न मानें। पुराना pending task अगला daily JSON आने पर reset नहीं होता। External article images, जो Media Library में नहीं हैं, अलग download करें।

Script कभी website का content edit/delete नहीं करती। Incomplete Drive copy को नया नाम देकर अलग रखती है; पुरानी files delete नहीं करती। Media failures manifest में दर्ज होते हैं और alert आता है; failure वाली copy को full success नहीं माना जाता। अगली backup cycle में retry होगा। Storage भरने से पहले पुराने copies को external drive में archive करें। प्रति सप्ताह latest JSON date और media progress जाँचें। Key expiry से पहले नया key बनाकर Script Properties बदलें, manual run verify करें, फिर पुराना key revoke करें।

## समस्या आए तो कौन-सा restore करें?

### A. Save करने से पहले browser बंद/refresh हो गया

उसी browser और login में वही article/new-post editor खोलें → **Recover browser draft** → text review करें → **Save Draft**। दूसरे device, cleared browser storage या बदले team session में यह copy मिलना जरूरी नहीं। इसलिए नियमित server Save करें।

### B. गलत edit Save हो गया

Article editor → **Version history** → सही date वाला **Load as draft**। यह पहले सिर्फ editor में आता है, live post तुरंत नहीं बदलता। Review → Save Draft → Preview → Publish।

एक पुराने version को बचाने के बाद भी नए version की copy history में रहती है, retention limit के भीतर।

### C. गलती से Trash में चला गया

Blogs/Pages → Trash → Restore। वापस आया article Draft रखें, फिर review/publish करें। Permanent Delete अभी न करें।

### D. Permanent Delete हो गया

Backup / Migration → **Recover an earlier or permanently deleted article** → collection चुनें → recent revisions load करें → सही article **Restore as draft**।

अगर revision retention से बाहर है, dated JSON backup का safe restore preview इस्तेमाल करें।

### E. कई blogs गायब हैं

1. पहले देखें: filter, Draft/Trash status, API outage या page visibility तो कारण नहीं। Website पर न दिखना हमेशा deletion नहीं होता।
2. मौजूदा data का fresh backup लें।
3. Backup / Migration में अपने पुराने JSON का **Preview restore** खोलें।
4. Missing और existing-skipped counts review करें। Existing articles नहीं बदलेंगे।
5. ठीक लगे तो `RESTORE MISSING POSTS` type करके restore करें।
6. Article Draft में वापस आएगा। Text, SEO, links, images और dates जाँचकर publish करें।

Preview के बाद किसी ने data बदला तो restore conflict देगा। नया preview लें; सुरक्षा bypass न करें।

Blog variants भी अलग collections के रूप में सुरक्षित होते हैं। पुराने backup में किसी deleted variant का data हो तो उसका inactive variant पहले सही source के साथ फिर बनाएँ, या developer से staged restore कराएँ। Tool deleted variant का data चुपचाप main blog में नहीं मिलाएगा।

### F. Image गायब हो गई

JSON text restore से image bytes नहीं लौटते। Drive media folder या Content/photos ZIP में file खोजें। Single image को Media Library में फिर upload करें और article में select करके alt text जाँचें।

कई images/पूरी library restore करनी हो तो developer से manifest के पुराने media IDs → नए URLs mapping के साथ restore कराएँ। केवल files upload कर देना पुराने references अपने आप नहीं जोड़ता।

### G. पूरा database delete/corrupt हो गया

1. Admin writes temporarily रोकें; credentials leak हों तो उन्हें rotate/revoke करें।
2. Database provider में available recovery window देखें। समय UTC/IST स्पष्ट रखें।
3. **सीधे production overwrite न करें।** Recovery को अलग branch/database में करें।
4. वहाँ article count, sample text, drafts/private pages और images जाँचें।
5. Verified clone का backup लें; फिर planned switch/merge करें।
6. Provider window निकल गई हो तो independent JSON + images और database export से नया database बनाएँ। CMS JSON में users/leads/payments नहीं होते; full DB recovery के लिए उनका अलग database backup चाहिए।

Restore से पहले का checkpoint **उसी DB में** रहता है। पूरे DB के नुकसान से वह नहीं बचाएगा। ऐसे मामलों में independent backup जरूरी है।

## Provider और account की checklist

- Neon recovery window बढ़ाने की उपलब्धता/plan/cost जाँचें; कम-से-कम 7 दिन, जरूरत हो तो 30 दिन रखें। अभी 6 घंटे होने पर अगले दिन पता चली गलती recover होना जरूरी नहीं।
- Production branch protection, destructive-action permissions और account 2FA सक्षम करने की समीक्षा करें।
- Render/Vercel/Neon का owner access सुरक्षित रखें; केवल जरूरत वाले team permissions दें।
- Automatic Drive backup key केवल Script Properties में रखें—chat, screenshot, public GitHub या guide में नहीं।
- Billing/storage limits और backup failures के alerts देखें।
- 500 लंबे articles, उनकी versions और full snapshots से database storage तेजी से बढ़ सकता है। Database और Drive की capacity हर महीने जाँचें; plan/retention जरूरत के हिसाब से review करें। Storage-full error पर पहले text copy और independent export लें; बिना verified copy के पुराने backups या images न हटाएँ।
- महीने में एक बार isolated test database/temporary draft पर restore test करें। केवल ZIP download करके recovery proven नहीं होती।

## Release/activation checklist — developer के लिए

1. Verified external production target पर `lib/db/migrations/cms-safety.sql` additive migration लागू करें; पहले existing backup लें।
2. Backend और frontend साथ release करें। पुराना full-collection blog/page Save अब reject होगा।
3. `/admin/cms/backups` में पहला daily snapshot, protected saves, versions और restores verify करें।
4. Restore test में केवल temporary draft/test records इस्तेमाल करें; existing articles untouched रखें।
5. Drive setup activate करें, first JSON और full media copy validate करें।
6. Code, CMS JSON, media archive और full database backup की अलग-अलग coverage दर्ज करें।

**याद रखने वाला नियम:** “Backup बना” तभी मानें जब file दूसरी सुरक्षित जगह पहुँची हो, उसकी completeness जाँची हो और उसे restore करने का तरीका tested हो।

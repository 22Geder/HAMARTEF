// ============================================================
// AMARTEF – Google Apps Script Backend (סנכרון היסטוריית הזמנות)
// ============================================================
// הוראות התקנה:
//   1. כנס ל-script.google.com → "פרויקט חדש"
//   2. מחק את כל הקוד הקיים והדבק את הקוד הזה
//   3. שמור (Ctrl+S)
//   4. בתפריט: "פריסה" → "פריסה חדשה"
//        סוג: "אפליקציית אינטרנט"
//        הפעל בשם  : אני
//        מי יכול לגשת: כולם
//   5. לחץ "פרוס" → אשר הרשאות
//   6. העתק את כתובת ה-URL שמתקבלת
//   7. פתח supplier-order.html והדבק את הכתובת ב-GAS_URL
// ============================================================

const SHEET_NAME = "OrderHistory";
const SS_NAME    = "AMARTEF Orders";

// ── מחזיר את הגיליון, יוצר אותו אם לא קיים ─────────────────
function getSheet() {
  const files = DriveApp.getFilesByName(SS_NAME);
  const ss    = files.hasNext()
    ? SpreadsheetApp.open(files.next())
    : SpreadsheetApp.create(SS_NAME);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  return sheet;
}

// ── GET – מחזיר את כל ההזמנות ──────────────────────────────
function doGet(e) {
  try {
    const sheet = getSheet();

    if (!sheet || sheet.getLastRow() === 0) {
      return respond([]);
    }

    const rows    = sheet.getRange(1, 1, sheet.getLastRow(), 2).getValues();
    const entries = rows
      .map(r => { try { return JSON.parse(r[1]); } catch(err) { return null; } })
      .filter(Boolean);

    return respond(entries);
  } catch(err) {
    return respond([]);
  }
}

// ── POST – שמירה / מחיקה ───────────────────────────────────
function doPost(e) {
  try {
    const data  = JSON.parse(e.postData.contents);
    const sheet = getSheet();

    if (data.action === "save") {
      sheet.appendRow([data.entry.timestamp, JSON.stringify(data.entry)]);

    } else if (data.action === "delete") {
      const lastRow = sheet.getLastRow();
      if (lastRow > 0) {
        const tsCol = sheet.getRange(1, 1, lastRow, 1).getValues();
        for (let i = tsCol.length - 1; i >= 0; i--) {
          if (String(tsCol[i][0]) === String(data.timestamp)) {
            sheet.deleteRow(i + 1);
            break;
          }
        }
      }
    }

    return respond({ ok: true });
  } catch(err) {
    return respond({ ok: false, error: err.toString() });
  }
}

// ── Helper ──────────────────────────────────────────────────
function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

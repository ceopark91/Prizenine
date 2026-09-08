// Google Sheets 확장 프로그램 > Apps Script에 붙여 넣고 웹 앱으로 배포하세요.
function doPost(e) {
  var data = JSON.parse(e.postData.contents || '{}');
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  // A열은 ARRAYFORMULA 제품번호이므로 비워 두고 B~F만 기록합니다.
  var row = ['', data.category || '', data.title || data.productName || '', [data.brand, data.description].filter(Boolean).join(' · '), data.url || '', data.image || ''];
  sheet.appendRow(row);
  return ContentService.createTextOutput(JSON.stringify({ok:true})).setMimeType(ContentService.MimeType.JSON);
}

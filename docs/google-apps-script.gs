// Google Sheets 확장 프로그램 > Apps Script에 붙여 넣고 웹 앱으로 배포하세요.
function doPost(e) {
  var data = JSON.parse(e.postData.contents || '{}');
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var url = data.url || '';
  if (url) {
    var urls = sheet.getRange(2, 5, Math.max(sheet.getLastRow() - 1, 1), 1).getValues().flat();
    if (urls.indexOf(url) !== -1) return ContentService.createTextOutput(JSON.stringify({ok:true, duplicate:true})).setMimeType(ContentService.MimeType.JSON);
  }
  // A열은 ARRAYFORMULA 제품번호이므로 비워 두고 B~F만 기록합니다.
  var title = data.title || data.productName || '';
  var category = data.category || classify_(title + ' ' + (data.description || ''));
  var row = ['', category, title, [data.brand, data.description].filter(Boolean).join(' · '), url, data.image || ''];
  sheet.appendRow(row);
  notify_(title, url, category);
  return ContentService.createTextOutput(JSON.stringify({ok:true})).setMimeType(ContentService.MimeType.JSON);
}

function notify_(title, url, category) {
  var props = PropertiesService.getScriptProperties();
  var email = props.getProperty('NOTIFY_EMAIL');
  var message = '[' + category + '] ' + title + '\n' + url;
  if (email) MailApp.sendEmail(email, 'PrizeNine 상품 등록 완료', message);
  var bot = props.getProperty('TELEGRAM_BOT_TOKEN'), chat = props.getProperty('TELEGRAM_CHAT_ID');
  if (bot && chat) UrlFetchApp.fetch('https://api.telegram.org/bot' + bot + '/sendMessage', {method:'post', contentType:'application/json', payload: JSON.stringify({chat_id:chat, text:message}), muteHttpExceptions:true});
}

function classify_(text) {
  var rules = [['생활',['주방','청소','수납','생활','가습기']], ['테크',['스피커','카메라','충전','이어폰','노트북','키보드']], ['뷰티',['화장품','크림','샴푸','세럼','뷰티']], ['패션',['신발','가방','티셔츠','패션','의류']]];
  for (var i = 0; i < rules.length; i++) for (var j = 0; j < rules[i][1].length; j++) if (text.indexOf(rules[i][1][j]) >= 0) return rules[i][0];
  return '기타';
}

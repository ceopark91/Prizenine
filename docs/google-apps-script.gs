var MAIN_SHEET = '상품목록';
var QUEUE_SHEET = '_queue';

// 최초 1회 실행: 큐 시트와 상품 URL 입력용 Google Form을 자동 생성합니다.
function setupSystem() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var main = ss.getSheetByName(MAIN_SHEET) || ss.getSheets()[0];
  main.setName(MAIN_SHEET);
  var queue = ss.getSheetByName(QUEUE_SHEET) || ss.insertSheet(QUEUE_SHEET);
  if (queue.getLastRow() === 0) queue.appendRow(['job_id','상품URL','상태','접수시각','처리시각','제품번호','오류']);
  var form = FormApp.create('PrizeNine 상품 영상 자동화 접수');
  form.setDescription('쿠팡·테무·알리 등 공개 상품주소를 입력하세요.');
  form.addTextItem().setTitle('상품주소').setRequired(true);
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  ScriptApp.newTrigger('onFormSubmit').forSpreadsheet(ss).onFormSubmit().create();
  PropertiesService.getScriptProperties().setProperty('FORM_URL', form.getPublishedUrl());
  SpreadsheetApp.getUi().alert('Google Form 생성 완료\n' + form.getPublishedUrl());
}

function onFormSubmit(e) {
  var values = e && e.namedValues ? e.namedValues : {};
  var text = Object.keys(values).map(function(k){ return (values[k] || []).join(' '); }).join(' ');
  enqueue_(extractUrl_(text), 'google-form');
}

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'pending';
  if (action === 'form') return json_({ok:true, formUrl:PropertiesService.getScriptProperties().getProperty('FORM_URL') || ''});
  var q = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(QUEUE_SHEET);
  if (!q || q.getLastRow() < 2) return json_({ok:true, jobs:[]});
  var rows = q.getRange(2,1,q.getLastRow()-1,7).getValues();
  var jobs = rows.filter(function(r){return r[2] === 'pending';}).slice(0,10).map(function(r){return {jobId:r[0],url:r[1],status:r[2],receivedAt:r[3]};});
  return json_({ok:true,jobs:jobs});
}

function doPost(e) {
  var data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  if ((data.action || 'enqueue') === 'enqueue') return json_(enqueue_(extractUrl_(data.url || data.text || ''), data.source || 'api'));
  if (data.action === 'complete') return json_(complete_(data));
  if (data.action === 'fail') return json_(updateJob_(data.jobId,'failed','',data.error || 'unknown'));
  return json_({ok:false,error:'unknown action'});
}

function enqueue_(url, source) {
  if (!url) return {ok:false,error:'상품 URL이 없습니다.'};
  var ss=SpreadsheetApp.getActiveSpreadsheet(), q=ss.getSheetByName(QUEUE_SHEET) || ss.insertSheet(QUEUE_SHEET);
  if (q.getLastRow() === 0) q.appendRow(['job_id','상품URL','상태','접수시각','처리시각','제품번호','오류']);
  var existing=q.getLastRow()>1?q.getRange(2,2,q.getLastRow()-1,2).getValues():[];
  if(existing.some(function(r){return r[0]===url && r[1]!=='failed';})) return {ok:true,duplicate:true,url:url};
  var id=Utilities.getUuid(); q.appendRow([id,url,'pending',new Date(),'','','']);
  return {ok:true,status:'pending',jobId:id,url:url,source:source};
}

function complete_(data) {
  var ss=SpreadsheetApp.getActiveSpreadsheet(), main=ss.getSheetByName(MAIN_SHEET) || ss.getSheets()[0];
  var row=['',data.category || '기타',data.productName || data.title || '',[data.brand,data.description].filter(Boolean).join(' · '),data.partnerUrl || data.url || '',data.imageUrl || data.image || ''];
  main.appendRow(row); SpreadsheetApp.flush();
  var number=main.getRange(main.getLastRow(),1).getDisplayValue();
  updateJob_(data.jobId,'done',number,'');
  notify_(number,data.productName || data.title || '',data.partnerUrl || data.url || '');
  return {ok:true,status:'done',productNumber:number};
}

function updateJob_(id,status,number,error){var q=SpreadsheetApp.getActiveSpreadsheet().getSheetByName(QUEUE_SHEET);if(!q)return {ok:false};var ids=q.getRange(2,1,Math.max(q.getLastRow()-1,1),1).getValues();for(var i=0;i<ids.length;i++)if(ids[i][0]===id){q.getRange(i+2,3,1,5).setValues([[status,q.getRange(i+2,4).getValue(),new Date(),number,error]]);return {ok:true,status:status};}return {ok:false,error:'job not found'};}
function extractUrl_(v){var m=String(v||'').match(/https?:\/\/[^\s<>"']+/i);return m?m[0].replace(/[),.]+$/,''):'';}
function json_(v){return ContentService.createTextOutput(JSON.stringify(v)).setMimeType(ContentService.MimeType.JSON);}
function notify_(number,title,url){var p=PropertiesService.getScriptProperties(),email=p.getProperty('NOTIFY_EMAIL');if(email)MailApp.sendEmail(email,'PrizeNine '+number+'번 등록 완료',title+'\n'+url);}

// Google Apps Script web apps commonly redirect POST requests once.
// Re-send the JSON body to the redirected googleusercontent URL so the body
// is not lost (a normal 302-follow can turn it into an empty GET/POST).
async function postAppsScript(url, payload) {
  const body = JSON.stringify(payload);
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'content-length': String(Buffer.byteLength(body)),
  };
  let response = await fetch(url, { method: 'POST', headers, body, redirect: 'manual' });
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get('location');
    if (!location) return response;
    response = await fetch(location, { method: 'POST', headers, body });
  }
  return response;
}

module.exports = { postAppsScript };

let google = require('googleapis');

function getData(auth, callback) {
    let sheets = google.sheets('v4');
    sheets.spreadsheets.values.get({
        auth: auth,
        spreadsheetId: '1Subwzl-V9yYigYxqzaJOfBAA6b6XxFzp39odYJth7xs',
        range: 'Sheet1!A2:Z11',
    }, (err, response) => {
        if (err) {
            console.log('The API returned an error: ' + err);
            return;
        }
        let rows = response.values;
        if (rows.length === 0) {
            callback('No data found.');
        } else {
            callback(rows);
        }
    });
}

module.exports = getData;
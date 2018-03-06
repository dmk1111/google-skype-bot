// TODO: Handle communication with user in chat & update document accordingly

var google = require('googleapis');
var key = require('./JWT.json');
var sheets = google.sheets("v4").spreadsheets;

// links from https://developers.google.com/sheets/api/guides/authorizing
var jwtClient = new google.auth.JWT(
    key.client_email,
    null,
    key.private_key,
    ['https://www.googleapis.com/auth/spreadsheets'], // an array of auth scopes
    null
);

function getData(callback) {

    // implemented according to guideline: http://google.github.io/google-api-nodejs-client/22.2.0/index.html#toc15__anchor
    jwtClient.authorize(function (err, tokens) {
        if (err) {
            console.log(err);
            throw new Error("AUTH ISSUE WITH GOOGLE");
            return;
        }

        // Make an authorized request

        sheets.values.get({
            auth: jwtClient,
            spreadsheetId: '1Subwzl-V9yYigYxqzaJOfBAA6b6XxFzp39odYJth7xs',
            range: 'Sheet1!A2:Z11',
        }, function(err, response) {
            if (err) {
                console.log('The API returned an error: ' + err);
                return;
            }
            var rows = response.values;
            if (rows.length === 0) {
                callback('No data found.');
            } else {
                callback(rows);
            }
        });
    });

}

module.exports = getData;
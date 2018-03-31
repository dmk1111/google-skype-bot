const google = require('googleapis');
const key = require('./JWT.json');
const sheets = google.sheets("v4").spreadsheets;

// links from https://developers.google.com/sheets/api/guides/authorizing
let jwtClient = new google.auth.JWT(
    key.client_email,
    null,
    key.private_key,
    ['https://www.googleapis.com/auth/spreadsheets'], // an array of auth scopes
    null
);

let oldRows = [];
let nextPeople = [];

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
            spreadsheetId: 'your spreadsheet id from url here',
            range: 'Sheet1!A2:B11',
        }, function(err, response) {
            if (err) {
                console.log('The API returned an error: ' + err);
                return;
            }
            let rows = response.values;
            if (rows.length === 0) {
                callback('No data found.');
            } else {
                oldRows = rows;
                nextPeople = callback(rows);
            }
        });
    });

}

function updateSpreadSheet(id) {
    let newValues = oldRows.map(function (row, index) {
        if (id === index) {
            row[1] = +row[1] + 1 + '';
        }
        return row;
    });

    // skip user on vacation
    if (id === undefined) {
        newValues = oldRows.map(function (row) {
            if (row[0] === nextPeople[0]) {
                row[1] = +row[1] + 1 + '';
            }
            return row;
        });
    }
    jwtClient.authorize(function (err, tokens) {
        if (err) {
            console.log(err);
            throw new Error("AUTH ISSUE WITH GOOGLE");
            return;
        }
        sheets.values.update({
            auth: jwtClient,
            spreadsheetId: 'spreadsheet id to update',
            range: 'Sheet1!A2:B11',
            valueInputOption: "USER_ENTERED",
            resource: {
                values: newValues
            }
        }, (err, response) => {
            if (err) {
                console.log('The API returned an error: ' + err);
                return;
            } else {
                console.log("Updated");
            }
        });
        console.log(newValues);
    })
}

module.exports.getData = getData;
module.exports.updateSpreadSheet = updateSpreadSheet;
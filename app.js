// TODO: check who's next
// TODO: post next person in Skype chat at specific time using 'node-schedule'

let authentication = require("./spreadsheets/authentication");
let getData = require("./spreadsheets/getData");


authentication.authenticate().then((auth)=>{
    getData(auth, doSomethingWithData);
});


function doSomethingWithData(rows) {
    console.log(rows);
}
// TODO: Register bot on Azure & check it in Skype; works fine in botframework-emulator
const schedule = require('node-schedule');

let authentication = require("./spreadsheets/authentication");
let getData = require("./spreadsheets/getData");
let startSkypeBot = require("./skype/bot").startSkypeBot;
let updateSkypeBot = require("./skype/bot").updateSkypeBot;

let userNames = [];
let botStarted = false;

function getDataPostToChat(callback) {
    authentication.authenticate().then((auth) => {
        getData(auth, callback);
    });
}

function getNextInQueue(rows) {
    let filteredNames = [];
    let rowLengths = rows.map( row => row.length);
    let nextPeople = rows.filter( row => row.length === Math.min.apply(null, rowLengths));
    if (nextPeople.length >= 2) {
        filteredNames = [nextPeople[0][0], nextPeople[1][0]];
    } else if (nextPeople.length === 1) {
        filteredNames = [nextPeople[0][0], rows[0][0]];
    } else {
        filteredNames = [rows[0][0], rows[1][0]];
    }
    let newMessage = `${filteredNames[0]} leading today on standup. \n${filteredNames[1]} next in queue.`;
    if (botStarted && userNames[0] !== filteredNames[0]) {
        updateSkypeBot(newMessage);
    } else if (!botStarted && userNames[0] !== filteredNames[0]){
        startSkypeBot(newMessage);
        botStarted = true;
    }
    userNames = filteredNames;
}


// getDataPostToChat(getNextInQueue);
// setInterval(() => getDataPostToChat(getNextInQueue), 15000);

var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [new schedule.Range(1, 5)];
rule.hour = 10;
rule.minute = 20;

var j = schedule.scheduleJob(rule, function(){
    getDataPostToChat(getNextInQueue);
});
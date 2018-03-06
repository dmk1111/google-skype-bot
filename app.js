// TODO: Register bot on Azure & check it in Skype; works fine in botframework-emulator
const schedule = require('node-schedule');

// var authentication = require("./spreadsheets/authentication");
var getData = require("./spreadsheets/getData");
var startSkypeBot = require("./skype/bot").startSkypeBot;
var updateSkypeBot = require("./skype/bot").updateSkypeBot;

var userNames = [];
var botStarted = false;
console.log("BOT STARTED");

function getNextInQueue(rows) {
    var filteredNames = [];
    var newMessage = "";
    if (typeof rows === "string") {
        newMessage = "No data available";
    } else {
        var rowLengths = rows.map(function (row) {return row.length;});
        var nextPeople = rows.filter(function (row) {return row.length === Math.min.apply(null, rowLengths);});
        if (nextPeople.length >= 2) {
            filteredNames = [nextPeople[0][0], nextPeople[1][0]];
        } else if (nextPeople.length === 1) {
            filteredNames = [nextPeople[0][0], rows[0][0]];
        } else {
            filteredNames = [rows[0][0], rows[1][0]];
        }
        newMessage = filteredNames[0] + " leading today on standup. \n " + filteredNames[1] + " next in queue.";
    }
    if (botStarted && userNames[0] !== filteredNames[0]) {
        updateSkypeBot(newMessage);
    } else if (!botStarted && userNames[0] !== filteredNames[0]){
        startSkypeBot(newMessage);
        botStarted = true;
    }
    userNames = filteredNames;
}

var rule = new schedule.RecurrenceRule();
rule.dayOfWeek = [new schedule.Range(1, 5)];
rule.hour = 10;
rule.minute = 20;


// trigger once to check how it works
getData(getNextInQueue);

var j = schedule.scheduleJob(rule, function(){
    getData(getNextInQueue);
});

// startSkypeBot("test");
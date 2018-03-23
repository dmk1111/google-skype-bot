const ontime = require("ontime");

let getData = require("./spreadsheets/googleDataManage").getData;
let startSkypeBot = require("./skype/bot").startSkypeBot;
let updateSkypeBot = require("./skype/bot").updateSkypeBot;
let skipUsers = require("./skype/bot").skipUsers;

let userNames = [];
let botStarted = false;
let prevRows = [];
console.log("BOT STARTED");



function skipOneUser() {
    let index;
    let meetingsPassed = prevRows.map(function (row) {return +row[1];});
    let updatedRows = prevRows.map( function (row, id) {
        if (+row[1] === Math.min.apply(null, meetingsPassed) && index === undefined) {
            row[1] = +row[1] + 1 + '';
            index = id;
        }
        console.log(row);
        return row;
    });
    getNextInQueue(updatedRows);
}

function getNextInQueue(rows) {
    let filteredNames = [];
    let newMessage = "";
    if (typeof rows === "string") {
        newMessage = "No data available";
    } else {
        prevRows = rows;
        let meetingsPassed = rows.map(function (row) {return +row[1];});
        let nextPeople = rows.filter(function (row) {return +row[1] === Math.min.apply(null, meetingsPassed);});
        let peopleFromStart = rows.filter(
            function (row) {return +row[1] === Math.min.apply(null, meetingsPassed) + 1;});
        if (nextPeople.length >= 2) {
            filteredNames = [nextPeople[0][0], nextPeople[1][0]];
        } else if (nextPeople.length === 1) {
            filteredNames = [nextPeople[0][0], peopleFromStart[0][0]];
        } else {
            filteredNames = [peopleFromStart[0][0], peopleFromStart[1][0]];
        }
        newMessage = `*${filteredNames[0]}* leads today's standup. *${filteredNames[1]}* next in the queue.`;
    }
    if (botStarted /*&& userNames[0] !== filteredNames[0] && userNames[1] !== filteredNames[1]*/) {
        // updateSkypeBot(newMessage);
        updateSkypeBot(newMessage);
    } else if (!botStarted /*&& userNames[0] !== filteredNames[0] && userNames[1] !== filteredNames[1]*/){
        startSkypeBot(newMessage, function() {getData(getNextInQueue);});
        botStarted = true;
    }
    userNames = filteredNames;
    return filteredNames;
}

// trigger once to check how it works

getData(getNextInQueue);
skipUsers(skipOneUser);

// 8am hour server time is 10am in Ukraine

ontime({
    cycle: [
        "8:25:00"
    ],
    utc: true,
    single: true
}, (ot) => {
    console.log("triggered");
    getData(getNextInQueue);
    ot.done();
    return;
});
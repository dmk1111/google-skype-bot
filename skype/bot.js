const ontime = require("ontime");
let restify = require("restify");
let builder = require("botbuilder");
let botbuilder_azure = require("botbuilder-azure");
let updateSpreadSheet = require("../spreadsheets/googleDataManage").updateSpreadSheet;
let getRandomCat = require("../thecatapi/cats").getRandomCat;
var getPulls = require("../vsts/visualStudioServices").getPRs;

let userList = [
    // last names of users that will be used in RegExp
    "Pond",
    "Smith",
    "Rogers",
    "Song",
    "Page",
    "Rickman",
    "Smisen",
    "Brown",
    "Black"
];

let skipCallback;
let savedAddress = undefined;
let botAddresses = undefined;
let updateCallback;

//=========================================================
// Bot Setup
//=========================================================
// Setup Restify Server
let server = restify.createServer();
server.use(
    function crossOrigin(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        return next();
    }
);
let connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    openIdMetadata: process.env.BotOpenIdMetadata
});

let tableName = "botdata";
let storageName = "storage name from Azure";
let storageKey = "your key from Azure";
let azureTableClient = new botbuilder_azure.AzureTableClient(tableName, storageName, storageKey);
let tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);

let bot = new builder.UniversalBot(connector);
bot.set("storage", tableStorage);

server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log("%s listening to %s", server.name, server.url);
});
server.post("/api/messages", connector.listen());

//Bot on
bot.on("contactRelationUpdate", function (message) {
    if (message.action === "add") {
        let name = message.user ? message.user.name : null;
        let reply = new builder.Message()
            .address(message.address)
            .text("Hello %s... Thanks for adding me.", name || "there");
        bot.send(reply);
    } else {
        // devare their data
    }
});
bot.on("typing", function (message) {
    // User is typing
});
bot.on("devareUserData", function (message) {
    // User asked to devare their data
});

// Set up dialogs

bot.dialog("askForPresenter", askForPresenterFn, true);

bot.dialog("presenterSelected", presenterSelectedFn, true).triggerAction({ matches: /(confirmed)\s.*responsible*/i });

bot.dialog("skipOneUser", skipOneUserFn, true);

bot.dialog("userOnVacation", userOnVacationFn, true);

bot.dialog("getPullRequests", getPullRequestsFn, true);

bot.dialog("getRandomCat", getRandomCatFn, true);

function startSkypeBot(messageWithUserNames, callback) {
    botAddresses = [];
    updateCallback = callback;
    var commandRegEx = new RegExp("(\\/)([^ ]*)", "i"); // "/(\/)([^ ]*)/"

//=========================================================
// Bots Dialogs
//=========================================================

    var usersMessageSent = false;
    bot.dialog("/", mainDialog, true);

    bot.on("conversationUpdate", function (message) {
        bot.beginDialog(message.address, "/");
    });

    function mainDialog(session, args) {
        if (botAddresses.length === 0 || botAddresses.length > 0 && botAddresses.filter(
                addr => addr.conversation.id === session.message.address.conversation.id).length === 0) {
            botAddresses.push(session.message.address);
        }
        if (!usersMessageSent) {
            savedAddress = session.message.address;
            session.userData.savedAddress = savedAddress;
            var reply = new builder.Message()
                .address(session.message.address)
                .text(messageWithUserNames);
            session.send(reply);
            usersMessageSent = true;
        }
        if (session.message.text) {
            if (session.message.text.toLowerCase().indexOf("ping") !== -1) {
                session.send("Ping-Pong :)");
                session.send(session.message.timestamp);
                session.send(JSON.stringify(session.message.address));
                session.send(JSON.stringify(botAddresses));
            } else if (session.message.text.toLowerCase().indexOf("hello") !== -1) {
                var name = session.message.user ? session.message.user.name : null;
                var reply = new builder.Message()
                    .address(session.message.address)
                    .text("Hello %s ", name || "there");
                session.send(reply);
            } else if (session.message.text.toLowerCase().match(commandRegEx)) {
                let command = session.message.text.toLowerCase().match(commandRegEx)[0];
                switch (command) {
                    case "/complete":
                        session.beginDialog("askForPresenter");
                        break;
                    case "/vac":
                        session.beginDialog("userOnVacation");
                        break;
                    case "/skip":
                        session.beginDialog("skipOneUser");
                        break;
                    case "/getcat":
                        session.beginDialog("getRandomCat");
                        break;
                    case "/getpr":
                        session.beginDialog("getPullRequests");
                        break;
                    case "/status":
                        updateCallback();
                        break;
                    case "/help":
                        getHelpMessage(session);
                        break;
                    default:
                        return;
                }
            }
        } else {
            return;
        }
    }
}

function updateSkypeBot(newMessage, callback) {
    updateCallback = callback;
    botAddresses.forEach( address => startProactiveDialog(address, newMessage));
}

function startProactiveDialog(address, message) {
    var msg = new builder.Message().address(address);
    msg.text(message);
    msg.textLocale("en-US");
    bot.send(msg);
}
function skipUsers(callback) {
    skipCallback = callback;
}
function askForPresenterFn(session) {
    var msg = new builder.Message(session);
    msg.attachments([
        new builder.HeroCard(session)
            .title("Meeting finished")
            .subtitle("The person, who conducted meeting today should select option from the list.")
            .text("Click on the item below:")
            .images([builder.CardImage.create(session,
                "http://www.yourindustrynews.com/upload_images/Schlumberger-logo1_1.jpg")])
            .buttons([
                builder.CardAction.imBack(session,
                    "confirmed Peter Parker responsible for Meeting Follow Up email",
                    "Peter Parker"),
                builder.CardAction.imBack(session, "confirmed Amy Pond responsible for Meeting Follow Up email",
                    "Amy Pond"),
                builder.CardAction.imBack(session, "confirmed Matt Smith responsible for Meeting Follow Up email",
                    "Matt Smith"),
                builder.CardAction.imBack(session, "confirmed Steve Rogers responsible for Meeting Follow Up email",
                    "Steve Rogers"),
                builder.CardAction.imBack(session,
                    "confirmed River Song responsible for Meeting Follow Up email",
                    "River Song"),
                builder.CardAction.imBack(session, "confirmed Jimmy Page responsible for Meeting Follow Up email",
                    "Jimmy Page"),
                builder.CardAction.imBack(session, "confirmed Alan Rickman responsible for Meeting Follow Up email",
                    "Alan Rickman"),
                builder.CardAction.imBack(session, "confirmed Aaron Smisen responsible for Meeting Follow Up email",
                    "Aaron Smisen"),
                builder.CardAction.imBack(session, "confirmed Dan Brown responsible for Meeting Follow Up email",
                    "Dan Brown"),
                builder.CardAction.imBack(session,
                    "confirmed Rebecca Black responsible for Meeting Follow Up email",
                    "Rebecca Black"),
            ]),
    ]);
    session.send(msg).endDialog();
}
function presenterSelectedFn(session, args, next) {
    // Get username from users utterance
    var utterance = args.intent.matched[0];
    var username = utterance.split(" ")[2];
    var userNameIndex = userList.indexOf(username);
    if (userNameIndex !== -1) {
        updateSpreadSheet(userNameIndex);
    } else {
        // Invalid user
        session.send("Wrong person selected, try again").endDialog();
    }
}
function skipOneUserFn(session, args, next) {
    skipCallback();
    session.endDialog();
}
function userOnVacationFn(session, args, next) {
    updateSpreadSheet(undefined);
    session.endDialog();
}
function getPullRequestsFn(session, args, next) {
    session.sendTyping();
    getPulls(prs => {
        if (prs.length !== 0) {
            session.send("Please, have a look at following PRs:");
            prs.forEach(item => {
                session.send(`${item.name} ${item.url}`);
            });
        } else {
            session.send("No active PRs found");
        }
        session.endDialog();
    })
}
function getRandomCatFn(session, args, next) {
    session.send("Searching for a funny cat (poolparty)");
    session.sendTyping();
    getRandomCat((type, catLink) => {
        var msg = new builder.Message(session)
            .address(session.message.address)
            .text(catLink);

        session.send(msg);
        setTimeout( () => {
            session.endDialog();
        }, 100)
    });
}

function getHelpMessage(session) {
    var availableCommands = "Hi, here is a list of available commands:  \n";
    availableCommands
        += "'/complete' - complete morning meeting and select presenter to update spreadsheet  \n";
    availableCommands += "'/vac' - mark responsible person (first one in '/status' result) as on vacation  \n";
    availableCommands += "'/skip' - skip current person and get message with new presenter  \n";
    availableCommands += "'/getpr' - get list of PRs assigned to Framework - Front-end  \n";
    availableCommands += "'/getcat' - get random cat picture ;)  \n";
    availableCommands += "'/status' - get message with people responsible for next meeting";
    var reply = new builder.Message()
        .address(session.message.address)
        .text(availableCommands);
    session.send(reply);
}

function notifyAboutMeetingEnd() {
    var newMessage = "Hey, presenter! Don't forget to run '/complete' command.  \n";
    newMessage += "I suppose you don't want to present tomorrow again, do you?";
    botAddresses.forEach( address => startProactiveDialog(address, newMessage));
}

ontime({
    cycle: [
        "8:55:00"
    ],
    utc: true,
    single: true
}, (ot) => {
    let day = new Date().getDay();
    if (day === 0 || day === 6) {
        ot.done();
        return;
    }
    notifyAboutMeetingEnd();
    ot.done();
    return;
});

module.exports.startSkypeBot = startSkypeBot;
module.exports.updateSkypeBot = updateSkypeBot;
module.exports.skipUsers = skipUsers;
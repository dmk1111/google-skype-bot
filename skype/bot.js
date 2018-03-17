let restify = require("restify");
let builder = require("botbuilder");
let botbuilder_azure = require("botbuilder-azure");
let updateSpreadSheet = require("../spreadsheets/googleDataManage").updateSpreadSheet;
let getRandomCat = require("../thecatapi/cats").getRandomCat;

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

let savedAddress = undefined;

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

bot.dialog("askForPresenter", function (session) {
    let msg = new builder.Message(session);
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
});

bot.dialog("presenterSelected", function (session, args, next) {
    // Get username from users utterance
    let utterance = args.intent.matched[0];
    let usersCheck = new RegExp(userList.join("|"), "i");
    let userName = usersCheck.exec(utterance);
    if (userName) {
        let userID = userList.indexOf(userName[0]);
        updateSpreadSheet(userID);
    } else {
        // Invalid user
        session.send("Wrong person selected, try again").endDialog();
    }
}).triggerAction({ matches: /(confirmed)\s.*responsible*/i });

function skipUsers(callback) {
    skipCallback = callback;
}

bot.dialog("skipOneUser", function (session, args, next) {
    skipCallback();
    session.endDialog();
}, true);

bot.dialog("userOnVacation", function (session, args, next) {
    updateSpreadSheet(undefined);
    session.endDialog();
}, true);

bot.dialog("getRandomCat", function (session, args, next) {
    session.send("Searching for a funny cat (poolparty)");
    session.sendTyping();
    getRandomCat((type, catLink) => {
        let msg = new builder.Message(session)
            .address(session.message.address)
            .text(catLink);

        session.send(msg);
        setTimeout(() => {
            session.endDialog();
        }, 100);
    });
}, true);

function startSkypeBot(messageWithUserNames, callback) {

//=========================================================
// Bots Dialogs
//=========================================================

    let usersMessageSent = false;
    bot.dialog("/", function (session, args) {
        if (!usersMessageSent) {
            savedAddress = session.message.address;
            session.userData.savedAddress = savedAddress;
            let reply = new builder.Message()
                .address(session.message.address)
                .text(messageWithUserNames);
            session.send(reply);
            usersMessageSent = true;
        }
        if (session.message.text) {
            if (session.message.text.toLowerCase().indexOf("ping") !== -1) {
                session.send("Ping-Pong :)");
                session.send(session.message.timestamp);
            } else if (session.message.text.toLowerCase().indexOf("hello") !== -1) {
                let name = session.message.user ? session.message.user.name : null;
                let reply = new builder.Message()
                    .address(session.message.address)
                    .text("Hello %s ", name || "there");
                session.send(reply);
            } else if (session.message.text.indexOf("/complete") !== -1) {
                session.beginDialog("askForPresenter");
            } else if (session.message.text.indexOf("/vac") !== -1) {
                session.beginDialog("userOnVacation");
            } else if (session.message.text.indexOf("/skip") !== -1) {
                session.beginDialog("skipOneUser");
            } else if (session.message.text.toLowerCase().indexOf("/getcat") !== -1) {
                session.beginDialog("getRandomCat");
            } else if (session.message.text.indexOf("/status") !== -1) {
                callback();
            } else if (session.message.text.indexOf("/help") !== -1) {
                let availableCommands = "Hi, here is a list of available commands:  \n";
                availableCommands
                    += "'/complete' - complete morning meeting and select presenter to update spreadsheet  \n";
                availableCommands
                    += "'/vac' - mark responsible person (first one in '/status' result) as on vacation  \n";
                availableCommands += "'/skip' - skip current person and get message with new presenter  \n";
                availableCommands += "'/getcat' - get random cat picture ;)  \n";
                availableCommands += "'/status' - get message with people responsible for next meeting";
                let reply = new builder.Message()
                    .address(session.message.address)
                    .text(availableCommands);
                session.send(reply);
            }
        } else {
            return;
        }
    }, true);

    bot.on("conversationUpdate", function (message) {
        bot.beginDialog(message.address, "/");
    });
}

function updateSkypeBot(newMessage) {
    startProactiveDialog(savedAddress, newMessage);
}

function startProactiveDialog(address, message) {
    let msg = new builder.Message().address(address);
    msg.text(message);
    msg.textLocale("en-US");
    bot.send(msg);
}

module.exports.startSkypeBot = startSkypeBot;
module.exports.updateSkypeBot = updateSkypeBot;
module.exports.skipUsers = skipUsers;
var restify = require('restify');
var builder = require('botbuilder');
var botbuilder_azure = require("botbuilder-azure");
//=========================================================
// Bot Setup
//=========================================================
// Setup Restify Server
console.log("============== TEST =================");
var server = restify.createServer();
server.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    // res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    // res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    // // Set to true to include cookies in the requests sent
    // // to the API (e.g. in case of sessions)
    // res.setHeader('Access-Control-Allow-Credentials', true);
    // res.setHeader('Connection', 'keep-alive');

    next();
});
// Create chat bot
var connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
    openIdMetadata: process.env.BotOpenIdMetadata
});

var tableName = 'botdata';
var azureTableClient = new botbuilder_azure.AzureTableClient(tableName, process.env['AzureWebJobsStorage']);
var tableStorage = new botbuilder_azure.AzureBotStorage({ gzipData: false }, azureTableClient);
// var inMemoryStorage = new builder.MemoryBotStorage();

var bot = new builder.UniversalBot(connector);
bot.set('storage', tableStorage);
// bot.set('storage', inMemoryStorage);

var savedAddress = undefined;

server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});
server.post('/api/messages', connector.listen());

function startSkypeBot(messageWithUserNames) {
//Bot on
    bot.on('contactRelationUpdate', function (message) {
        if (message.action === 'add') {
            var name = message.user ? message.user.name : null;
            var reply = new builder.Message()
                .address(message.address)
                .text("Hello %s... Thanks for adding me.", name || 'there');
            bot.send(reply);
        } else {
            // devare their data
        }
    });
    bot.on('typing', function (message) {
        // User is typing
    });
    bot.on('devareUserData', function (message) {
        // User asked to devare their data
    });
//=========================================================
// Bots Dialogs
//=========================================================

    var usersMessageSent = false;
    var newMessage = messageWithUserNames;
    bot.dialog('/', function (session, args) {
        if (!usersMessageSent) {
            savedAddress = session.message.address;
            session.userData.savedAddress = savedAddress;
            session.send(newMessage);
            // session.endDialog();
            usersMessageSent = true;
            // server.destroy(callback());
        } else if (session.message.toLowerCase().indexOf("ping") !== -1) {
            session.send("Ping-Pong :)");
        } else {
            return;
        }
    }, true);

    bot.on('conversationUpdate', function (message) {
        bot.beginDialog(message.address, '/');
    });
}

function updateSkypeBot(newMessage) {
    startProactiveDialog(savedAddress, newMessage);
}

function startProactiveDialog(address, message) {
    var msg = new builder.Message().address(address);
    msg.text(message);
    msg.textLocale('en-US');
    bot.send(msg);
}

module.exports.startSkypeBot = startSkypeBot;
module.exports.updateSkypeBot = updateSkypeBot;

// function startBotTest(messageWithUserNames) {
//     server.listen(3978, function () {
//         console.log('%s listening to %s', server.name, server.url);
//     });
//     server.post('/api/messages', connector.listen());
//     bot.dialog('/', function (session, args) {
//         session.send(messageWithUserNames);
//     }, true);
// }
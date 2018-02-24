let restify = require('restify');
let builder = require('botbuilder');
//=========================================================
// Bot Setup
//=========================================================
// Setup Restify Server
let server = restify.createServer();
// Create chat bot
let connector = new builder.ChatConnector({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword
});
let inMemoryStorage = new builder.MemoryBotStorage();
let bot = new builder.UniversalBot(connector).set('storage', inMemoryStorage);
let savedAddress = undefined;

function startSkypeBot(messageWithUserNames) {
    server.listen(process.env.port || process.env.PORT || 3978, function () {
        console.log('%s listening to %s', server.name, server.url);
    });
    server.post('/api/messages', connector.listen());
//Bot on
    bot.on('contactRelationUpdate', function (message) {
        if (message.action === 'add') {
            let name = message.user ? message.user.name : null;
            let reply = new builder.Message()
                .address(message.address)
                .text("Hello %s... Thanks for adding me.", name || 'there');
            bot.send(reply);
        } else {
            // delete their data
        }
    });
    bot.on('typing', function (message) {
        // User is typing
    });
    bot.on('deleteUserData', function (message) {
        // User asked to delete their data
    });
//=========================================================
// Bots Dialogs
//=========================================================

    let usersMessageSent = false;
    let newMessage = messageWithUserNames;
    bot.dialog('/', function (session, args) {
        if (!usersMessageSent) {
            savedAddress = session.message.address;
            session.userData.savedAddress = savedAddress;
            session.send(newMessage);
            // session.endDialog();
            usersMessageSent = true;
            // server.destroy(callback());
        }
    }, true);

    bot.on('conversationUpdate', function (message) {
        if (usersMessageSent) {
            return;
        } else {
            bot.beginDialog(message.address, '/');
        }
    });
}

function updateSkypeBot(newMessage) {
    startProactiveDialog(savedAddress, newMessage);
}

function startProactiveDialog(address, message) {
    let msg = new builder.Message().address(address);
    msg.text(message);
    msg.textLocale('en-US');
    bot.send(msg);
}

module.exports.startSkypeBot = startSkypeBot;
module.exports.updateSkypeBot = updateSkypeBot;
var request = require('request');

var user = 'UserName'; // Your VSTS username
var pass = 'token'; // your VSTS token

var auth = new Buffer(user + ':' + pass).toString('base64');
var space = "myvsts";
var project = "Proj1";

var options = {
    url: `https://${space}.visualstudio.com/${project}/_apis/git/pullRequests?api-version=3.0-preview`,
    headers: {
        'Authorization': 'Basic ' + auth
    }
};

function onGetPR(error, response, body, cb) {
    if (!error && response.statusCode == 200) {
        var info = [];
        JSON.parse(body).value.forEach( pr => {
            if (pr.reviewers.some(r => r.displayName.indexOf("Framework - Front-end") !== -1)) {
                let prUrl = `https://${space}.visualstudio.com/${project}/_git/${pr.repository.name}/pullrequest/${pr.pullRequestId}`;
                info.push({"name": pr.repository.name, "url": prUrl});
            }
        } );
        cb(info);
    }
}

function getPRs(callback) {
    request(options, (error, response, body) => onGetPR(error, response, body, callback));
}

module.exports = {
    getPRs: getPRs
};
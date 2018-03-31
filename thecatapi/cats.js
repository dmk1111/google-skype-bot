const request = require('request');
const parseString = require('xml2js').parseString;
const APIKey = "Your api from thecataip.com";
const randomCatLink = `http://thecatapi.com/api/images/get?api_key=${APIKey}&format=xml`;


function getRandomCat(callback) {
    request.get(randomCatLink, (err, res, body) => {
        if (err) { return console.log(err); }
        parseString(body, function (error, result) {
            let link = result.response.data[0].images[0].image[0].url[0];
            // let type = getExtension(link) === "jpg" ? "jpeg" : "png";
            callback(/*type*/ undefined, link);
        });
    })
}

function getExtension(filename) {
    let i = filename.lastIndexOf('.');
    return (i < 0) ? '' : filename.substr(i+1);
}

module.exports = {
    getRandomCat: getRandomCat
};
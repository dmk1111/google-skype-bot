const request = require('request');
const randomCatLink = "https://dog.ceo/api/breeds/image/random";


function getRandomDog(callback) {
    request.get(randomCatLink, (err, res, body) => {
        if (err) { return console.log(err); }
            let link = JSON.parse(body).message;
            callback(link);
    })
}

module.exports = {
    getRandomDog: getRandomDog
};
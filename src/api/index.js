const express = require('express');
const path = require('path');

const app = express();

const PORT = 8080;

const DISCORD_API_ID = '429699697372823563';
const DISCORD_API_SECRET = 'beGT1NgWB8ry4oJk5V6kum4-Z4Ag829z';
const REDIRECT_URI = encodeURIComponent('http://localhost:8080/callback');
const SCOPE = encodeURIComponent('identify connections');

app.get('/', (req, res) => {
    res.status(200).sendFile(path.join(__dirname, '../index.html'));
});

app.get('/login', (req, res) => {
    res.redirect(`https://discordapp.com/oauth2/authorize?client_id=${DISCORD_API_ID}&scope=${SCOPE}&response_type=code&redirect_uri=${REDIRECT_URI}`);
});

app.get('/callback', (req, res) => {
    console.log(req);
});

app.listen(PORT, () => {
    console.log(`Express server listening on port ${PORT}`);
});
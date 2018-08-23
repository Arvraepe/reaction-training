const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const bodyparser = require('body-parser');
const ci = require('correcting-interval');

app.use(bodyparser.json());
app.use('/app', express.static('html'));

io.on('connection', function(socket){

    console.log("app connected");

    socket.on('disconnect', function (){
        console.log("app disconnected");
    });

});

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

let currentIntervalId = null;

app.post('/start', (req, res) => {

    if (currentIntervalId){
        ci.clearCorrectingInterval(currentIntervalId);
        currentIntervalId = null;
    }

    let currentIntActive = null;

    currentIntervalId = ci.setCorrectingInterval(function() {

        io.emit('change', { color: 'black' });


        let newRandomInt = null;

        do {
            newRandomInt = getRandomInt(0, Object.keys(io.sockets.connected).length);
        } while (newRandomInt === currentIntActive && req.body.different);

        setTimeout(() => {
            io.sockets.connected[Object.keys(io.sockets.connected)[newRandomInt]].emit('change', { color: 'red' });
            currentIntActive = newRandomInt;
        }, req.body.pause);


    }, req.body.interval + req.body.pause);

    res.send({ process: currentIntervalId });

});

app.post('/stop', (req, res) => {

    const intervalIdBuffer = currentIntervalId;

    ci.clearCorrectingInterval(currentIntervalId);
    currentIntervalId = null;

    io.emit('change', { color: 'black' });

    res.send({ stopped: intervalIdBuffer });
});

http.listen(3000, () => console.log('Example app listening on port 3000!'));
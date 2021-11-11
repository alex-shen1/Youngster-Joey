const Sim = require('pokemon-showdown');
stream = new Sim.BattleStream();

// (async () => {
//     for await (const output of stream) {
//         console.log(output);
//     }
// })();

stream.write(`>start {"formatid":"gen1randombattle"}`);
stream.write(`>player p1 {"name":"Alice"}`);
stream.write(`>player p2 {"name":"Bob"}`);
let i = 0

// Note: game initialization prints exactly 4 messages
read()
read()
read()
read()
read()

// these extra reads shouldn't do anything cz the stream has nothing at this point
read()
read()


// Just trying to print readable game states for now
// Planning to return/use parsed JSON for game decisionmaking
function read(){
    stream.read().then(r => {
        console.log(i)
        if(r.indexOf('{') != -1 && r.lastIndexOf('}') != -1){
            console.log(r.substr(0,r.indexOf('{')))
            const j = JSON.stringify(JSON.parse(r.substr(r.indexOf('{'), r.lastIndexOf('}') + 1)), null, 2)
            console.log(j)
        }
        else{
            console.log(r)
        }
        i += 1
        console.log(i)
        // Each round will have 3 stream messages
        if(i >= 5 && (i - 2) % 3 == 0){
            takeTurn()
        }
        else{
            console.log("don't take turn!")
        }
    }, e => {console.log(i)})
}

const prompt = require('prompt-sync')()

function takeTurn(){
    console.log('P1 Move!')
    const x = prompt('');
    stream.write(`${x}`)
    console.log('P2 Move!')
    const y = prompt('');
    stream.write(`${y}`)
    read()
    read()
    read()
}


const Sim = require('pokemon-showdown');
stream = new Sim.BattleStream();

// Standard initialization logic
stream.write(`>start {"formatid":"gen1randombattle"}`);
stream.write(`>player p1 {"name":"Alice"}`);
stream.write(`>player p2 {"name":"Bob"}`);

// Counter for how many times stream has been read
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
        // Game state data is in JSON, so stringify any JSON that gets output
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
            console.log("not taking input!")
        }
    })
}

// This was the first way I found to get user input idk
const prompt = require('prompt-sync')()

function takeTurn(){
    console.log('P1 Move!')
    const x = prompt('');
    stream.write(`${x}`)
    console.log('P2 Move!')
    const y = prompt('');
    stream.write(`${y}`)
    // Each round, the stream outputs 3 times so we just do it 3 times lol
    read()
    read()
    read()
}


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
stream.read().then(r => console.log(r))
stream.read().then(r => console.log(r))
stream.read().then(r => console.log(r))
stream.read().then(r => {
    console.log(r)
    takeTurn()
})
// read()
function read(){
    stream.read().then(r => console.log(r))
}

const prompt = require('prompt-sync')()

function takeTurn(){
    console.log('Move!')
    const x = prompt('');
    stream.write(`${x}`)
    stream.read().then(r => {
        if(r.indexOf('{') != -1 && r.lastIndexOf('}') != -1){
            const j = JSON.stringify(JSON.parse(r.substr(r.indexOf('{'), r.lastIndexOf('}') + 1)), null, 2)
            console.log(j)
        }
        console.log(r)
    })
    stream.read().then(r => {
        if(r.indexOf('{') != -1 && r.lastIndexOf('}') != -1){
            const j = JSON.stringify(JSON.parse(r.substr(r.indexOf('{'), r.lastIndexOf('}') + 1)), null, 2)
            console.log(r.substr(0, r.indexOf('{')))
            console.log(j)
        }
        else{
            console.log(r)
        }

    })
}


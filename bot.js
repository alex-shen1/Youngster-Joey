const Sim = require('pokemon-showdown');
const {Dex} = require('pokemon-showdown');
const {calculate, Generations, Pokemon, Move} = require('@smogon/calc'); // npm install @smogon/calc
stream = new Sim.BattleStream();

// Standard initialization logic
stream.write(`>start {"formatid":"gen1randombattle"}`);
stream.write(`>player p1 {"name":"Alice"}`);
stream.write(`>player p2 {"name":"Bob"}`);

// Counter for how many times stream has been read
let i = 0

const gen = Generations.get(1); // Gen 1 for damage calcs

// console.log(result.fullDesc())

// Note: game initialization prints exactly 4 messages
readUntilEnd()

// Move all of this into a class structure
p1Data = null // All of p1's sideupdate data
p1ActiveMon = null // The active mon's info sent during side update
p1ActiveMoves = null // The moves of the current active mon (including move, id, pp, maxpp) etc
p1ActiveName = null // A string name of the active pokemon (used for smogon damage calc)
p1ActiveHP = null // String of the current hp of active pokemon

p2Data = null
p2ActiveMon = null
p2ActiveMoves = null
p2ActiveName = null
p2ActiveHP = null

streamOutput = '';

async function readUntilEnd(){
    streamOutput = ''
    let temp = streamOutput;
    await read()
    console.log(streamOutput)
    while(temp !== streamOutput){
        await read()
    }
}
// Just trying to print readable game states for now
// Planning to return/use parsed JSON for game decisionmaking
async function read(){
    stream.read().then(r => {
        streamOutput = r
        let data = null
        // Game state data is in JSON, so stringify any JSON that gets output
        if(r.indexOf('{') != -1 && r.lastIndexOf('}') != -1){
            //console.log(r.substr(0,r.indexOf('{')))
            data = JSON.parse(r.substr(r.indexOf('{'), r.lastIndexOf('}') + 1))
            //console.log(JSON.stringify(data, null, 2))
        }
        else{
            console.log(r)
        }
        i += 1
        if(r.indexOf('sideupdate\np1') != -1){
            p1Data = data
            sidepokemon = data.side.pokemon
            for(i = 0; i < sidepokemon.length; i++) {
                if (sidepokemon[i].active) {
                    p1ActiveMon = sidepokemon[i]
                    i = sidepokemon.length
                }
            }
            p1ActiveMoves = p1Data.active[0].moves
            p1ActiveName = p1ActiveMon.details.substr(0, p1ActiveMon.details.indexOf(','))
            p1ActiveHP = p1ActiveMon.condition.substr(0, p1ActiveMon.condition.indexOf('/'))
            //console.log(JSON.stringify(p1ActiveMon, null, 2))
        }
        if(r.indexOf('sideupdate\np2') != -1){
            p2Data = data
            sidepokemon = data.side.pokemon
            for(i = 0; i < sidepokemon.length; i++) {
                if (sidepokemon[i].active) {
                    p2ActiveMon = sidepokemon[i]
                    i = sidepokemon.length
                }
            }
            p2ActiveMoves = p2Data.active[0].moves
            p2ActiveName = p2ActiveMon.details.substr(0, p2ActiveMon.details.indexOf(','))
            p2ActiveHP = p2ActiveMon.condition.substr(0, p2ActiveMon.condition.indexOf('/'))
            //console.log(JSON.stringify(p2ActiveMon, null, 2))
        }
        if(i >= 5 && r.indexOf('update') == 0){
            takeTurn()
        }

    })
}

// This was the first way I found to get user input idk
const prompt = require('prompt-sync')()

// Implement a system that detects when a pokemon has fainted
// Current bug exists with moves that require a recharge

function takeTurn(){
    
    estimateDamage(p1ActiveName, p1ActiveHP, p2ActiveName, p2ActiveHP, p1ActiveMoves)
    console.log('P1 Move! Available Moves for ' + p1ActiveName + ': ')
    const p1moves = p1Data["active"][0].moves || null
    console.log(p1moves.map(c => c.move))

    const x = prompt('');
    if (x == "quit")
        process.exit(0)
    stream.write(`${x}`)

    const decision = estimateDamage(p2ActiveName, p2ActiveHP, p1ActiveName, p1ActiveHP, p2ActiveMoves) // Comment this line to disable "AI"
    console.log('P2 Move! Available Moves for ' + p2ActiveName + ': ')
    const p2moves = p2Data["active"][0].moves || null
    console.log(p2moves.map(c => c.move))

    //const y = prompt(''); // Uncomment this line if you want to do manual input, and comment line below
    const y = '>p2 move ' + decision
    if (y == "quit")
        process.exit(0)
    stream.write(`${y}`)
    // Each round, the stream outputs 3 times so we just do it 3 times lol
    readUntilEnd()
}

/**
 * Function that uses Smogon's damage calculator to estimate the damage ranges from all attacks on an opposing Pokemon. Currently
 * doesn't take any stat boosts into account.
 * 
 * @param {*} attacker the name of the active pokemon attacking
 * @param {*} defender the name of the active pokemon defending
 * @param {*} activeMoves the list of active moves the attacker knows
 */
function estimateDamage(attacker, attackerHP, defender, defenderHP, activeMoves) {
    // Need to figure out a good way to implement the KO chance
    // Also need a good way to pass in the current hp of both pokemon (important for recoil) / current stat boosts
    const attackingmon = new Pokemon(gen, attacker, {curHP: attackerHP})
    const defendingmon = new Pokemon(gen, defender, {curHP: defenderHP})
    const damages = []
    for (i = 0; i < activeMoves.length; i++) {
        const result = calculate(
            gen,
            attackingmon,
            defendingmon,
            new Move(gen, activeMoves[i].move)
        )
        // Not really sure which damage values to take into account, since calculate returns a Result object that gives lots of data
        console.log(result.fullDesc())
        damages.push((result.range()[0] + result.range()[1])/2)
        //console.log('Expected damage for ' + activeMoves[i].move + ': [' + result.range() + '] || ' + result.moveDesc())
    }
    const moveChoice = damages.indexOf(Math.max(...damages)) + 1 // decide what move number to pick
    return moveChoice
}
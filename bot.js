const Sim = require('pokemon-showdown');
const { Dex } = require('pokemon-showdown');
const { calculate, Generations, Pokemon, Move } = require('@smogon/calc'); // npm install @smogon/calc
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
// const p1AllMon = []; // All monsters available to switch
var p1AllMonDict = {}; // All monsters available into which p1 can switch and their indices
var p2AllMonDict = {}; // All monsters available into which p1 can switch and their indices

p2Data = null
p2ActiveMon = null
p2ActiveMonNum = 0
p2ActiveMoves = null
P2NonActiveMoves = null
p2ActiveName = null
p2ActiveHP = null

streamOutput = '';

async function readUntilEnd() {
    streamOutput = ''
    let temp = streamOutput;
    await read()
    console.log(streamOutput)
    while (temp !== streamOutput) {
        await read()
    }
}
// Just trying to print readable game states for now
// Planning to return/use parsed JSON for game decisionmaking
async function read() {
    stream.read().then(r => {
        //console.log(i)

        // to view active pokemon
        // Game state data is in JSON, so stringify any JSON that gets output
        // if(r.indexOf('{') != -1 && r.lastIndexOf('}') != -1){
        //     console.log(r.substr(0,r.indexOf('{')))
        //     // const j = JSON.stringify(JSON.parse(r.substr(r.indexOf('{'), r.lastIndexOf('}') + 1)), null, 2)
        //     // console.log(j)
        //     const obj = JSON.parse(r.substr(r.indexOf('{'), r.lastIndexOf('}') + 1))

        //     // View the active pokemon
        //     for (let i = 0; i < 6; i++) {
        //         if (obj.side.pokemon[i].active == true) {
        //             console.log(JSON.stringify(obj.side.pokemon[i], null, 2))
        //             break
        //         }
        //     }
        // }
        streamOutput = r
        let data = null
        // Game state data is in JSON, so stringify any JSON that gets output
        if (r.indexOf('{') != -1 && r.lastIndexOf('}') != -1) {
            //console.log(r.substr(0,r.indexOf('{')))
            data = JSON.parse(r.substr(r.indexOf('{'), r.lastIndexOf('}') + 1))
            //console.log(JSON.stringify(data, null, 2))
        }
        else {
            console.log(r)
        }
        // else{
        //      console.log(r)
        // }
        i += 1
        if (r.indexOf('sideupdate\np1') != -1) {
            p1Data = data
            sidepokemon = data.side.pokemon
            for (i = 0; i < sidepokemon.length; i++) {
                if (sidepokemon[i].active) {
                    p1ActiveMon = sidepokemon[i]
                    i = sidepokemon.length
                }
            }
            p1ActiveMoves = p1Data.active[0].moves
            p1ActiveName = p1ActiveMon.details.substr(0, p1ActiveMon.details.indexOf(','))
            p1ActiveHP = p1ActiveMon.condition.substr(0, p1ActiveMon.condition.indexOf('/'))

            // List of switchable pokemon
            // for(i=0; i < sidepokemon.length; i++) {
            //     if (sidepokemon[i].active != "fnt") {
            //         p1AllMon.push(sidepokemon[i].details.substr(0, sidepokemon[i].details.indexOf(',')))
            //     }
            // }
            // const index = p1AllMon.indexOf(p1ActiveName);
            // if (index > -1) {
            // p1AllMon.splice(index, 1);
            // }
            // console.log(p1AllMon); 

            // Dictionary of switchable pokemon for p1
            for (i = 0; i < sidepokemon.length; i++) {
                if (sidepokemon[i].active == false) {
                    // p1AllMon.push(sidepokemon[i].details.substr(0, sidepokemon[i].details.indexOf(',')))
                    p1AllMonDict[i + 1] = sidepokemon[i].details.substr(0, sidepokemon[i].details.indexOf(','))
                }
            }

        }
        if (r.indexOf('sideupdate\np2') != -1) {
            p2Data = data
            sidepokemon2 = data.side.pokemon
            for (i = 0; i < sidepokemon2.length; i++) {
                if (sidepokemon2[i].active) {
                    p2ActiveMon = sidepokemon2[i]
                    p2ActiveMonNum = i + 1
                    i = sidepokemon2.length
                }
            }
            p2ActiveMoves = p2Data.active[0].moves
            p2ActiveName = p2ActiveMon.details.substr(0, p2ActiveMon.details.indexOf(','))
            p2ActiveHP = p2ActiveMon.condition.substr(0, p2ActiveMon.condition.indexOf('/'))

            //console.log(JSON.stringify(p2ActiveMon, null, 2))
            // Dictionary of switchable pokemon for p2
            for (i = 0; i < sidepokemon2.length; i++) {
                if (sidepokemon2[i].active == false) {
                    // p1AllMon.push(sidepokemon2[i].details.substr(0, sidepokemon2[i].details.indexOf(',')))
                    p2AllMonDict[i + 1] = sidepokemon2[i].details.substr(0, sidepokemon2[i].details.indexOf(','))
                }
            }
        }
        if (i >= 5 && r.indexOf('update') == 0) {
            takeTurn()
        }

    })
}

// This was the first way I found to get user input idk
const prompt = require('prompt-sync')()

// Implement a system that detects when a pokemon has fainted
// Current bug exists with moves that require a recharge

function takeTurn() {
    notSwap = 0
    // numberMon = Object.keys(p2AllMonDict).find(key => p2AllMonDict[key].active === true)
    //estimateDamage(p1ActiveName, p1ActiveHP, p2ActiveName, p2ActiveHP, p1ActiveMoves, swap, numberMon)
    console.log('P1 Move! Available Moves for ' + p1ActiveName + ': ')
    const p1moves = p1Data["active"][0].moves || null
    console.log(p1moves.map(c => c.move))
    console.log(p1AllMonDict)
    // console.log("p2")
    // console.log(p2AllMonDict)
    // clear dictionaries***************************************
    // p1AllMon.length = 0
    const x = prompt('');
    if (x == "quit")
        process.exit(0)
    stream.write(`${x}`)
    let bestMoves = []
    // let decision = estimateDamage(p2ActiveName, p2ActiveHP, p1ActiveName, p1ActiveHP, p2ActiveMoves, swap, p2ActiveMonNum) // Comment this line to disable "AI"
    // console.log(decision)
    // bestMoves.push(decision)
    notSwap = 0
    for (j = 0; j < sidepokemon2.length; j++) {
        if (sidepokemon2[j].active == false) {
            console.log("YOU MADE IT INTO THE IF")
            // p2Moves = []
            // for (k = 0; k < p2Data.side.pokemon[j].moves.length; k++) {
            //     p2Moves.push(Dex.moves.get(p2Data.side.pokemon[j].moves[k]).id)
            // }
            // HERE IS THE LINE WE NEED TO CHANGE
            p2Moves = p1ActiveMoves
            console.log(p2Moves)
            p2Name = sidepokemon2[j].details.substr(0, sidepokemon2[j].details.indexOf(','))
            // console.log(p2Name)
            p2HP = sidepokemon2[j].condition.substr(0, sidepokemon2[j].condition.indexOf('/'))
            // console.log(p2HP)
            numberMon = j + 1
            let decision = estimateDamage(p2Name, p2HP, p1ActiveName, p1ActiveHP, p2Moves, numberMon)
            // console.log("HELLO " + decision)
            bestMoves.push(decision)
            // }
        } else { // should just be active = true, could be f
            let decision = estimateDamage(p2ActiveName, p2ActiveHP, p1ActiveName, p1ActiveHP, p2ActiveMoves, p2ActiveMonNum) // Comment this line to disable "AI"
            // console.log(p2ActiveName)
            // console.log(p2ActiveHP)
            // console.log(p2ActiveMoves)
            //console.log("DEBUG " + decision)
            bestMoves.push(decision)
            //console.log("Hiiiiiiiiiiiiiiiiiiiiiiiii")
            notSwap = j + 1
        }
    }
    // console.log(JSON.stringify(bestMoves))
    // console.log("bestMoves: ")
    // console.log(bestMoves)

    console.log('P2 Move! Available Moves for ' + p2ActiveName + ': ')
    const p2moves = p2Data["active"][0].moves || null
    console.log(p2moves.map(c => c.move))
    decision = bestMoves[0]
    for (i = 1; i < bestMoves.length; i++) {
        if (decision[2] < bestMoves[i][2]) {
            decision = bestMoves[i]
        }
    }
    // const y = prompt(''); // Uncomment this line if you want to do manual input, and comment line below
    // iterate through bestMove and see if the best move is there or if it requires switching then add logic for move or switch

    let y = ''
    if (notSwap)
        y = '>p2 move ' + decision[1]
    else {
        var dec = p2AllMonDict[decision[0]]
        // console.log('THIS IS IT' + dec)
        y = '>p2 switch ' + dec
    }

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
 * @param {*} numberMon the index of the mon
 */
function estimateDamage(attacker, attackerHP, defender, defenderHP, activeMoves, numberMon) {
    // Need to figure out a good way to implement the KO chance 
    // Also need a good way to pass in the current hp of both pokemon (important for recoil) / current stat boosts
    const attackingmon = new Pokemon(gen, attacker, { curHP: attackerHP })
    const defendingmon = new Pokemon(gen, defender, { curHP: defenderHP })
    let damages = []
    for (i = 0; i < activeMoves.length; i++) {
        const result = calculate(
            gen,
            attackingmon,
            defendingmon,
            new Move(gen, activeMoves[i].move)
        )
        // Not really sure which damage values to take into account, since calculate returns a Result object that gives lots of data
        console.log(result.fullDesc())
        damages.push((result.range()[0] + result.range()[1]) / 2)
        //console.log('Expected damage for ' + activeMoves[i].move + ': [' + result.range() + '] || ' + result.moveDesc())
    }
    let moveChoice = damages.indexOf(Math.max(...damages)) // decide what move number to pick
    return [numberMon, moveChoice + 1, damages[moveChoice]]
}

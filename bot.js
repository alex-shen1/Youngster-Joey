const Sim = require('pokemon-showdown');
const { Dex } = require('pokemon-showdown');
const { calculate, Generations, Pokemon, Move } = require('@smogon/calc'); // npm install @smogon/calc
stream = new Sim.BattleStream();

// Standard initialization logic
stream.write(`>start {"formatid":"gen1randombattle"}`);
stream.write(`>player p1 {"name":"Alice"}`);
stream.write(`>player p2 {"name":"Youngster Joey"}`);

// Counter for how many times stream has been read
let i = 0

const gen = Generations.get(1); // Gen 1 for damage calcs

// console.log(result.fullDesc())

// Note: game initialization prints exactly 4 messages
readUntilEnd()

// Move all of this into a class structure
let p1Data = null // All of p1's sideupdate data
let p1ActiveMon = null // The active mon's info sent during side update
let p1ActiveMoves = null // The moves of the current active mon (including move, id, pp, maxpp) etc
let p1ActiveName = null // A string name of the active pokemon (used for smogon damage calc)
let p1ActiveHP = null // String of the current hp of active pokemon
let p1AllMonDict = {}; // All monsters available into which p1 can switch and their indices
let p1Wait = null // Bool if p1 currently has to wait
let p1ForceSwitch = null // Bool if p1 currently is forced to switch
let p1Side = null // All the "side" data within p1Data

let p2Data = null
let p2ActiveMon = null
let p2ActiveMonNum = 0
let p2ActiveMoves = null
let p2ActiveName = null
let p2ActiveHP = null
let p2AllMonDict = {}; // All monsters available into which p1 can switch and their indices
let p2Wait = null
let p2ForceSwitch = null
let p2Side = null

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
        i += 1
        if (r.indexOf('sideupdate\np1') != -1) {
            p1Data = data
            p1Side = data.side.pokemon
            // console.log("p1Data !!!!!!!!!!!")
            // console.log(JSON.stringify(p1Data))
            p1Wait = p1Data.wait
            p1ForceSwitch = p1Data.forceSwitch

            for (i = 0; i < p1Side.length; i++) {
                if (p1Side[i].active) {
                    p1ActiveMon = p1Side[i]
                    i = p1Side.length
                }
            }
            p1ActiveMoves = p1Data.active[0].moves
            p1ActiveName = p1ActiveMon.details.substr(0, p1ActiveMon.details.indexOf(','))
            p1ActiveHP = p1ActiveMon.condition.substr(0, p1ActiveMon.condition.indexOf('/'))

            // Dictionary of switchable pokemon for p1
            for (i = 0; i < p1Side.length; i++) {
                if (p1Side[i].active == false) {
                    if (p1Side[i].condition == "0 fnt") {
                        p1AllMonDict[i + 1] = p1Side[i].details.substr(0, p1Side[i].details.indexOf(',')) + " (fainted)"
                    }
                    else {
                        p1AllMonDict[i + 1] = p1Side[i].details.substr(0, p1Side[i].details.indexOf(',')) + " [" + p1Side[i].moves + "]"
                    }
                }
            }

        }
        if (r.indexOf('sideupdate\np2') != -1) {
            p2Data = data
            p2Side = data.side.pokemon
            // console.log("p2Data !!!!!!!!!!!")
            // console.log(JSON.stringify(p2Data))
            p2Wait = p2Data.wait
            p2ForceSwitch = p2Data.forceSwitch
            for (i = 0; i < p2Side.length; i++) {
                if (p2Side[i].active) {
                    p2ActiveMon = p2Side[i]
                    p2ActiveMonNum = i + 1
                    i = p2Side.length
                }
            }
            p2ActiveMoves = p2Data.active[0].moves
            p2ActiveName = p2ActiveMon.details.substr(0, p2ActiveMon.details.indexOf(','))
            p2ActiveHP = p2ActiveMon.condition.substr(0, p2ActiveMon.condition.indexOf('/'))

            //console.log(JSON.stringify(p2ActiveMon, null, 2))
            // Dictionary of switchable pokemon for p2
            for (i = 0; i < p2Side.length; i++) {
                if (p2Side[i].active == false) {
                    if (p2Side[i].condition == "0 fnt") {
                        p2AllMonDict[i + 1] = p2Side[i].details.substr(0, p2Side[i].details.indexOf(',')) + " (fainted)"
                    }
                    else {
                        p2AllMonDict[i + 1] = p2Side[i].details.substr(0, p2Side[i].details.indexOf(','))
                    }
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

    // Handle the Human Player's input (if you need to switch or wait)
    handleP1Input();

    // Handle the AI input
    handleP2Input();

    // Each round, the stream outputs 3 times so we just do it 3 times lol
    readUntilEnd()
}

/**
 * Function that calulates a heuristic score for each possible move based on expected damage
 * 
 * @param {*} expectedDamage the expected damgage of current move against current adversary
 * @param {*} attacker the name of the active pokemon attacking
 * @param {*} defender the name of the active pokemon defending
 * @param {*} activeMoves the list of active moves the attacker knows
 */
function scoreHeuristic(expectedDamage, attacker, defender, activeMove) {
    //accuracy*(expected_damage + probability of second effect occurring*future value expected damage of that effect + probability of critical hit * expected_damage (of that move assuming all stat changes reverted) + effect_score)
    activeMove = Dex.mod('gen1').moves.get(activeMove) // make sure this is gen 1
    attacker = Dex.species.get(attacker)
    defender = Dex.species.get(defender)
    //console.log(defender)

    accuracy = activeMove.accuracy
    if (accuracy == true)
        accuracy = 100

    critRatio = activeMove.critRatio
    baseSpeed = attacker.baseStats["spe"]
    critProbability = critRatio * baseSpeed / 512

    secondary = activeMove.secondary
    secondaryEffect = ""
    secondaryProbability = 0
    if (secondary != null) {
        secondaryEffect = secondary["status"]
        secondaryProbability = secondary["chance"]
    }
    secondaryScore = 50 * (secondaryProbability / 100)

    if (activeMove.category == "Status" && activeMove.status != undefined && defender.status == undefined) {
        primaryEffect = activeMove.status
        console.log(primaryEffect)
    }

    score = 0
    if (accuracy == undefined)
        console.log(activeMove)
    if (accuracy != 0) {
        score = 0//(accuracy / 100) * (expectedDamage + expectedDamage * critProbability + secondaryScore + primaryEffect)
    }
    else {
        score = (expectedDamage + expectedDamage * critProbability + secondaryScore + primaryEffect)
    }
    return score
}


/**
 * Function that uses Smogon's damage calculator to estimate the damage ranges from all attacks on an opposing Pokemon. Currently
 * doesn't take any stat boosts into account.
 * 
 * @param {*} attacker the name of the active pokemon attacking
 * @param {*} defender the name of the active pokemon defending
 * @param {*} activeMoves the list of active moves the attacker knows
 * @param {*} numberMon the index of the mon
 * @param {*} nonActiveMon boolean of whether the mon is active or not, which will change how activeMoves is read
 */
function estimateDamage(attacker, attackerHP, defender, defenderHP, activeMoves, numberMon, nonActiveMon) {
    console.log(activeMoves)
    if (activeMoves[0].move == "Recharge" && activeMoves.length == 1) {
        return [numberMon, 1, 9999] // This way AI will always pick Recharge when it has to
    }
    // Need to figure out a good way to implement the KO chance 
    // Also need a good way to pass in the current hp of both pokemon (important for recoil) / current stat boosts
    const attackingmon = new Pokemon(gen, attacker, { curHP: attackerHP })
    const defendingmon = new Pokemon(gen, defender, { curHP: defenderHP })
    let damages = []
    if (nonActiveMon) {
        for (i = 0; i < activeMoves.length; i++) {
            const result = calculate(
                gen,
                attackingmon,
                defendingmon,
                new Move(gen, activeMoves[i])
            )
            //console.log(result.fullDesc()) This line seems to cause a rare bug and unnecessary anyway
            expectedDamage = (result.range()[0] + result.range()[1]) / 2
            score = scoreHeuristic(expectedDamage, attacker, defender, activeMoves[i])
            damages.push(score)
            //console.log('Expected damage for ' + activeMoves[i].move + ': [' + result.range() + '] || ' + result.moveDesc())
        }
    }
    else {
        for (i = 0; i < activeMoves.length; i++) {
            const result = calculate(
                gen,
                attackingmon,
                defendingmon,
                new Move(gen, activeMoves[i].move)
            )
            //console.log(result.fullDesc())
            expectedDamage = (result.range()[0] + result.range()[1]) / 2
            score = scoreHeuristic(expectedDamage, attacker, defender, activeMoves[i])
            damages.push(score)
            //console.log('Expected damage for ' + activeMoves[i].move + ': [' + result.range() + '] || ' + result.moveDesc())
        }
    }
    let moveChoice = damages.indexOf(Math.max(...damages)) // decide what move number to pick
    return [numberMon, moveChoice + 1, damages[moveChoice]]
}

function handleP1Input() {
    if (!p1Wait && !p1ForceSwitch) {
        console.log('P1 Move! Available Moves for ' + p1ActiveName + ': ')
        const p1moves = p1Data["active"][0].moves || null
        console.log(p1moves.map(c => c.move))
        console.log(p1AllMonDict)
        const x = prompt('');
        if (x == "quit")
            process.exit(0)
        stream.write(`${x}`)
    }
    else if (p1Wait) {
        console.log('P1 Waiting for AI...')
    }
    else if (p1ForceSwitch) {
        console.log('P1 Needs to Switch! Available Pokemon to Switch to: ')
        console.log(p1AllMonDict)
        const x = prompt('');
        if (x == "quit")
            process.exit(0)
        stream.write(`${x}`)
    }
    else {
        console.log("Not really sure how you got here...")
        const x = prompt('');
        if (x == "quit")
            process.exit(0)
        stream.write(`${x}`)
    }
}

function handleP2Input() {
    if (!p2Wait && !p2ForceSwitch) {
        let bestMoves = calcBestMoves();
        console.log("bestMoves: ")
        console.log(bestMoves)
        console.log('AI Move! Available Moves for ' + p2ActiveName + ': ')
        // iterate through bestMove and see if the best move is there or if it requires switching then add logic for move or switch
        decision = bestMoves[0]
        for (i = 1; i < bestMoves.length; i++) {
            if (decision[2] < bestMoves[i][2]) {
                decision = bestMoves[i]
            }
        }
        let y = ''
        // Means that p2 found a better damaging move from another pokemon
        if (decision[0] != 1) {
            //console.log('AI SWITCH TIME')
            y = '>p2 switch ' + decision[0]
        }
        else {
            y = '>p2 move ' + decision[1]
        }

        if (y == "quit")
            process.exit(0)
        stream.write(`${y}`)
    }
    else if (p2Wait) {
        console.log('AI Waiting for P1...')
    }
    else if (p2ForceSwitch) {
        // Repeating code, can move into its own method later anyway because it will be part of the heuristic calc
        console.log('AI Needs to Switch! Available Pokemon to Switch to: ')
        console.log(p2AllMonDict)
        let bestMoves = calcBestMoves();
        console.log("bestMoves: ")
        console.log(bestMoves)
        // iterate through bestMove and see if the best move is there or if it requires switching then add logic for move or switch
        decision = bestMoves[0]
        for (i = 1; i < bestMoves.length; i++) {
            if (decision[2] < bestMoves[i][2]) {
                decision = bestMoves[i]
            }
        }
        let y = '>p2 switch ' + decision[0]

        if (y == "quit")
            process.exit(0)
        stream.write(`${y}`)
    }
    else {
        console.log("Not really sure how you got here... #brokenaimoment")
        const y = prompt('');
        if (y == "quit")
            process.exit(0)
        stream.write(`${y}`)
    }
}

function calcBestMoves() {
    let bestMoves = []
    for (j = 0; j < p2Side.length; j++) {
        // We must not calculate damages for fainted pokemon nor must we try to switch to them
        if (p2Side[j].condition == "0 fnt")
            continue
        if (p2Side[j].active == false) {
            console.log("Inactive Pokemon")
            p2Moves = []
            for (k = 0; k < p2Data.side.pokemon[j].moves.length; k++) {
                p2Moves.push(Dex.mod('gen1').moves.get(p2Data.side.pokemon[j].moves[k]).id)
            }
            //console.log(p2Moves)
            p2Name = p2Side[j].details.substr(0, p2Side[j].details.indexOf(','))
            // console.log(p2Name)
            p2HP = p2Side[j].condition.substr(0, p2Side[j].condition.indexOf('/'))
            //console.log(p2HP)
            numberMon = j + 1
            let decision = estimateDamage(p2Name, p2HP, p1ActiveName, p1ActiveHP, p2Moves, numberMon, true)
            bestMoves.push(decision)
            // }
        } else { // should just be active = true, could be f
            console.log("Active Pokemon")
            let decision = estimateDamage(p2ActiveName, p2ActiveHP, p1ActiveName, p1ActiveHP, p2ActiveMoves, p2ActiveMonNum, false) // Comment this line to disable "AI"
            bestMoves.push(decision)
        }
    }
    return bestMoves
}
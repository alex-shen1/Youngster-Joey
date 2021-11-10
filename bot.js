const Sim = require('pokemon-showdown');
stream = new Sim.BattleStream();

(async () => {
    for await (const output of stream) {
        console.log(output);
    }
})();

stream.write(`>start {"formatid":"gen7randombattle"}`);
stream.write(`>player p1 {"name":"Alice"}`);
stream.write(`>player p2 {"name":"Bob"}`);
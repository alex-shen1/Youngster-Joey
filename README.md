# Setup Instructions
- Install Node.js on your computer (I used v16.13.0 to set up this repo)
- Enter `npm install` into terminal - this will install the necessary dependencies (i.e. the Pokémon Showdown Node package)
- Run the program by running `node bot.js` in terminal (currently doesn't do anything)

# Technical Investigations
- Interface with the battle simulator by using the `stream` object created upon initialization
  - `stream.write()` to input commands
  - `stream.read().then(r => {STUFF})` to get one line of output from the stream
- 3 commands always necessary to start any battle:
  - `>start {"formatid": "{FORMAT}"}` - initializes battle format
  - `>player p1 {"name": "{NAME}"}` - initializes player 1
  - `>player p2 {"name": "{NAME}"}` - initializes player 2
  - Can add `TEAM` field to player JSON if not a random battle; doing this for testing purposes
- After that, input `>p1 {ACTION}` and `>p2 {ACTION}` e.g. `>p1 move 1`, `p2 move 1`
- Stream will output `sideupdate`s for both sides and an `update` of the overall game state, then wait for next input of actions 
- We can use the [Dex library](https://github.com/smogon/pokemon-showdown/blob/master/sim/DEX.md) to query moves + Pokémon types. A naive heuristic we could use is to simply pick the move/action that maximizes damage, which we can do relatively easily.
  - I haven't found a way for Dex to natively give us specific type effectiveness on a given Pokémon, but that should be relatively easy to hardcode into a dictionary or something.

function WorldState(durabilityState, cpState, qualityState, progressState, stepCount, wastedActions, crossClassActionList) {
    this.durabilityState = durabilityState;
    this.cpState = cpState;
    this.qualityState = qualityState;
    this.progressState = progressState;
    this.stepCount = stepCount;
    this.wastedActions = wastedActions;

    //this.reliabilityOk = reliabilityOk;
    if (crossClassActionList === null) {
        this.crossClassActionList = {};
    }
    else {
        this.crossClassActionList = crossClassActionList;
    }

    this.condition = 'Normal';
    this.actions = [];
    this.effects = new EffectTracker();

    // Not passed in:
        // Step 1 is always normal
    
    //this.ppGood = 0;
    //this.ppExcellent = 0;
    //this.ppPoor = 0;
    //this.ppNormal = 1 - (ppGood + ppExcellent + ppPoor);
}



// Individual is not used.
// Returns the correct sequence (also known as individual).
function expectimaxSolver(synth, verbose, debug, logOutput) {

    var logger = new Logger(logOutput);

    var progressState = 0;
    var stepCount = 0;
    var wastedActions = 0;

    var trickUses = 0;
    //var reliability = 1;
    var crossClassActionList = {};
    var crossClassActionCounter = 0;

  
    var worldState = new WorldState(synth.recipe.durability, synth.crafter.craftPoints, synth.recipe.startQuality, progressState,
                           stepCount, wastedActions, crossClassActionList);


    var score = evaluateWorld(synth, worldState, logger, 0);

    logger.log("all ok cap'n");

    return worldState.actions;
}

// Returns a WorldResult:
function evaluateWorld(synth, worldState, logger, depth) {
    console.log("Evaluate world called");

    verbose = true;
    debug = false;
    logOutput = logger;

    // Conditions
    var pGood = 0.23;
    var pExcellent = 0.01;


/*
float GameStep(worldstate, int depth)
*/
if(depth > 3) {
    // TODO: Add some sort of guesstimation of current world fitness
    //return (evaluate(world))
    console.log("QUIT: Depth exceeded");
    return 0;
}

if(worldState.progressState >= synth.recipe.difficulty)
{
     console.log("QUIT: Complete recipe");
    return worldState.qualityState;
}  

if(worldState.durabilityState <= 0)
{
    // return minimum rating
    console.log("QUIT: Failed craft");
    return 0;
}

// Calculate the score of each of the different possible conditions:
var possibleConditions = [];

// TODO: if tricks of the trade was used last turn, then the only condition possible is normal.

if(0===depth)
{
    possibleConditions.push(['Normal', 1]);
}
else if (worldState.condition === 'Excellent')
{
    possibleConditions.push(['Poor', 1]);
}
else if (worldState.condition === 'Normal')
{
    possibleConditions.push(['Excellent', pExcellent]);
    possibleConditions.push(['Good', pGood]);
    possibleConditions.push(['Normal', 1 - (pExcellent + pGood)]);
}
else // The condition is Good. Need to confirm.
{
    possibleConditions.push(['Normal', 1]);
}

/*
    if (verbose) {
        logger.log('%-2s %20s %-5s %-5s %-8s %-5s %-5s' , '#', 'Action', 'DUR', 'CP', 'EQUA', 'EPRG', 'WAC');
        logger.log('%2d %20s %5.0f %5.0f %8.1f %5.1f %5.0f', stepCount, '', durabilityState, cpState, qualityState, progressState, wastedActions);

    }

    if (debug) {
        logger.log('%-2s %20s %-5s %-5s %-8s %-5s %-5s %-5s %-5s %-5s %-5s %-5s', '#', 'Action', 'DUR', 'CP', 'EQUA', 'EPRG', 'WAC', 'IQ', 'CTL', 'QINC', 'BPRG', 'BQUA');
        logger.log('%2d %20s %5.0f %5.0f %8.1f %5.1f %5.0f %5.1f %5.0f %5.0f', stepCount, '', durabilityState, cpState, qualityState, progressState, wastedActions, 0, synth.crafter.control, 0);
    }
    */



    // Strip Tricks of the Trade from individual
    /*
    var tempIndividual = [];
    for (var i=0; i < individual.length; i++) {
        if (isActionNe(AllActions.tricksOfTheTrade, individual[i])) {
            tempIndividual[tempIndividual.length] = individual[i];
        }
        else {
            maxTricksUses += 1;
        }
    }
    */

/*
    if (verbose) {
        logger.log('%-2s %20s %-5s %-5s %-8s %-5s %-5s', '#', 'Action', 'DUR', 'CP', 'EQUA', 'EPRG', 'WAC');
        logger.log('%2d %20s %5.0f %5.0f %8.1f %5.1f %5.0f', stepCount, '', durabilityState, cpState, qualityState, progressState, wastedActions);

    }

    if (debug) {
        logger.log('%-2s %20s %-5s %-5s %-8s %-5s %-5s %-5s %-5s %-5s %-5s %-5s', '#', 'Action', 'DUR', 'CP', 'EQUA', 'EPRG', 'WAC', 'IQ', 'CTL', 'QINC', 'BPRG', 'BQUA');
        logger.log('%2d %20s %5.0f %5.0f %8.1f %5.1f %5.0f %5.1f %5.0f %5.0f', stepCount, '', durabilityState, cpState, qualityState, progressState, wastedActions, 0, synth.crafter.control, 0);
    }
*/
    actionResults = [];

    var bestScore = 0;
    var bestIndex = -1;
    var resultWorld;

     for (var i = 0; i < synth.crafter.actions.length; i++) {

        var action =  synth.crafter.actions[i];
        // some actions can only be used in some conditions...how can we evaluate using tricks of the trade if we can't evaluate it for different conditions?
        // seems that the conditions need to be the outer loop.

        var score = 0;

        for(var n = 0; n < possibleConditions.length; n++)
        {
            // copy the worldState.
            // TODO: There must be a way of doing this without using yagal.
            var toolbox = new yagal_toolbox.Toolbox();

            var newWorld = toolbox.clone(worldState);
            newWorld.actions.push(action);
            newWorld.condition = possibleConditions[n][0];
            console.log("The condition is " + newWorld.condition);

            applyAction(synth, newWorld, logger, depth, action);

            var evaluation = evaluateWorld(synth, newWorld, logger, depth+1);
            var probabilityMultiplier = possibleConditions[n][1];
            console.log("Score is "+evaluation + "  prob" + probabilityMultiplier);
            score+= evaluation * probabilityMultiplier;
        }

            console.log('score ' + score);

        if(score >= bestScore)
        {
            console.log("Set best score ");
            bestIndex = n;
            resultWorld = newWorld;
            bestScore = score;
        }
    }

    worldState.actions = resultWorld.actions;
    return bestScore;
}

// Applying an action can have more than one outcome, so this function returns an array of worlds and their probabilities (eventually)
function applyAction(synth, worldState, logger, depth, action) {
 
        // Add effect modifiers
        var craftsmanship = synth.crafter.craftsmanship;
        var control = synth.crafter.control;
        if (AllActions.innerQuiet.name in worldState.effects.countUps) {
            control *= (1 + 0.2 * worldState.effects.countUps[AllActions.innerQuiet.name]);
        }

        if (AllActions.innovation.name in worldState.effects.countDowns) {
            control *= 1.5;
        }

        var levelDifference = synth.crafter.level - synth.recipe.level;
        if ((AllActions.ingenuity2.name in worldState.effects.countDowns) && (levelDifference < -20) && (synth.crafter.level == 50)) {
            levelDifference = levelDifference + 20;
        }
        else if (AllActions.ingenuity2.name in worldState.effects.countDowns) {
            levelDifference = 3;
        }
        else if ((AllActions.ingenuity.name in worldState.effects.countDowns) && (levelDifference < -20) && (synth.crafter.level == 50)) {
            levelDifference = levelDifference + 10;
        }
        else if (AllActions.ingenuity.name in worldState.effects.countDowns) {
            levelDifference = 0;
        }

        if (AllActions.steadyHand2.name in worldState.effects.countDowns) {
            successProbability = action.successProbability + 0.3;        // Assume 2 always overrides 1
        }
        else if (AllActions.steadyHand.name in worldState.effects.countDowns) {
            successProbability = action.successProbability + 0.2;
        }
        else {
            successProbability = action.successProbability;
        }
        var successProbability = Math.min(successProbability, 1);

        var qualityIncreaseMultiplier = action.qualityIncreaseMultiplier;
        if (AllActions.greatStrides.name in worldState.effects.countDowns) {
            qualityIncreaseMultiplier *= 2;
        }

        if(synth.useConditions)
        {
            if (worldState.condition === 'Poor')
            {
                qualityIncreaseMultiplier *= 0.5;
            }
            else if (worldState.condition === 'Excellent')
            {
                qualityIncreaseMultiplier *= 4;
            }
            else if(worldState.condition === 'Good')
            {
                qualityIncreaseMultiplier *= 1.5;        
            }
            else if(worldState.condition === 'Normal')
            {
                qualityIncreaseMultiplier *= 1;
            }
            else
            {
                console.log("Error - unknown condition");
            }
        }

        // Calculate final gains / losses
        var success = 0;
        var successRand = 0;//Math.random();        
        if (0 <= successRand && successRand <= successProbability) {
            success = 1;
        }

        var bProgressGain = action.progressIncreaseMultiplier * synth.calculateBaseProgressIncrease(levelDifference, craftsmanship);
        if (isActionEq(action, AllActions.flawlessSynthesis)) {
            bProgressGain = 40;
        }
        else if (isActionEq(action, AllActions.pieceByPiece)) {
            bProgressGain = (synth.recipe.difficulty - worldState.progressState)/3;
        }
        var progressGain = success * bProgressGain;

        var bQualityGain = qualityIncreaseMultiplier * synth.calculateBaseQualityIncrease(levelDifference, control);
        var qualityGain = success * bQualityGain;
        if (isActionEq(action, AllActions.byregotsBlessing) && AllActions.innerQuiet.name in worldState.effects.countUps) {
            qualityGain *= (1 + 0.2 * worldState.effects.countUps[AllActions.innerQuiet.name]);
        }

        var durabilityCost = action.durabilityCost;
        if (AllActions.wasteNot.name in worldState.effects.countDowns || AllActions.wasteNot2.name in worldState.effects.countDowns) {
            durabilityCost = 0.5 * action.durabilityCost;
        }

/*
        if (progressGain > 0) {
            reliability = reliability * successProbability;
        }
        */


        // Occur if a dummy action
        //==================================
        if ((worldState.progressState >= synth.recipe.difficulty || worldState.durabilityState <= 0) && action != AllActions.dummyAction) {
            wastedActions += 1;
        }

        // Occur if not a dummy action
        //==================================
        else {
            // State tracking
            worldState.progressState += Math.round(progressGain);
            worldState.qualityState += Math.round(qualityGain);
            worldState.durabilityState -= durabilityCost;
            worldState.cpState -= action.cpCost;

            // Effect management
            //==================================
            // Special Effect Actions
            if (isActionEq(action, AllActions.mastersMend)) {
                worldState.durabilityState += 30;
            }

            if (isActionEq(action, AllActions.mastersMend2)) {
                worldState.durabilityState += 60;
            }

            if (AllActions.manipulation.name in worldState.effects.countDowns && worldState.durabilityState > 0) {
                worldState.durabilityState += 10;
            }

            if (AllActions.comfortZone.name in worldState.effects.countDowns && worldState.cpState > 0) {
                worldState.cpState += 8;
            }

            if (isActionEq(action, AllActions.rumination) && worldState.cpState > 0) {
                if (AllActions.innerQuiet.name in worldState.effects.countUps && worldState.effects.countUps[AllActions.innerQuiet.name] > 0) {
                    worldState.cpState += (21 * worldState.effects.countUps[AllActions.innerQuiet.name] - Math.pow(worldState.effects.countUps[AllActions.innerQuiet.name],2) + 10)/2;
                    delete worldState.effects.countUps[AllActions.innerQuiet.name];
                }
                else {
                    wastedActions += 1;
                }
            }

            if (isActionEq(action, AllActions.byregotsBlessing)) {
                if (AllActions.innerQuiet.name in worldState.effects.countUps) {
                    delete worldState.effects.countUps[AllActions.innerQuiet.name];
                }
                else {
                    wastedActions += 1;
                }
            }

            if (action.qualityIncreaseMultiplier > 0 && AllActions.greatStrides.name in worldState.effects.countDowns) {
                delete worldState.effects.countDowns[AllActions.greatStrides.name];
            }

            if (isActionEq(action, AllActions.tricksOfTheTrade) && worldState.cpState > 0) {
                trickUses += 1;
                worldState.cpState += 20;
            }

            // Decrement countdowns
            for (var countDown in worldState.effects.countDowns) {
                worldState.effects.countDowns[countDown] -= 1;
                if (worldState.effects.countDowns[countDown] === 0) {
                    delete worldState.effects.countDowns[countDown];
                }
            }

            // Increment countups
            if (action.qualityIncreaseMultiplier > 0 && AllActions.innerQuiet.name in worldState.effects.countUps) {
                worldState.effects.countUps[AllActions.innerQuiet.name] += 1 * success;
            }

            // Initialize new worldState.effects.after countdowns are managed to reset them properly
            if (action.type === 'countup') {
                worldState.effects.countUps[action.name] = 0;
            }

            if (action.type == 'countdown') {
                worldState.effects.countDowns[action.name] = action.activeTurns;
            }

            // Sanity checks for state variables
            if ((worldState.durabilityState >= -5) && (worldState.progressState >= synth.recipe.difficulty)) {
                worldState.durabilityState = 0;
            }
            worldState.durabilityState = Math.min(worldState.durabilityState, synth.recipe.durability);
            worldState.cpState = Math.min(worldState.cpState, synth.crafter.craftPoints);

            // Count cross class actions
            if (!((action.cls === 'All') || (action.cls === synth.crafter.cls) || (action.shortName in worldState.crossClassActionList))) {
                worldState.crossClassActionList[action.shortName] = true;
                //crossClassActionCounter += 1; // not sure what the purpose is of this.
            }

        
/*
        if (verbose) {
            logger.log('%2d %20s %5.0f %5.0f %8.1f %5.1f %5.0f', stepCount, action.name, durabilityState, cpState, qualityState, worldState.progressState, wastedActions);
        }

        if (debug) {
            var iqCnt = 0;
            if (AllActions.innerQuiet.name in worldState.effects.countUps) {
                iqCnt = worldState.effects.countUps[AllActions.innerQuiet.name];
            }
            logger.log('%2d %20s %5.0f %5.0f %8.1f %5.1f %5.0f %5.1f %5.0f %5.0f %5.0f %5.0f', stepCount, action.name, durabilityState, cpState, qualityState, progressState, wastedActions, iqCnt, control, qualityGain, bProgressGain, bQualityGain);
        }
        */

    }

/*
    // Penalise failure outcomes
    if (worldState.progressState >= synth.recipe.difficulty) {
        //progressOk = true;
    }

    if (worldState.cpState >= 0) {
        cpOk = true;
    }

    if (worldState.durabilityState >= 0 && progressState >= synth.recipe.difficulty) {
        durabilityOk = true;
    }

    if (trickUses <= synth.maxTrickUses) {
        trickOk = true;
    }
*/
/*
    if (reliability >= synth.reliabilityIndex) {
        reliabilityOk = true;
    }
    */

/*
    var finalState = new State(stepCount, individual[individual.length-1].name, worldState.durabilityState, cpState, qualityState, progressState,
                       wastedActions, progressOk, cpOk, durabilityOk, trickOk, reliabilityOk, crossClassActionList);

    if (verbose) {
        logger.log('Progress Check: %s, Durability Check: %s, CP Check: %s, Tricks Check: %s, Reliability Check: %s, Cross Class Skills: %d, Wasted Actions: %d', progressOk, durabilityOk, cpOk, trickOk, reliabilityOk, crossClassActionCounter, wastedActions);
    }

    if (debug) {
        logger.log('Progress Check: %s, Durability Check: %s, CP Check: %s, Tricks Check: %s, Reliability Check: %s, Cross Class Skills: %d, Wasted Actions: %d', progressOk, durabilityOk, cpOk, trickOk, reliabilityOk, crossClassActionCounter, wastedActions);
    }
*/
    //return finalState;
}



// nRuns is unused.
function ExpectimaxSim(individual, synth, nRuns, seed, verbose, debug, logOutput)
{
     seed = seed !== undefined ? seed : 0;
    verbose = verbose !== undefined ? verbose : false;
    debug = debug !== undefined ? debug : false;
    logOutput = logOutput !== undefined ? logOutput : null;

    var logger = new Logger(logOutput);

    var finalStateTracker = [];

    var runSynth = MonteCarloSynth(individual, synth, false, debug, logOutput);
    logger.log('Expectimax Complete');  
}

function getAverageProperty(stateArray, propName, nRuns) {
    var sumProperty = 0;
    var nSuccesses = 0;
    for (var i=0; i < stateArray.length; i++) {
        var progressOk = stateArray[i]['progressOk'];
        var durabilityOk = stateArray[i]['durabilityOk'];
        var cpOk = stateArray[i]['cpOk'];

        if (progressOk && durabilityOk && cpOk) {
            nSuccesses += 1;
            sumProperty += stateArray[i][propName];
        }
    }

    return sumProperty / nSuccesses;
}

function getAverageHqPercent(stateArray, synth) {
    var nHQ = 0;
    var nSuccesses = 0;
    for (var i=0; i < stateArray.length; i++) {
        var progressOk = stateArray[i]['progressOk'];
        var durabilityOk = stateArray[i]['durabilityOk'];
        var cpOk = stateArray[i]['cpOk'];

        if (progressOk && durabilityOk && cpOk) {
            nSuccesses += 1;

            var qualityPercent = stateArray[i]['qualityState'] / synth.recipe.maxQuality * 100;
            var hqProbability = hqPercentFromQuality(qualityPercent) / 100;
            var hqRand = Math.random();
            if (hqRand <= hqProbability) {
                nHQ += 1;
            }
        }
    }

    return nHQ / nSuccesses * 100;
}

function getSuccessRate(stateArray) {
    var nSuccesses = 0;
    for (var i=0; i < stateArray.length; i++) {
        // Check progressOk, durabilityOk, cpOk
        var progressOk = stateArray[i]['progressOk'];
        var durabilityOk = stateArray[i]['durabilityOk'];
        var cpOk = stateArray[i]['cpOk'];

        if (progressOk && durabilityOk && cpOk) {
            nSuccesses += 1;
        }
    }

    return nSuccesses / stateArray.length * 100;
}

function getMinProperty(stateArray, propName) {
    var minProperty = null;
    for (var i=0; i < stateArray.length; i++) {
        if (minProperty === null) {
            minProperty = stateArray[i][propName];
        }
        else {
            if (minProperty > stateArray[i][propName]) {
                minProperty = stateArray[i][propName];
            }
        }
    }
    return minProperty;
}

function qualityFromHqPercent(hqPercent) {
    var x = hqPercent;
    return -5.6604E-6 * Math.pow(x, 4) + 0.0015369705 * Math.pow(x, 3) - 0.1426469573 * Math.pow(x, 2) + 5.6122722959 * x - 5.5950384565;
}

function hqPercentFromQuality(qualityPercent) {
    var hqPercent = 1;
    if (qualityPercent === 0) {
        hqPercent = 1;
    }
    else if (qualityPercent >= 100) {
        hqPercent = 100;
    }
    else {
        while (qualityFromHqPercent(hqPercent) < qualityPercent && hqPercent < 100) {
            hqPercent += 1;
        }
    }
    return hqPercent;
}

function maxCrossClassActions(level) {
    var maxActions = 1;             // level 1
    if (level >= 10) {
        maxActions += 1;            // level 10
        maxActions += Math.floor((level - 10)/5);
    }

    return maxActions;
}

/*
function evalSeq(individual, mySynth, penaltyWeight) {
    penaltyWeight = penaltyWeight!== undefined ? penaltyWeight : 10000;

    var result = simSynth(individual, mySynth, false, false);
    var penalties = 0;
    var fitness = 0;
    var fitnessProg = 0;

    // Sum the constraint violations
    penalties += result.wastedActions;

    if (!result.durabilityOk) {
       penalties += 1;
    }

    if (!result.progressOk) {
        penalties += 1;
    }

    if (!result.cpOk) {
        penalties += 1;
    }

    if (!result.trickOk) {
        penalties += 1;
    }

    if (!result.reliabilityOk) {
        penalties += 1;
    }

    var crossClassActionCounter = 0;
    for (var action in result.crossClassActionList) {
        crossClassActionCounter += 1;
    }
    var maxCrossClassActionsExceeded = crossClassActionCounter - maxCrossClassActions(mySynth.crafter.level);
    if (maxCrossClassActionsExceeded > 0) {
        penalties += maxCrossClassActionsExceeded;
    }

    fitness += result.qualityState;
    fitness -= penaltyWeight * penalties;
    fitnessProg += result.progressState;

    return [fitness, fitnessProg];
}
*/
// Actions
//parameters: shortName,  name, durabilityCost, cpCost, successProbability, qualityIncreaseMultiplier, progressIncreaseMultiplier, aType, activeTurns, cls, level
var AllActions = {
  dummyAction: new Action(       'dummyAction',          '______________',       0,  0,      1, 0.0, 0.0, 'immediate',   1,  'All',          1),
  observe: new Action(           'observe',              'Observe',              0, 14,      1, 0.0, 0.0, 'immediate',   1,  'All',          1),

  basicSynth: new Action(        'basicSynth',           'Basic Synthesis',      10,  0,   0.9, 0.0, 1.0, 'immediate',   1,  'All',          1),
  standardSynthesis: new Action( 'standardSynthesis',    'Standard Synthesis',   10,  15,  0.9, 0.0, 1.5, 'immediate',   1,  'All',          31),
  carefulSynthesis: new Action(  'carefulSynthesis',     'Careful Synthesis',    10,  0,   1.0, 0.0, 0.9, 'immediate',   1,  'Weaver',       15),
  carefulSynthesis2: new Action( 'carefulSynthesis2',    'Careful Synthesis II', 10,  0,   1.0, 0.0, 1.2, 'immediate',   1,  'Weaver',       50),
  rapidSynthesis: new Action(    'rapidSynthesis',       'Rapid Synthesis',      10,  0,   0.5, 0.0, 2.5, 'immediate',   1,  'Armorer',      15),
  flawlessSynthesis: new Action( 'flawlessSynthesis',    'Flawless Synthesis',   10,  15,  0.9, 0.0, 1.0, 'immediate',   1,  'Goldsmith',    37),
  pieceByPiece: new Action(      'pieceByPiece',         'Piece By Piece',       10,  15,  0.9, 0.0, 1.0, 'immediate',   1,  'Armorer',      50),

  basicTouch: new Action(        'basicTouch',           'Basic Touch',          10,  18,  0.7, 1.0, 0.0, 'immediate',   1,  'All',          5),
  standardTouch: new Action(     'standardTouch',        'Standard Touch',       10,  32,  0.8, 1.25,0.0, 'immediate',   1,  'All',          18),
  advancedTouch: new Action(     'advancedTouch',        'Advanced Touch',       10,  48,  0.9, 1.5, 0.0, 'immediate',   1,  'All',          43),
  hastyTouch: new Action(        'hastyTouch',           'Hasty Touch',          10,  0,   0.5, 1.0, 0.0, 'immediate',   1,  'Culinarian',   15),
  byregotsBlessing: new Action(  'byregotsBlessing',     'Byregot\'s Blessing',  10,  24,  0.9, 1.0, 0.0, 'immediate',   1,  'Carpenter',    50),

  mastersMend: new Action(       'mastersMend',          'Master\'s Mend',       0,   92,  1.0, 0.0, 0.0, 'immediate',   1,  'All',          7),
  mastersMend2: new Action(      'mastersMend2',         'Master\'s Mend II',    0,   160, 1.0, 0.0, 0.0, 'immediate',   1,  'All',          25),
  rumination: new Action(        'rumination',           'Rumination',           0,   0,   1.0, 0.0, 0.0, 'immediate',   1,  'Carpenter',    15),
  tricksOfTheTrade: new Action(  'tricksOfTheTrade',     'Tricks Of The Trade',  0,   0,   1.0, 0.0, 0.0, 'immediate',   1,  'Alchemist',    15),

  innerQuiet: new Action(        'innerQuiet',           'Inner Quiet',          0,   18,  1.0, 0.0, 0.0, 'countup',     1,  'All',          11),
  manipulation: new Action(      'manipulation',         'Manipulation',         0,   88,  1.0, 0.0, 0.0, 'countdown',   3,  'Goldsmith',    15),
  comfortZone: new Action(       'comfortZone',          'Comfort Zone',         0,   66,  1.0, 0.0, 0.0, 'countdown',   10, 'Alchemist',    50),
  steadyHand: new Action(        'steadyHand',           'Steady Hand',          0,   22,  1.0, 0.0, 0.0, 'countdown',   5,  'All',          9),
  steadyHand2: new Action(       'steadyHand2',          'Steady Hand II',       0,   25,  1.0, 0.0, 0.0, 'countdown',   5,  'Culinarian',   37),
  wasteNot: new Action(          'wasteNot',             'Waste Not',            0,   56,  1.0, 0.0, 0.0, 'countdown',   4,  'Leatherworker',15),
  wasteNot2: new Action(         'wasteNot2',            'Waste Not II',         0,   98,  1.0, 0.0, 0.0, 'countdown',   8,  'Leatherworker',50),
  innovation: new Action(        'innovation',           'Innovation',           0,   18,  1.0, 0.0, 0.0, 'countdown',   3,  'Goldsmith',    50),
  greatStrides: new Action(      'greatStrides',         'Great Strides',        0,   32,  1.0, 0.0, 0.0, 'countdown',   3,  'All',          21),
  ingenuity: new Action(         'ingenuity',            'Ingenuity',            0,   24,  1.0, 0.0, 0.0, 'countdown',   5,  'Blacksmith',   15),
  ingenuity2: new Action(        'ingenuity2',           'Ingenuity II',         0,   32,  1.0, 0.0, 0.0, 'countdown',   5,  'Blacksmith',   50)
};

// Test objects
//cls, level, craftsmanship, control, craftPoints, actions
/*
var myWeaverActions = [basicSynth];
var myWeaver = new Crafter('Weaver', 20, 119, 117, 243, myWeaverActions);
var initiatesSlops = new Recipe(20,74,70,0,1053);
var mySynth = new Synth(myWeaver, initiatesSlops, maxTrickUses=1, useConditions=true);
var actionSequence = [innerQuiet, steadyHand, wasteNot, basicSynth, hastyTouch, hastyTouch, hastyTouch, steadyHand, hastyTouch, tricksOfTheTrade, standardTouch, standardTouch, standardTouch, tricksOfTheTrade, rumination, mastersMend, hastyTouch, basicSynth, basicTouch, basicSynth];

simSynth(actionSequence, mySynth, false, true);
MonteCarloSynth(actionSequence, mySynth, false, true);
MonteCarloSim(actionSequence, mySynth, 500);
evalSeq(actionSequence, mySynth);
*/

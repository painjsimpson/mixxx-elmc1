// American Audio ELMC1 script file
// codifier: painjsimpson@gmail.com

ELMC1 = new Controller();
ELMC1.debug = true; // Enable/disable printing debug messages...

ELMC1.id = ""; // Set at Init

// Initialize the controller
ELMC1.init = function (id) {
    ELMC1.id = id; // Store ID
    engine.connectControl("[Channel1]", "play_indicator", "ELMC1.Decks.A.connectPlay");
    engine.connectControl("[Channel1]", "cue_indicator", "ELMC1.Decks.A.connectCue");
    engine.connectControl("[Channel1]", "loop_enabled", "ELMC1.Decks.A.connectLoop");
    engine.connectControl("[Channel1]", "sync_enabled", "ELMC1.Decks.A.connectSync");

    engine.connectControl("[Channel2]", "play_indicator", "ELMC1.Decks.B.connectPlay");
    engine.connectControl("[Channel2]", "cue_indicator", "ELMC1.Decks.B.connectCue");
    engine.connectControl("[Channel2]", "loop_enabled", "ELMC1.Decks.B.connectLoop");
    engine.connectControl("[Channel2]", "sync_enabled", "ELMC1.Decks.B.connectSync");

    print("Set ELMC1.debug=true in JS file for debug messages.");
    print("Controller " + ELMC1.id + " is wah-wah-wah-waaaaaaah.... er, init'ed...");
}

// Shutter down
ELMC1.shutdown = function () {
    print("Controller " + ELMC1.id + " is leaving the building...");
}

// Debug print
ELMC1.print = function(value) {
    if (ELMC1.debug === true) {
        print(value);
    }
}

// Controller variables
ELMC1.isShift = false;
ELMC1.isShiftA = false; // Future functionality
ELMC1.isShiftB = false; // ^^^^^^^^^^^^^^^^^^^^
ELMC1.isBrowsePressed = false;
ELMC1.isBrowseTurned = false;
ELMC1.numHotCues = 4;

ELMC1.Button = Button; // Common JS Button and slight modifications

// LED switcher onner and offer
ELMC1.Button.prototype.setLED = function(ledState) {
    if (ledState === LedState.on) {
        midi.sendShortMsg(ELMC1.hex[this.group],this.controlId,LedState.on);
    } else {
        midi.sendShortMsg(ELMC1.hex[this.group],this.controlId,LedState.off);
    }
}

// Connect a button to a control
ELMC1.Button.prototype.connectLED = function(value, group, control) {
    midi.sendShortMsg(ELMC1.hex[group], ELMC1.hex[control], value * 127);
    ELMC1.print("connectLED group: " + group + " control: " + control + this.toString() + " value: " + value);
}

ELMC1.Deck = Deck;
ELMC1.Deck.isShift = false;            // Currently controller wide shift is used
ELMC1.Deck.isScratching = false;
ELMC1.Deck.isPlaying = false;
ELMC1.Deck.isLoopInSet = false;        // Looping steps
ELMC1.Deck.isLoopOutSet = false;       // ^^^^^^^^^^
ELMC1.Deck.isLoopSet = false;          // ^^^^^^^^^^
ELMC1.Deck.isLooping = false;          // ^^^^^^^^^^
ELMC1.Deck.numHotCues = 4;             // Limit to Skin for visual to show which Hot Cue
ELMC1.Deck.currentHotCue = 0;          // 0 is for regular CUE functionality
ELMC1.Deck.isCuePressed = false;
ELMC1.Deck.fxUnit = 1;                 // The FX the super/fix/chooser knob/buttons belong to
ELMC1.Deck.isSuperChooser = false;     // FX-Sampler Multi button chooses FX
ELMC1.Deck.isSuperSuper = false;       // Controls Super1 knob
ELMC1.Deck.isSuperMixer = false;       // FX Mix
ELMC1.Deck.isSuperButtonDown = false;  // .....
ELMC1.Deck.isSuperMoved = false;       // No movement -> do a toggle, movement -> be a knob
ELMC1.Deck.numSamplers = 4;            // Limit samplers
ELMC1.Deck.currentSampler = 0;         // current sampler
ELMC1.hex = {                          // Hex values for various controls
    shift: 0x11,
    shiftChannel: 0x4,
    play: 0x01,
    cue: 0x02,
    loop: 0x03,
    sync: 0x04,
    multiButton: 0x13,
    bigButton: 0x10,
    pitchDown: 0x0C,
    pitchUp: 0x0D,
    crossfader: 0x45,
    browseButton: 0x10,
    browseDown: 0x40,
    browseUp: 0x41,
    superKnob: 0x04,
    superButton: 0x13,
    "[Channel1]": 0x90,
    "[Channel2]": 0x91
};

// Connect crossfader - my xfader used to move, doesn't now, this was a test
ELMC1.connectCrossfader = function(value, group, control) {
    var cfvalue = engine.getParameter("[Master]", "crossfader");
    ELMC1.print("Crossfader Value: " + cfvalue + " -> " + Math.round(cfvalue*127));
    midi.sendShortMsg(0xB5, 0x45, Math.round(cfvalue*127));
}

// Connect Play button
ELMC1.Deck.prototype.connectPlay = function(value, group, control) {
    midi.sendShortMsg(ELMC1.hex[group], ELMC1.hex.play, value * 127);
}

// Connect Cue button
ELMC1.Deck.prototype.connectCue = function(value, group, control) {
    midi.sendShortMsg(ELMC1.hex[group], ELMC1.hex.cue, value * 127);
}

// Connect Sync button
ELMC1.Deck.prototype.connectSync = function(value, group, control) {
    midi.sendShortMsg(ELMC1.hex[group], ELMC1.hex.sync, value * 127);
}

// Connect Loop button
ELMC1.Deck.prototype.connectLoop = function(value, group, control) {
    midi.sendShortMsg(ELMC1.hex[group], ELMC1.hex.loop, value * 127);
}

// The button that enables/disables scratching
ELMC1.Deck.prototype.wheelTouchHandler = function (value) {
    if (value === ButtonState.pressed) {
        var alpha = 1.0/8;
        var beta = alpha/32;
        var deck = ELMC1.getDeck(this.group);
        this.isScratching = true;
        engine.scratchEnable(this.deckNumber, 128, 33+1/3, alpha, beta);
    } else {    // If button up
        engine.scratchDisable(this.deckNumber);
        this.isScratching = false;
    }
}

// The wheel that actually controls the scratching
ELMC1.Deck.prototype.wheelTurnHandler = function (value) {
    var newValue = value - 64;
    var deck = ELMC1.getDeck(this.group);

    if (engine.isScratching(this.deckNumber)) {
        engine.scratchTick(this.deckNumber, newValue); // Scratch!
    } else {
        engine.setValue(this.group, 'jog', newValue); // Pitch bend
    }
}

// Manage the Loop, Beatloops, size, etc
ELMC1.Deck.prototype.loopHandler = function (value) {
    if ((value === ButtonState.pressed) && !ELMC1.isShift) {
        if (!this.isLoopInSet) {
            engine.setValue(this.group, "loop_in",1);
            this.isLoopInSet = true;
            return;
        }
        if (this.isLoopInSet && !this.isLoopOutSet) {
            engine.setValue(this.group, "loop_out",1);
            this.isLoopOutSet = true;
            this.isLoopSet = true;
            this.isLooping = true;
            this.Buttons.loop.setLED(LedState.on);
            return;
        }
        if (this.isLoopSet && !this.isLooping) {
            engine.setValue(this.group, "reloop_exit", 1);
            this.isLooping = true;
            return;
        }
        if (this.isLoopSet && this.isLooping) {
            engine.setValue(this.group, "reloop_exit", 1);
            this.isLooping = false;
            return;
        }

    }

    if ((value === ButtonState.pressed) && ELMC1.isShift) {
        if (this.isLoopSet || this.isLoopInSet || this.isLoopOutSet) {
            engine.setValue(this.group, "loop_in", 0);
            engine.setValue(this.group, "loop_out", 0);
            engine.setValue(this.group, "loop_end_position", -1);
            engine.setValue(this.group, "loop_start_position", -1);
            engine.setValue(this.group, "loop_exit", 1);
           // this.Buttons.loop.setLED(LedState.off);
            this.isLoopSet = false;
            this.isLoopInSet = false;
            this.isLoopOutSet = false;
            this.isLooping = false;
            return;
        }
        if (!this.isLoopSet) {
            engine.setValue(this.group, "beatlooproll_8_activate", 1);
            this.isLoopSet = true;
            this.isLooping = true;
            this.isLoopInSet = true;
            this.isLoopOutSet = true;
            //this.Buttons.loop.setLED(LedState.on);
            return;
        }
    }
}

// Play handler, real basic
ELMC1.Deck.prototype.playHandler = function (value) {
    if (value === ButtonState.pressed) {
        engine.setValue(this.group, 'play', !(engine.getValue(this.group, 'play')));

    }
}

// Sync handler
ELMC1.Deck.prototype.syncHandler = function (value) {
    if (value === ButtonState.pressed) {
        engine.setValue(this.group, "sync_master", 1);
    }
}

// Handles the Cue functionality -- regular and hot
ELMC1.Deck.prototype.cueHandler = function (value) {
    if (this.currentHotCue === 0) {
        engine.setValue(this.group, 'cue_default', 1);
    } else {
        var hcenabled = "hotcue_" + this.currentHotCue.toString() + "_enabled";
        var hcactivate = "hotcue_" + this.currentHotCue.toString() + "_activate";
        var hcclear = "hotcue_" + this.currentHotCue.toString() + "_clear";
        if (ELMC1.isShift && engine.getValue(this.group, hcenabled)) {
            engine.setValue(this.group, hcclear, 1);
        }
        else {
            engine.setValue(this.group, hcactivate, 1);
        }
    }
    ELMC1.print("cueHandler --> currentHotCue/numHotCues: " + this.currentHotCue + "/" + this.numHotCues);
}

// 2 decks for now
ELMC1.Decks = {"A": new ELMC1.Deck(1,"[Channel1]"), "B": new ELMC1.Deck(2,"[Channel2]")};

// Group to Deck
ELMC1.groupToDeck = function(group) {
        var matches = group.match(/^\[Channel(\d+)\]$/);
        if (matches == null) {
                return -1;
        } else {
                return matches[1];
        }
}

// Helper to getDeck
ELMC1.GroupToDeck = {"[Channel1]":"A", "[Channel2]":"B"};

// Get the Deck from a Group
ELMC1.getDeck = function(group) {
    return ELMC1.Decks[ELMC1.GroupToDeck[group]];
}

// Configure callback handlers and set some variables
ELMC1.Decks.A.addButton("wheelTouch", new ELMC1.Button(0x62), "wheelTouchHandler");
ELMC1.Decks.A.addButton("wheelTurn", new ELMC1.Button(0x05), "wheelTurnHandler");
ELMC1.Decks.A.addButton("play", new ELMC1.Button(ELMC1.hex.play), "playHandler");
ELMC1.Decks.A.addButton("cue", new ELMC1.Button(ELMC1.hex.cue), "cueHandler");
ELMC1.Decks.A.addButton("sync", new ELMC1.Button(ELMC1.hex.sync), "syncHandler");
ELMC1.Decks.A.addButton("loop", new ELMC1.Button(ELMC1.hex.loop), "loopHandler");
ELMC1.Decks.A.fxUnit = 1;
ELMC1.Decks.A.numSamplers = 4;
ELMC1.Decks.A.currentSampler = 1;

// For each deck
ELMC1.Decks.B.addButton("wheelTouch", new ELMC1.Button(0x62), "wheelTouchHandler");
ELMC1.Decks.B.addButton("wheelTurn", new ELMC1.Button(0x05), "wheelTurnHandler");
ELMC1.Decks.B.addButton("play", new ELMC1.Button(ELMC1.hex.play), "playHandler");
ELMC1.Decks.B.addButton("cue", new ELMC1.Button(ELMC1.hex.cue), "cueHandler");
ELMC1.Decks.B.addButton("sync", new ELMC1.Button(ELMC1.hex.sync), "syncHandler");
ELMC1.Decks.B.addButton("loop", new ELMC1.Button(ELMC1.hex.loop), "loopHandler");
ELMC1.Decks.B.fxUnit = 2;
ELMC1.Decks.B.numSamplers = 4;
ELMC1.Decks.B.currentSampler=1;

//Toggle Shift state
ELMC1.shift = function(channel, control, value, status, group) {
    if (value === ButtonState.pressed) {
        ELMC1.isShift = true;
        print("isShift = "+ELMC1.isShift.toString());
    } else {
        ELMC1.isShift = false;
    }
}

// Touch the top of the Jog to toggle scratching
ELMC1.wheelTouch = function(channel, control, value, status, group) {
    var deck = ELMC1.getDeck(group);
    deck.Buttons.wheelTouch.handleEvent(value);
}

// Turn the Jog, scratch or no
ELMC1.wheelTurn = function(channel, control, value, status, group) {
    var deck = ELMC1.getDeck(group);
    deck.Buttons.wheelTurn.handleEvent(value);
}

// Loop button -- held down for advanced looping
ELMC1.loop = function(channel, control, value, status, group) {
    var deck = ELMC1.getDeck(group);
    deck.Buttons.loop.handleEvent(value);
}

// Basic play handler call
ELMC1.play = function (channel, control, value, status, group) {
    var deck = ELMC1.getDeck(group);
    deck.Buttons.play.handleEvent(value);
}

// While cue held down, manage hot cues, or just release for normal functionality
ELMC1.cue = function (channel, control, value, status, group) {
    var deck = ELMC1.getDeck(group);
    // Set default values if not set
    if (deck.currentHotCue === undefined) {
        deck.currentHotCue = 0;
        deck.numHotCues = ELMC1.numHotCues;
    }

    if (value === ButtonState.pressed) {
        deck.isCuePressed = true;
    } else {
        deck.isCuePressed = false;
        ELMC1.restoreHotCues(group);
        deck.Buttons.cue.handleEvent(value);
    }

    ELMC1.print("isCuePressed: " + deck.isCuePressed.toString());

}

// Sync handler caller
ELMC1.sync = function (channel, control, value, status, group) {
    var deck = ELMC1.getDeck(group);
    deck.Buttons.sync.handleEvent(value);
}

// Multi-Knob -- loop_enable mode, FX mode, sample mode
ELMC1.multiKnob = function (channel, control, value, status, group) {
    var deck = ELMC1.getDeck(group);
    if (engine.getValue(group, 'loop_enabled')) {
        (value < 64) ? engine.setValue(group, "loop_halve", 1) : engine.setValue(group, "loop_double", 1);
    }
    if (deck.isCuePressed) {
        ELMC1.clearHotCues(group);
        var newValue = 0;
        (value < 64) ? newValue = -1 : newValue = 1;
        deck.currentHotCue = deck.currentHotCue + newValue;
        if (deck.currentHotCue < 0) {
            deck.currentHotCue = 0;
        }
        if (deck.currentHotCue > deck.numHotCues) {
            deck.currentHotCue = deck.numHotCues;
        }
        ELMC1.print("Hot Cue: " + deck.currentHotCue);
        var hotcue = "hotcue_" + deck.currentHotCue.toString() + "_enabled";
        engine.setValue(group, hotcue, 1);
    }
}

// Browse Button
ELMC1.browseKnobButton = function(channel, control, value, status, group) {
    if (value === ButtonState.pressed) {
        ELMC1.isBrowsePressed = true;
    } else {
        ELMC1.isBrowsePressed = false;
        if (ELMC1.hasBrowseTurned) {
            engine.setValue("[Playlist]", "ToggleSelectedSidebarItem", 1);
            ELMC1.hasBrowseTurned = false;
        } else {
            engine.setValue("[Playlist]", "LoadSelectedIntoFirstStopped", 1);
        }
    }
    ELMC1.print("isBrowsePressed: " + ELMC1.isBrowsePressed);
}

// Browse Knob -- selecting, expanding, navigating
ELMC1.browseKnobUp = function(channel, control, value, status, group) {
    if (value === ButtonState.released) { return; }
    if (ELMC1.isShift) {
        engine.setValue("[Playlist]", "SelectNextPlaylist", 1);
    } else {
        engine.setValue("[Playlist]", "SelectNextTrack", 1);
    }
    ELMC1.hasBrowseTurned = true;
}

// Browse Knob -- selecting, expanding, navigating
ELMC1.browseKnobDown = function(channel, control, value, status, group) {
    if (value === ButtonState.released) { return; }
    if (ELMC1.isShift) {
        engine.setValue("[Playlist]", "SelectPrevPlaylist", 1);
    } else {
        engine.setValue("[Playlist]", "SelectPrevTrack", 1);
    }
    ELMC1.hasBrowseTurned = true;
}

// Clears hot cue indicators to visually ID current hot cue
ELMC1.clearHotCues = function(group) {
    deck = ELMC1.getDeck(group);
    var i = 1;
    while (i <= deck.numHotCues) {
        var hotcue = "hotcue_" + i.toString() + "_enabled";
        engine.setValue(group, hotcue, 0);
        i = i + 1;
    }
}

// Restores hot cue indicators after used to ID current hot cue
ELMC1.restoreHotCues = function(group) {
    deck = ELMC1.getDeck(group);
    var i = 1;
    while (i <= deck.numHotCues) {
        var hotcue = "hotcue_" + i.toString() + "_enabled";
        var pos = "hotcue_" + i.toString() + "_position";
        if (engine.getValue(group, pos) !== -1) {
            engine.setValue(group, hotcue, 1);
        }
        i = i + 1;
    }
}

// Pitch or Shift for Rate_perm_up
ELMC1.pitchUp = function(channel, control, value, status, group) {
    if (value === ButtonState.pressed) {
        if (!ELMC1.isShift) {
            engine.setParameter(group, "pitch_adjust_up", 1);
        } else {
            engine.setParameter(group, "rate_temp_up", 1);
        }
    } else {
        engine.setParameter(group, "rate_temp_up", 0);
    }
}

// Pitch down or shifted rate_perm down
ELMC1.pitchDown = function(channel, control, value, status, group) {
    if (value === ButtonState.pressed) {
        if (!ELMC1.isShift) {
            engine.setParameter(group, "pitch_adjust_down", 1);
        } else {
            engine.setParameter(group, "rate_temp_down", 1);
        }
    } else {
        engine.setParameter(group, "rate_temp_down", 0);
    }
}

// Rate with Jog
ELMC1.rateWheel = function(channel, control, value, status, group) {
    var newValue = 0;
    var modify = 0.05;
    var curr = engine.getValue(group, "rate");
    (value < 64) ? newValue = -1 : newValue = 1;
    modify = modify * newValue;
    modify = curr + modify;
    modify = Math.max(-1, Math.min(1, modify));
    engine.setValue(group, "rate", modify);
}

// Super Mix knob
ELMC1.superKnob = function(channel, control, value, status, group) {
    var deck = ELMC1.getDeck(group);
    if (ELMC1.isShift) {
        var newValue = (value < 64) ? -1 : 1;
        var cmd = "";
        var sampler = "[Sampler" + deck.currentSampler + "]";
        var duration = engine.getValue(sampler, "duration");
        var isPlaying = engine.getValue(sampler, "play_indicator");
        if (duration === 0) {
            (newValue === 1) ? cmd = "SelectNextTrack" : cmd = "SelectPrevTrack";
            engine.setValue("[Playlist]", cmd, 1);
            return;
        }
        if (!isPlaying) {
            deck.currentSampler = deck.currentSampler + newValue;
            deck.currentSampler = Math.min(deck.numSamplers, Math.max(1, deck.currentSampler));
            ELMC1.print("Sampler: " + deck.currentSampler);
            return;
        }
        if (isPlaying) {
            (newValue === 1) ? cmd = "volume_up" : cmd = "volume_down";
            engine.setValue(sampler, cmd, 1);
            return;
        }

    } else {
        var fxunit = "[EffectRack" + deck.deckNumber + "_EffectUnit" + deck.fxUnit + "]";
        ELMC1.print("Effects: " + fxunit);
        var newValue = 0;
        (value < 64) ? newValue = -1 : newValue = 1;

        if (deck.isSuperChooser && !deck.isSuperButtonDown) {
            var chain = "";
            (newValue === 1) ? chain = "next_chain" : chain = "prev_chain";
            engine.setParameter(fxunit, chain, 1);
            deck.isSuperMoved = true;
            return;
        }
        if (deck.isSuperSuper && !deck.isSuperButtonDown) {
            var dir = "";
            (newValue === 1) ? dir = "super1_up" : dir = "super1_down";
            engine.setParameter(fxunit, dir, 1);
            deck.isSuperMoved = true;
            return;
        }
        if (deck.isSuperSuper && deck.isSuperButtonDown) {
            var mix = "";
            (newValue === 1) ? mix = "mix_up" : mix = "mix_down";
            engine.setParameter(fxunit, mix, 1);
            deck.isSuperMoved=true;
            return;
        }
    }


}

// Super Knob Button
ELMC1.superKnobButton = function(channel, control, value, status, group) {
    var deck = ELMC1.getDeck(group);
    if (ELMC1.isShift) {
        var sampler = "[Sampler" + deck.currentSampler + "]";
        var duration = engine.getValue(sampler, "duration");
        var isPlaying = engine.getValue(sampler, "play_indicator");
        if (duration === 0) {
            engine.setValue(sampler, "LoadSelectedTrack", 1);
            return;
        }
        if (duration > 0 && !isPlaying) {
            engine.setValue(sampler, "play", 1);
            return;
        }
        if (isPlaying) {
            engine.setValue(sampler, "play", 1);
            return;
        }

    } else {
        var fxunit = "[EffectRack" + deck.deckNumber + "_EffectUnit" + deck.fxUnit + "]";
        if (value === ButtonState.pressed) {
            deck.isSuperButtonDown = true;
            deck.isSuperMoved = false;
            if (!deck.isSuperChooser && !deck.isSuperSuper && !deck.isSuperMixer) {
                deck.isSuperChooser = true;
                script.toggleControl(fxunit, "group_" + group + "_enable");
            }
            if (deck.isSuperChooser) {
                script.toggleControl(fxunit, "enabled");
                script.toggleControl(fxunit, "group_" + group + "_enable");
            }
            if (deck.isSuperSuper) {
                deck.isSuperMixer = true;
            }
        }

        if (value === ButtonState.released) {
            if (!deck.isSuperMoved) {
                deck.isSuperChooser = !deck.isSuperChooser;
                deck.isSuperSuper = !deck.isSuperSuper;
            }
            deck.isSuperButtonDown = false;
            deck.isSuperMixer = false;
            deck.isSuperMoved = false;
        }
        ELMC1.print("isSuperMoved: " + deck.isSuperMoved);
        ELMC1.print("isSuperButtonDown: " + deck.isSuperButtonDown);
    }
}


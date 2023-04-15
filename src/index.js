/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from "blockly";
import { blocks } from "./blocks";
import { generator } from "./blocks_generator";
import { javascriptGenerator } from "blockly/javascript";
import { toolbox } from "./toolbox";
import "./index.css";
import blueimg from "./assets/images/blue.png";
import busimg from "./assets/images/bus.jpeg";
import Interpreter from "js-interpreter";

// Register the blocks and generator with Blockly
Blockly.common.defineBlocks(blocks);
Object.assign(javascriptGenerator, generator);

const grid = document.querySelector(".grid");
const blocklyDiv = document.getElementById("blocklyDiv");
const bluedogImage = document.getElementById("bluedogImage");
const busImage = document.getElementById("busImage");

const runButton = document.querySelector("#runButton");
const resetButton = document.querySelector("#resetButton");

const ws = Blockly.inject(blocklyDiv, {
    toolbox: toolbox,
    scrollbars: false,
    horizontalLayout: true,
    toolboxPosition: "end",
    trashcan: true,
});

let myInterpreter = null;
let runnerPid = 0;

function initInterpreterWaitForSeconds(interpreter, globalObject) {
    // Ensure function name does not conflict with variable names.
    javascriptGenerator.addReservedWords("waitForSeconds");

    const wrapper = interpreter.createAsyncFunction(function (
        timeInSeconds,
        callback
    ) {
        // Delay the call to the callback.
        setTimeout(callback, timeInSeconds * 1000);
    });
    interpreter.setProperty(globalObject, "waitForSeconds", wrapper);
}

function initApi(interpreter, globalObject) {
    const moveForwardWrapper = function () {
        return moveForward();
    };
    interpreter.setProperty(
        globalObject,
        "moveForward",
        interpreter.createNativeFunction(moveForwardWrapper)
    );

    const wrapperAlert = function alert(text) {
        text = arguments.length ? text : "";
        outputArea.value += "\n" + text;
    };
    interpreter.setProperty(
        globalObject,
        "alert",
        interpreter.createNativeFunction(wrapperAlert)
    );

    // Add an API for the wait block.  See wait_block.js
    initInterpreterWaitForSeconds(interpreter, globalObject);
}

function resetStepUi() {
    clearTimeout(runnerPid);
    runButton.disabled = "";

    myInterpreter = null;
}

function runCode() {
    resetState();
    if (!myInterpreter) {
        // First statement of this code.
        // Clear the program output.
        resetStepUi();
        const latestCode = javascriptGenerator.workspaceToCode(ws);
        runButton.disabled = "disabled";

        // And then show generated code in an alert.
        // In a timeout to allow the outputArea.value to reset first.
        setTimeout(function () {
            // Begin execution
            myInterpreter = new Interpreter(latestCode, initApi);
            function runner() {
                if (myInterpreter) {
                    const hasMore = myInterpreter.run();
                    if (hasMore) {
                        // Execution is currently blocked by some async call.
                        // Try again later.
                        runnerPid = setTimeout(runner, 10);
                    } else {
                        // Program is complete.
                        checkGoalReached();
                    }
                }
            }
            runner();
        }, 1);
        return;
    }
}

const START_STATE = { x: 0, y: 0 };
const GOAL_STATE = { x: 0, y: 2 };
let current_state = { ...START_STATE };
let inErrorState = false;

const ROWS = 3;
const COLS = 3;

function initImages() {
    bluedogImage.src = blueimg;
    busImage.src = busimg;
}

function initButtons() {
    runButton.addEventListener("click", runCode);
    resetButton.addEventListener("click", resetState);
}

function drawGrid() {
    for (var i = 0; i < ROWS; i++) {
        for (var j = 0; j < COLS; j++) {
            var cell = document.createElement("div");
            cell.id = "cell" + i + "_" + j;
            cell.className = "cell";

            grid.appendChild(cell);
        }
    }
}

function moveImage(state, imgElement) {
    const cell = document.getElementById("cell" + state.x + "_" + state.y);
    const cellRect = cell.getBoundingClientRect();
    const imageRect = imgElement.getBoundingClientRect();
    const x = cellRect.left + cellRect.width / 2 - imageRect.width / 2;
    const y = cellRect.top + cellRect.height / 2 - imageRect.height / 2;
    imgElement.style.transform = `translate(${x}px, ${y}px)`;
}

function resetState() {
    current_state = { ...START_STATE };

    moveImage(START_STATE, bluedogImage);
    moveImage(GOAL_STATE, busImage);

    resetStepUi();
    inErrorState = false;
    grid.classList.remove("error");
}

function moveForward() {
    if (inErrorState) return;

    if (current_state.y < COLS - 1) {
        current_state.y++;
        moveImage(current_state, bluedogImage);
    } else {
        inErrorState = true;
        grid.classList.add("error");
        alert("uh oh! You have gone too far! Please try again.");
    }
}

function checkGoalReached() {
    if (inErrorState) return;

    if (current_state.x === GOAL_STATE.x && current_state.y === GOAL_STATE.y) {
        alert("You have reached the goal!");
    } else {
        alert("You have not reached the goal. Please try again.");
    }
}

initImages();
initButtons();
drawGrid();
resetState();

// Every time the workspace changes state, save the changes to storage.
ws.addChangeListener((e) => {
    // UI events are things like scrolling, zooming, etc.
    // No need to save after one of these.
    if (e.isUiEvent) return;
    //save(ws);
});

// Whenever the workspace changes meaningfully, run the code again.
ws.addChangeListener((e) => {
    // Don't run the code when the workspace finishes loading; we're
    // already running it once when the application starts.
    // Don't run the code during drags; we might have invalid state.
    if (
        e.isUiEvent ||
        e.type == Blockly.Events.FINISHED_LOADING ||
        ws.isDragging()
    ) {
        return;
    }
});

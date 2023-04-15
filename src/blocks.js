// create custom blockly move forward block and generator stub
// https://developers.google.com/blockly/guides/create-custom-blocks/define-blocks
// https://developers.google.com/blockly/guides/create-custom-blocks/define-blocks#blockly_block_definition
import * as Blockly from "blockly/core";

const moveForward = {
    type: "move_forward",
    message0: "Move Forward",
    previousStatement: null,
    nextStatement: null,
    colour: 230,
    tooltip: "",
    helpUrl: "",
};

export const blocks = Blockly.common.createBlockDefinitionsFromJsonArray([
    moveForward,
]);

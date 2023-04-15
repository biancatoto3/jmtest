import { javascriptGenerator } from "blockly/javascript";

export const generator = Object.create(null);

generator["move_forward"] = function (block) {
    return `moveForward();\nwaitForSeconds(1);\n`;
};

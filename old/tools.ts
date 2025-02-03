import { exec } from "astal";
import { Gdk } from "astal/gtk3";
import { Slurp } from "./configs";

export function slurp(
    args?: Partial<{
        dimensions: boolean;
        backgroundColor: string;
        borderColor: string;
        selectionColor: string;
        optionBoxColor: string;
        fontFamily: string;
        borderWeight: number;
        outputFormat: string;
        output: boolean;
        point: boolean;
        restrict: boolean;
        aspectRatio: string;
    }>
): [string, Error | null] {
    const slurpConfig = Slurp();
    const cmd = ["slurp"];
    const addCmd = (option: string, arg: string | undefined, cfg: string) => {
        if (arg) cmd.push(`-${option}`, `${arg}`);
        else if (cfg !== "") cmd.push(`-${option}`, `${cfg}`);
    };
    if (args?.dimensions === true || (!args?.dimensions && slurpConfig.dimensions)) cmd.push("-d");
    addCmd("b", args?.backgroundColor, slurpConfig.backgroundColor);
    addCmd("c", args?.borderColor, slurpConfig.borderColor);
    addCmd("s", args?.selectionColor, slurpConfig.selectionColor);
    addCmd("B", args?.optionBoxColor, slurpConfig.optionBoxColor);
    addCmd("F", args?.fontFamily, slurpConfig.fontFamily);
    addCmd("w", args?.borderWeight?.toString(), slurpConfig.borderWeight.toString());
    if (args?.outputFormat) cmd.push("-f", `${args.outputFormat}`);
    if (args?.output === true) cmd.push("-o");
    if (args?.point === true) cmd.push("-p");
    if (args?.restrict === true) cmd.push("-r");
    if (args?.aspectRatio) cmd.push("-a", `${args.aspectRatio}`);
    try {
        return [exec(cmd), null];
    } catch (e) {
        return ["", e as Error];
    }
}
export function slurpRect(
    args?: Partial<{
        dimensions: boolean;
        backgroundColor: string;
        borderColor: string;
        selectionColor: string;
        optionBoxColor: string;
        fontFamily: string;
        borderWeight: number;
        output: boolean;
        restrict: boolean;
        aspectRatio: string;
    }>
): [Gdk.Rectangle, Error | null] {
    const [output, error] = slurp(args);
    if (error) return [new Gdk.Rectangle(), error];
    const region = output.split(" ");
    const [x, y] = region[0].split(",").map(Number);
    const [width, height] = region[1].split("x").map(Number);
    return [new Gdk.Rectangle({ x, y, width, height }), null];
}

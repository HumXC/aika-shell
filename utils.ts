import { exec } from "astal";
import { EventBox } from "astal/gtk3/widget";
import Config from "./config";
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function setHoverClassName(widget: EventBox, className: string = "") {
    if (className === "") className = widget.className;
    widget.className = className;
    widget.connect("hover", () => (widget.className = className + "-hover"));
    widget.connect("hover-lost", () => (widget.className = className));
}

function formatBytes(bytes: number): string {
    function formatValue(value: number): string {
        // 判断是否需要保留小数位
        return value % 1 === 0 ? `${value}` : `${value.toFixed(2)}`;
    }

    if (bytes >= 800 * 1024 * 1024) {
        // 超过 800 MB，显示为 GB
        return `${formatValue(bytes / 1e9)} GB`;
    } else if (bytes >= 800 * 1024) {
        // 超过 800 KB，但未达到 800 MB，显示为 MB
        return `${formatValue(bytes / 1e6)} MB`;
    } else {
        // 小于 800 KB，显示为 KB
        return `${formatValue(bytes / 1024)} KB`;
    }
}
function formatDuration(seconds: number) {
    if (typeof seconds !== "number" || seconds < 0) {
        throw new Error("Input must be a non-negative number.");
    }

    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    seconds %= 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds.toFixed(0)}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds.toFixed(0)}s`;
    } else {
        return `${seconds.toFixed(2)}s`;
    }
}

// -d           Display dimensions of selection.
// -b #rrggbbaa Set background color.
// -c #rrggbbaa Set border color.
// -s #rrggbbaa Set selection color.
// -B #rrggbbaa Set option box color.
// -F s         Set the font family for the dimensions.
// -w n         Set border weight.
// -f s         Set output format.
// -o           Select a display output.
// -p           Select a single point.
// -r           Restrict selection to predefined boxes.
// -a w:h       Force aspect ratio.
class SlurpConfig {
    dimensions: boolean = false;
    backgroundColor: string = "#0000005a";
    borderColor: string = "#ffffffe8";
    selectionColor: string = "";
    optionBoxColor: string = "";
    fontFamily: string = "";
    borderWeight: number = 2;
}
const slurpConfig = Config.Get(SlurpConfig, "slurp");
function slurp(
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
export { sleep, setHoverClassName, formatBytes, formatDuration, slurp, SlurpConfig };

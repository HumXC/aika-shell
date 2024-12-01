import { exec, Gio, GLib } from "astal";
import { EventBox } from "astal/gtk3/widget";
import { Slurp as slurpConfig } from "./configs";
import { Gdk } from "astal/gtk3";
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
        return `${seconds.toFixed(0)}s`;
    }
}
function notifySend(
    summary: string,
    body: string,
    options?: Partial<{
        urgency: "low" | "normal" | "critical";
        expireTime: number;
        appName: string;
        category: string;
        transient: boolean;
        hint: string;
        replaceId: string;
        wait: boolean;
        action: string;
        icon: string;
    }>
): Error | null {
    const cmd = ["slurp"];
    const addCmd = (option: string, arg: string | undefined, cfg: string) => {
        if (arg) cmd.push(`-${option}`, `${arg}`);
        else if (cfg !== "") cmd.push(`-${option}`, `${cfg}`);
    };
    addCmd("u", options?.urgency, "normal");
    addCmd("t", options?.expireTime?.toString(), "");
    addCmd("a", options?.appName, "");
    addCmd("c", options?.category, "");
    if (options?.transient === true) cmd.push("-e");
    addCmd("h", options?.hint, "");
    addCmd("r", options?.replaceId, "");
    if (options?.wait === true) cmd.push("-w");
    addCmd("A", options?.action, "");
    if (options?.icon) cmd.push("-i", options.icon);
    cmd.push(summary, body);
    try {
        exec(cmd);
        return null;
    } catch (e) {
        return e as Error;
    }
}
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
function slurpRect(
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
function rectToString(rect: Gdk.Rectangle): string {
    return `${rect.x},${rect.y} ${rect.width}x${rect.height}`;
}

// TODO: 测试 Gio.InputStream | GLib.Bytes
function wlCopy(body: string | Gio.InputStream | GLib.Bytes, mime: string | null = null) {
    const cmd = ["wl-copy"];
    if (mime) cmd.push("-t", mime);
    if (typeof body === "string") cmd.push(body);

    const proc = Gio.Subprocess.new(cmd, Gio.SubprocessFlags.STDOUT_PIPE);

    if (typeof body === "string") proc.communicate(null, null);
    else if (body instanceof GLib.Bytes) proc.communicate(body, null);
    else {
        const stdin = proc.get_stdin_pipe()!;
        let length = 0.1; // 用于进入循环
        while (length > 0) {
            const [l, b] = body.read(null);
            length = l;
            if (l > 0) stdin.write(b, null);
        }
        stdin.close();
    }
}

// TODO: 实现 grim 命令
// Usage: grim [options...] [output-file]

//   -h              Show help message and quit.
//   -s <factor>     Set the output image scale factor. Defaults to the
//                   greatest output scale factor.
//   -g <geometry>   Set the region to capture.
//   -t png|ppm|jpeg Set the output filetype. Defaults to png.
//   -q <quality>    Set the JPEG filetype quality 0-100. Defaults to 80.
//   -l <level>      Set the PNG filetype compression level 0-9. Defaults to 6.
//   -o <output>     Set the output name to capture.
//   -c              Include cursors in the screenshot.
function grim<T extends string | Gio.OutputStream>() {}

type HyprlandOptionType = "custom" | "int";
type HyprlandOptionResultType<T extends HyprlandOptionType> = T extends "custom"
    ? string
    : T extends "int"
    ? number
    : never;
function getHyprloandOption<T>(
    option: string,
    type: HyprlandOptionType
): HyprlandOptionResultType<typeof type> | null {
    const opt: {
        option: string;
        set: boolean;
    } = JSON.parse(exec(["hyprctl", "-j", "getoption", option]));
    if (!opt.set) return null;
    return (opt as any)[type] as HyprlandOptionResultType<typeof type>;
}
const a = getHyprloandOption("s", "int");
export {
    sleep,
    setHoverClassName,
    formatBytes,
    formatDuration,
    slurp,
    slurpRect,
    notifySend,
    rectToString,
    wlCopy,
    getHyprloandOption,
};

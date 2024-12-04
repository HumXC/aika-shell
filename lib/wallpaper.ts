import { GetConfig, MapConfig, SaveConfig } from "../configs";
import { AstalIO, exec, execAsync, interval } from "astal";
import { GObject, register, property, GLib, signal } from "astal/gobject";
import { Gtk } from "astal/gtk3";

type TriggerType = "onTime" | "interval";
type Rule = Partial<{
    outputs: Array<string>;
    trigger: TriggerType;
    intervalMS: number;
    picker: "random" | "forward" | "backward";
    name: string;
    transitions: Array<string>;
    folder: Array<string>;
    priority: number;
}>;
type Transition = Partial<{
    name: string;
    resize: "no" | "crop" | "fit";
    fillColor: string;
    filter: "Nearest" | "Bilinear" | "CatmullRom" | "Mitchell" | "Lanczos3";
    type:
        | "none"
        | "simple"
        | "fade"
        | "left"
        | "right"
        | "top"
        | "bottom"
        | "wipe"
        | "wave"
        | "grow"
        | "center"
        | "any"
        | "outer"
        | "random";
    step: number;
    duration: number;
    fps: number;
    angle: number;
    ops:
        | "center"
        | "top"
        | "left"
        | "right"
        | "bottom"
        | "top-left"
        | "top-right"
        | "bottom-left"
        | "bottom-right";
    invertY: boolean;
    bezier: Array<number>;
    wave: Array<number>;
}>;
function TransitionToArgs(t: Transition): Array<string> {
    const args: Array<string> = [];
    if (t.resize) args.push(`--resize=${t.resize}`);
    if (t.fillColor) args.push(`--fill-color=${t.fillColor}`);
    if (t.filter) args.push(`--filter=${t.filter}`);
    if (t.type) args.push(`--transition-type=${t.type}`);
    if (t.step) args.push(`--transition-step=${t.step}`);
    if (t.duration) args.push(`--transition-duration=${t.duration}`);
    if (t.fps) args.push(`--transition-fps=${t.fps}`);
    if (t.angle) args.push(`--transition-angle=${t.angle}`);
    if (t.ops) args.push(`--transition-ops=${t.ops}`);
    if (t.invertY) args.push(`--invert-y`);
    if (t.bezier) args.push(`--bezier=[${t.bezier.join(",")}]`);
    if (t.wave) args.push(`--wave=[${t.wave.join(",")}]`);
    return args;
}
type Folder = {
    name: string;
    folder: string;
    recursive: boolean;
};
class Config {
    _folders_comment: string = "{name: string, dir:string, recursive:boolean}";
    folders: Array<Folder> = [
        {
            name: "default",
            folder: `${GLib.get_home_dir()}/Pictures/Wallpapers`,
            recursive: true,
        },
    ];
    _transitions_comment: string =
        "{name: string, outputs:Array<string>, resize:string, fillColor:string, filter:string, type:string, step:number, duration:number, fps:number, angle:number, ops:string, invertY:boolean, bezier:Array<number>, wave:Array<number>}";
    transitions: Array<Transition> = [
        {
            name: "default",
            fps: 30,
            step: 120,
            type: "wipe",
            angle: 30,
        },
    ];
    rules: Array<Rule> = [
        {
            trigger: "interval",
            intervalMS: 10000,
            name: "default",
            picker: "random",
            folder: ["default"],
            priority: 0,
        },
    ];
}

class SwwwQuery {
    name: string;
    width: number;
    height: number;
    scale: number;
    displaying: string;
    displayType: string;
    constructor(line: string) {
        const [monitor, scale, displaying] = line.split(", ");
        let [m, size] = monitor.split(": ");
        const [w, h] = size.split("x");
        this.name = m;
        this.width = parseInt(w);
        this.height = parseInt(h);
        this.scale = parseFloat(scale);
        let _;
        [_, this.displaying, this.displayType] = displaying.split(": ");
    }
}

const allowedImage = [
    ".jpeg",
    ".jpg",
    ".png",
    ".gif",
    ".pnm",
    ".ppm",
    ".pgm",
    ".pbm",
    ".tga",
    ".tpic",
    ".tiff",
    ".tif",
    ".webp",
    ".bmp",
    ".ff",
].reduce<Array<string>>((acc, curr, index, arr) => {
    acc.push(...["-iname", "*" + curr]);
    if (index != arr.length - 1) acc.push("-o");
    return acc;
}, []);

const config = GetConfig(Config, "wallpaper");
function listDirs(folders: Array<Folder>): Array<string> {
    const files: Array<string> = [];
    for (const folder of folders) {
        const cmd = ["find"];
        cmd.push(folder.folder);
        if (!folder.recursive) cmd.push("-maxdepth", "1");
        cmd.push("-type", "f");
        cmd.push(...allowedImage);
        const a = exec(cmd).split("\n");
        files.push(...a);
    }
    return files;
}
class Trigger {
    rule: Rule;
    transitions: Array<Transition>;
    transitionIndex: number = 0;
    private timer: AstalIO.Time;
    constructor(wallpaper: Wallpaper, rule: Rule, onTrigger?: (self: Trigger) => void | false) {
        if (!rule.folder || rule.folder?.length === 0)
            throw new Error("Wallpaper rule is invalid, no folders specified");
        this.rule = rule;
        this.transitions = config.transitions.filter((t) => rule.transitions?.includes(t.name!));
        switch (rule.trigger) {
            case "interval":
                if (!rule.intervalMS) throw new Error("Wallpaper rule is invalid interval trigger");
                this.timer = interval(rule.intervalMS, () => {
                    if (onTrigger && onTrigger(this) === false) return;
                    switch (rule.picker) {
                        case "random":
                            const files = listDirs(
                                config.folders.filter((f) => rule.folder!.includes(f.name))
                            );
                            if (files.length === 0) return;
                            const file = files[Math.floor(Math.random() * files.length)];
                            const tr =
                                this.transitions[this.transitionIndex % this.transitions.length];
                            this.transitionIndex++;
                            wallpaper.setWallpaper(file, rule.outputs, tr);
                            break;

                        default:
                            break;
                    }
                });
                break;

            default:
                throw new Error("Wallpaper rule is invalid trigger");
        }
    }
    cancel() {
        this.timer?.cancel();
    }
}
@register()
class Wallpaper extends GObject.Object {
    @property(String) declare rule: string;
    setWallpaper(file: string, monitors?: Array<string>, transition?: Transition) {
        let t = transition || config.transitions.find((t) => t.name === "default");
        let m = monitors?.join(",");
        const cmd = ["swww", "img"];
        if (m) cmd.push(`--outputs=${m}`);
        if (t) cmd.push(...TransitionToArgs(t));
        cmd.push(file);
        execAsync(cmd).catch((e) => console.error(e));
    }
    query(): Array<SwwwQuery> {
        return exec(["swww", "query"])
            .split("\n")
            .map((line) => new SwwwQuery(line));
    }
    get rules(): Array<Rule> {
        return config.rules;
    }

    constructor() {
        super();

        this.connect("notify::rule", () => {
            const rule = config.rules.find((r) => r.name === this.rule);
            if (!rule) throw new Error(`Wallpaper rule ${this.rule} not found`);
            new Trigger(this, rule);
        });
        if (config.folders.length === 0 || config.rules.length === 0) return;
        const defaultRule = config.rules.find((rule) => rule.name === "default");
        if (!(defaultRule?.folder?.length && defaultRule?.folder?.length > 0)) return;
        this.rule = defaultRule.name as string;
    }
}
const defaultWallpaper = new Wallpaper();

function get_default(): Wallpaper {
    return defaultWallpaper;
}
export default {
    get_default,
    Wallpaper: Wallpaper,
};

import { GetConfig } from "../configs";
import { exec, execAsync, interval, timeout } from "astal";
import { GObject, register, GLib } from "astal/gobject";

type TriggerType = "interval" | "once";
type Rule = Partial<{
    outputs: Array<string>;
    trigger: TriggerType;
    intervalMS: number;
    picker: "random" | "forward" | "backward";
    time: string;
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
            name: "example",
            folder: `${GLib.get_home_dir()}/Pictures/Wallpaper`,
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
            folder: ["example"],
            priority: 10,
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

function listDirs(folders: Array<Folder>): Array<string> {
    const files: Array<string> = [];
    for (const folder of folders) {
        const cmd = ["find"];
        cmd.push(folder.folder);
        if (!folder.recursive) cmd.push("-maxdepth", "1");
        cmd.push("-type", "f");
        cmd.push(...allowedImage);
        files.push(...exec(cmd).split("\n"));
    }
    return files;
}
function pickerRandom(
    self: Trigger,
    wallpaper: Wallpaper,
    onTrigger?: (self: Trigger) => void | false
) {
    const config = GetConfig(Config, "wallpaper");
    let transitionIndex = -1;
    return () => {
        if (onTrigger && onTrigger(self) === false) return;
        const files = listDirs(config.folders.filter((f) => self.rule.folder!.includes(f.name)));
        if (files.length === 0) return;
        const file = files[Math.floor(Math.random() * files.length)];
        transitionIndex++;
        transitionIndex %= self.transitions.length;
        const tr = self.transitions[transitionIndex];
        wallpaper.setWallpaper(file, self.rule.outputs, tr);
    };
}
function pickerForward(
    self: Trigger,
    wallpaper: Wallpaper,
    onTrigger?: (self: Trigger) => void | false
) {
    const config = GetConfig(Config, "wallpaper");
    let index = -1;
    let transitionIndex = -1;
    return () => {
        if (onTrigger && onTrigger(self) === false) return;
        const files = listDirs(config.folders.filter((f) => self.rule.folder!.includes(f.name)));
        if (files.length === 0) return;
        index++;
        index %= files.length;
        const file = files[index];
        transitionIndex++;
        transitionIndex %= self.transitions.length;
        const tr = self.transitions[transitionIndex];
        wallpaper.setWallpaper(file, self.rule.outputs, tr);
    };
}

function pickerBackward(
    self: Trigger,
    wallpaper: Wallpaper,
    onTrigger?: (self: Trigger) => void | false
) {
    const config = GetConfig(Config, "wallpaper");
    let index = -1;
    let transitionIndex = -1;
    return () => {
        if (onTrigger && onTrigger(self) === false) return;
        const files = listDirs(config.folders.filter((f) => self.rule.folder!.includes(f.name)));
        if (files.length === 0) return;
        index++;
        index %= files.length;
        const file = files[files.length - 1 - index];
        transitionIndex++;
        transitionIndex %= self.transitions.length;
        const tr = self.transitions[transitionIndex];
        wallpaper.setWallpaper(file, self.rule.outputs, tr);
    };
}
class Trigger {
    activated: boolean = false;
    rule: Rule;
    transitions: Array<Transition>;
    do: () => void;
    private wallpaper: Wallpaper;
    constructor(wallpaper: Wallpaper, rule: Rule, onTrigger?: (self: Trigger) => void | false) {
        if (!rule.folder || rule.folder?.length === 0)
            throw new Error("Wallpaper rule is invalid, no folders specified");
        const config = GetConfig(Config, "wallpaper");
        this.rule = rule;
        this.transitions = config.transitions.filter((t) => rule.transitions?.includes(t.name!));
        this.wallpaper = wallpaper;
        switch (rule.picker) {
            case "random":
                this.do = pickerRandom(this, wallpaper, onTrigger);
                break;
            case "forward":
                this.do = pickerForward(this, wallpaper, onTrigger);
                break;
            case "backward":
                this.do = pickerBackward(this, wallpaper, onTrigger);
                break;
            default:
                throw new Error("Wallpaper rule is invalid trigger");
        }
        switch (rule.trigger) {
            case "interval":
                if (!rule.intervalMS) throw new Error("Wallpaper rule is invalid interval trigger");
                break;
            case "once":
                break;
            default:
                throw new Error("Wallpaper rule is invalid trigger");
        }
        this.setup();
    }
    private setup(nextDay?: boolean) {
        if (this.rule.time && this.rule.time != "") {
            const [start, end] = this.rule.time.split("-");
            const now = new Date();
            const startDate = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate(),
                parseInt(start.split(":")[0]),
                parseInt(start.split(":")[1])
            );
            if (nextDay) startDate.setDate(startDate.getDate() + 1);
            timeout(Math.max(0, startDate.getTime() - now.getTime()), () => {
                this.activate();
            });
            console.log(
                `Wallpaper trigger [${
                    this.rule.name
                }] scheduled to start at ${startDate.toLocaleDateString()}`
            );

            if (end === undefined || end == "") return;
            const endDate = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate(),
                parseInt(end.split(":")[0]),
                parseInt(end.split(":")[1])
            );
            if (nextDay) endDate.setDate(endDate.getDate() + 1);
            timeout(Math.max(0, endDate.getTime() - now.getTime()), () => {
                this.deactivate();
                this.setup(true);
            });
            console.log(
                `Wallpaper trigger [${
                    this.rule.name
                }] scheduled to start at ${startDate.toLocaleDateString()} and end at ${endDate.toLocaleDateString()}`
            );
        } else this.activate();
    }
    private canDo(): boolean {
        return (
            this.wallpaper.triggers.filter((t) => {
                if (
                    !t.rule.priority ||
                    !t.rule.priority ||
                    t.rule.priority === 0 ||
                    this.rule.priority === 0
                )
                    return false;
                return (
                    t.activated &&
                    t.rule.name != this.rule.name &&
                    t.rule.priority! >= this.rule.priority!
                );
            }).length === 0
        );
    }
    activate() {
        if (this.activated) return;
        this.activated = true;
        console.log(`Wallpaper trigger [${this.rule.name}] activated`);
        switch (this.rule.trigger) {
            case "interval":
                interval(this.rule.intervalMS!, () => {
                    if (!this.canDo()) return;
                    this.do();
                });
                break;
            case "once":
                if (this.canDo()) this.do();
                break;
            default:
                break;
        }
    }
    deactivate() {
        if (!this.activated) return;
        this.activated = false;
        console.log(`Wallpaper trigger [${this.rule.name}] deactivated`);
    }
}
@register()
class Wallpaper extends GObject.Object {
    setWallpaper(file: string, monitors?: Array<string>, transition?: Transition) {
        const config = GetConfig(Config, "wallpaper");
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
    get folders(): Array<Folder> {
        const config = GetConfig(Config, "wallpaper");
        return config.folders;
    }
    triggers: Array<Trigger> = [];
    get rules(): Array<Rule> {
        const config = GetConfig(Config, "wallpaper");
        return config.rules;
    }
    defaultRule: Rule;
    constructor() {
        super();
        const config = GetConfig(Config, "wallpaper");
        let defaultRule = config.rules.find((rule) => rule.name === "default");
        if (defaultRule === undefined) {
            if (config.folders.length === 0)
                config.folders.push({
                    name: "example",
                    folder: `${GLib.get_home_dir()}/Pictures/Wallpaper`,
                    recursive: true,
                });
            config.rules.push({
                name: "default",
                trigger: "interval",
                intervalMS: 10000,
                picker: "random",
                folder: ["example"],
                priority: 10,
            });
            defaultRule = config.rules.find((rule) => rule.name === "default")!;
        }
        this.defaultRule = defaultRule;
        for (const rule of config.rules) {
            this.triggers.push(new Trigger(this, rule));
        }
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

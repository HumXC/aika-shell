import { AstalIO, exec, execAsync, GLib, subprocess, timeout } from "astal";
import Config from "../config";
import { formatBytes, formatDuration } from "../utils";
import xfixes from "gi://xfixes?version=4.0";
import { Astal, Gdk, Gtk } from "astal/gtk3";
import GtkLayerShell from "gi://GtkLayerShell?version=0.1";
import cairo from "gi://cairo?version=1.0";
let proc: AstalIO.Process | null = null;
let region: string = "";
let start_time: number = 0;
let file: string = "";
let mask: Gtk.Widget | null = null;

function screenMask(region: string) {
    const [x, y] = region.split(" ")[0].split(",").map(Number);
    const [w, h] = region.split(" ")[1].split("x").map(Number);

    const setup = (self: Astal.Window) => {
        GtkLayerShell.set_margin(self, GtkLayerShell.Edge.TOP, y);
        GtkLayerShell.set_margin(self, GtkLayerShell.Edge.LEFT, x);
        self.input_shape_combine_region(new cairo.Region());
    };
    return (
        <window
            setup={setup}
            anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.LEFT}
            heightRequest={h}
            widthRequest={w}
            exclusivity={Astal.Exclusivity.IGNORE}
            css={`
                background: transparent;
                border: 1px solid white;
            `}
        ></window>
    );
}
class Cfg {
    forder: string = `${GLib.get_home_dir()}/Videos/Recordings`;
    audio: boolean = false;
    file_prefix: string = "Recoder";
    format: string = "mp4";
    framerate: string = "30";
    device: string = "";
    codec: string = "";
    audio_codec: string = "";
}
Config.Get(Cfg, "wf-recorder");
Config.Save();
function StartRecording() {
    try {
        region = exec('slurp -b "#0000008a" -c "#ffffffe8" -d');
    } catch (error) {}
    if (region.length === 0) {
        return "canceled";
    }
    const c = Config.Get(Cfg, "wf-recorder");
    file = `${c.forder}/${c.file_prefix}-${exec("date -u +%Y-%m-%dT%H-%M-%S")}.${c.format}`;
    const make = (v1: string, v2: string) => {
        if (v2.length == 0) {
            return "";
        }
        return v1 + v2;
    };
    const cmd = [
        "wf-recorder",
        "-f",
        file,
        "-g",
        `"${region}"`,
        `${c.audio ? "-a" : ""}`,
        make("--device=", c.device),
        make("--codec=", c.codec),
        make("--audio-codec=", c.audio_codec),
        make("--framerate=", c.framerate),
    ];
    GLib.mkdir(c.forder, 0o755);
    proc = subprocess(cmd);
    start_time = GLib.get_real_time();
    execAsync(["notify-send", "--app-name=Recoder", "Rec.", "--icon=record-screen-symbolic"]);

    mask = screenMask(region);

    return (
        `Starting recording with command: ${cmd.filter((v) => v.length > 0).join(" ")}` +
        `\nIf has error, please check the command and try again.` +
        `\nRecording started: ${file}`
    );
}
function StopRecording() {
    mask?.destroy();
    proc?.signal(15);
    proc = null;
    const duration = formatDuration((GLib.get_real_time() - start_time) / 1000000);
    const size = formatBytes(Number.parseInt(exec("stat -c%s " + file)));
    const resolution = region.split(" ")[1];
    execAsync([
        "notify-send",
        "--app-name=Recoder",
        "Finished.",
        `${duration} | ${size} | ${resolution}`,
        "--icon=record-screen-symbolic",
    ]);
    execAsync(["wl-copy", "-t", "'text/uri-list'", `"file://${file}"`]);
    return `Recording stopped: ${duration} | ${size} | ${resolution}`;
}
export default function Handler(_: string) {
    if (proc) return StopRecording();
    return StartRecording();
}

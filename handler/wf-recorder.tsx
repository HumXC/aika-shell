import { AstalIO, exec, execAsync, GLib, subprocess, timeout } from "astal";
import Config from "../config";
import { formatBytes, formatDuration, slurp, SlurpConfig } from "../utils";
import { Astal, Gdk, Gtk } from "astal/gtk3";
import GtkLayerShell from "gi://GtkLayerShell?version=0.1";
import cairo from "gi://cairo?version=1.0";
let proc: AstalIO.Process | null = null;
let region: string | null = null;
let start_time: number = 0;
let file: string = "";
let mask: Gtk.Widget | null = null;

function screenMask(region: string) {
    const [x, y] = region.split(" ")[0].split(",").map(Number);
    const [w, h] = region.split(" ")[1].split("x").map(Number);
    const slurpCfg = Config.Get(SlurpConfig, "slurp");
    const setup = (self: Astal.Window) => {
        GtkLayerShell.set_margin(self, GtkLayerShell.Edge.TOP, y - slurpCfg.borderWeight);
        GtkLayerShell.set_margin(self, GtkLayerShell.Edge.LEFT, x - slurpCfg.borderWeight);
        self.input_shape_combine_region(new cairo.Region());
    };
    return (
        <window
            setup={setup}
            anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.LEFT}
            exclusivity={Astal.Exclusivity.IGNORE}
            css={`
                background: transparent;
                border: ${slurpCfg.borderWeight}px solid white;
            `}
        >
            <box
                heightRequest={h + slurpCfg.borderWeight * 2}
                widthRequest={w + slurpCfg.borderWeight * 2}
            />
        </window>
    );
}
class Cfg {
    forder: string = `${GLib.get_home_dir()}/Videos/Recordings`;
    audio: boolean = false;
    filePrefix: string = "Recoder";
    format: string = "mp4";
    framerate: string = "30";
    device: string = "";
    codec: string = "";
    codecParam: string = "";
    audioCodec: string = "";
}
function StartRecording() {
    const [region_, err] = slurp();
    if (err) {
        return "Failed to get screen region: " + err;
    }

    region = region_;
    const c = Config.Get(Cfg, "wf-recorder");
    file = `${c.forder}/${c.filePrefix}-${exec("date -u +%Y-%m-%dT%H-%M-%S")}.${c.format}`;
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
        `${region}`,
        `${c.audio ? "-a" : ""}`,
        make("--device=", c.device),
        make("--codec=", c.codec),
        make("--audio-codec=", c.audioCodec),
        make("--framerate=", c.framerate),
        make("--codec-param=", c.codecParam),
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
    try {
        const duration = formatDuration((GLib.get_real_time() - start_time) / 1000000);
        const size = formatBytes(Number.parseInt(exec("stat -c%s " + file)));
        execAsync([
            "notify-send",
            "--app-name=Recoder",
            "Finished.",
            `${duration} | ${size}`,
            "--icon=record-screen-symbolic",
        ]);
        execAsync(["wl-copy", "-t", "text/uri-list", `file://${file}`]);
        return `Recording stopped: ${duration} | ${size}`;
    } catch (e) {
        return "Failed to stop recording: " + e;
    }
}
export default function Handler(_: string) {
    if (proc) return StopRecording();
    return StartRecording();
}

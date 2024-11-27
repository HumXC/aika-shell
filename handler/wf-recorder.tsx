import { exec, execAsync, Gio, GLib } from "astal";
import { Slurp, WFRecorder } from "../configs";
import { formatBytes, formatDuration, slurp } from "../utils";
import { Gdk, Gtk } from "astal/gtk3";
import ScreenMask from "../widget/base/screen-region-mask";
let proc: Gio.Subprocess | null = null;
let region: string | null = null;
let start_time: number = 0;
let file: string = "";
let mask: Gtk.Widget | null = null;

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
    const c = WFRecorder;
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
    proc = Gio.Subprocess.new(cmd, Gio.SubprocessFlags.NONE);
    proc.wait_async(null, (p) => {
        print("你妈exit-status", p?.get_exit_status());
    });

    start_time = GLib.get_real_time();
    execAsync(["notify-send", "--app-name=Recoder", "Rec.", "--icon=record-screen-symbolic"]);
    const [x, y] = region.split(" ")[0].split(",").map(Number);
    const [width, height] = region.split(" ")[1].split("x").map(Number);

    mask = ScreenMask(
        new Gdk.Rectangle({
            x,
            y,
            width,
            height,
        }),
        Slurp.borderWeight,
        "solid",
        Slurp.borderColor
    );
    return (
        `Starting recording with command: ${cmd.filter((v) => v.length > 0).join(" ")}` +
        `\nIf has error, please check the command and try again.` +
        `\nRecording started: ${file}`
    );
}
function StopRecording() {
    if (!proc) return "No recording is running.";
    mask?.destroy();
    proc.send_signal(15);
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

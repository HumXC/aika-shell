import { exec, Gio } from "astal";
import { GObject, register, property, GLib, signal } from "astal/gobject";
import { Gdk, Gtk } from "astal/gtk3";
import { rectToString } from "../utils";
import { WFRecorder as c } from "../configs";
import ScreenMask from "../widget/base/screen-region-mask";

@register()
class WFRecorder extends GObject.Object {
    @property(Boolean) declare isRecording: boolean;
    @property(Boolean) declare useMask: boolean;
    @property(Number) declare startTime: number;
    @signal(String, Number, Object) declare finished: (
        filename: string,
        duration: number,
        error: Error | null
    ) => void;
    @signal(String, Number) declare started: (filename: string, startTime: number) => void;
    private _file: string = "";
    private _region: Gdk.Rectangle | null = null;
    get file() {
        return this._file;
    }
    get region(): Gdk.Rectangle | null {
        return this._region;
    }
    @property(Number) declare duration: number;
    private proc: Gio.Subprocess | null = null;
    private mask: Gtk.Widget | null = null;
    constructor() {
        super();
        this.useMask = true;
        this.connect("notify::use-mask", () => {
            if (this.useMask && this._region) {
                this.mask = ScreenMask(this._region, c.borderWeight, c.borderStyle, c.borderColor);
            } else {
                this.mask?.destroy();
                this.mask = null;
            }
        });
    }
    start(region: Gdk.Rectangle | null, onError?: (error: Error) => void): void {
        this._region = region;
        this._file = `${c.forder}/${c.filePrefix}-${exec("date -u +%Y-%m-%dT%H-%M-%S")}.${
            c.format
        }`;
        const make = (v1: string, v2: string) => {
            if (v2.length == 0) {
                return "";
            }
            return v1 + v2;
        };
        const cmd = [
            "wf-recorder",
            "-f",
            this._file,
            `${region ? "--geometry=" + rectToString(region) : ""}`,
            `${c.audio ? "-a" : ""}`,
            make("--device=", c.device),
            make("--codec=", c.codec),
            make("--audio-codec=", c.audioCodec),
            make("--framerate=", c.framerate),
            make("--codec-param=", c.codecParam),
        ];
        GLib.mkdir(c.forder, 0o755);
        this.proc = Gio.Subprocess.new(cmd, Gio.SubprocessFlags.NONE);

        this.startTime = GLib.get_real_time();
        this.started(this._file, this.startTime);
        this.isRecording = true;
        if (this.useMask && this._region) {
            this.mask = ScreenMask(this._region, c.borderWeight, c.borderStyle, c.borderColor);
        }
        GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, (): boolean => {
            if (!this.isRecording) return false;
            this.duration = (GLib.get_real_time() - this.startTime) / 1000000;
            return true;
        });
        this.proc.wait_async(null, (p) => {
            if (p?.get_exit_status() === 0) {
                return;
            }
            const [status, output, _] = p!.get_stderr_pipe()!.read_all(null);
            if (status) return;
            const error = new Error(output.toString());
            onError?.(error);
            this._stop(error);
        });
    }
    private _stop(error: Error | null) {
        this.mask?.destroy();
        this.mask = null;
        this.proc?.send_signal(15);
        this.proc = null;
        this.isRecording = false;
        this.finished(this._file, this.duration, error);
    }
    stop() {
        this._stop(null);
    }
}
const defaultWFRecorder = new WFRecorder();

function get_default(): WFRecorder {
    return defaultWFRecorder;
}
export default {
    get_default,
    WFRecorder: WFRecorder,
};

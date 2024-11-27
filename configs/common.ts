import { GLib } from "astal";

export class WFRecorder {
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

export class Slurp {
    dimensions: boolean = false;
    backgroundColor: string = "#0000005a";
    borderColor: string = "#ffffffe8";
    selectionColor: string = "";
    optionBoxColor: string = "";
    fontFamily: string = "";
    borderWeight: number = 2;
}

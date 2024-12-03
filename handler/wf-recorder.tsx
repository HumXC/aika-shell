import { exec } from "astal";
import { formatBytes, notifySend, slurpRect, wlCopy } from "../utils";

import WFRecorder from "../lib/wf-recorder";

function StartRecording() {
    const wf = WFRecorder.get_default();
    let [rect, err] = slurpRect();
    if (err) {
        return err;
    }

    wf.start(rect, (err) => {
        if (!err) return;
        notifySend("Error while starting recording", err.message);
    });
    notifySend("Recording started", `${rect.x},${rect.y} ${rect.width}x${rect.height}`, {
        icon: "record-screen-symbolic",
        appName: "Recoder",
    });
    return "Recording started: " + wf.file;
}
function StopRecording() {
    const wf = WFRecorder.get_default();
    wf.stop();
    const size = formatBytes(Number.parseInt(exec("stat -c%s " + wf.file))).join(" ") + "B";
    notifySend("Recording finished.", `${wf.duration} | ${size}`, {
        icon: "record-screen-symbolic",
        appName: "Recoder",
    });
    wlCopy("file://" + wf.file, "text/uri-list");
    return "Recording stopped: " + wf.file + " (" + size + ")";
}
export default function Handler(_: string) {
    const wf = WFRecorder.get_default();
    if (wf.isRecording) return StopRecording();
    return StartRecording();
}

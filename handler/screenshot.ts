import { exec } from "astal";
import { slurp } from "../utils";

export default function Handler(request: string) {
    const req = request.split(" ").filter((s) => s.length > 0);
    let args = [];
    let cmd = "";
    for (let i = 1; i < req.length; i++) {
        const c = req[i];
        if (c === "-g") return "Invalid argument: -g is not disaible in screenshot mode.";
        if (["-s", "-t", "-q", "-l", "-o"].indexOf(c) != -1) {
            i++;
            args.push(c);
            args.push(req[i]);
            continue;
        } else if (c === "-c") {
            args.push(c);
            continue;
        }
        cmd = req.slice(i).join(" ");
        break;
    }

    const [region, err] = slurp();
    if (err) {
        return "Failed to get screen region: " + err;
    }

    try {
        exec(["bash", "-c", `grim -g "${region}" ${args.join(" ")} ${cmd}`]);
    } catch (error) {
        return (error as Error).message;
    }
    return "";
}

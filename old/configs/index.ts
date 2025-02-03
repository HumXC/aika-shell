import { Slurp as SlurpConfig, WFRecorder as WFRecorderConfig } from "./common";
import config from "./config";
export const GetConfig = config.Get;
export const SaveConfig = config.Save;
export * from "./config";

export function Slurp() {
    return config.Get(SlurpConfig, "slurp");
}
export function WFRecorder() {
    return config.Get(WFRecorderConfig, "wf-recorder");
}

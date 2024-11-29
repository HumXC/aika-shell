import { Slurp as SlurpConfig, WFRecorder as WFRecorderConfig } from "./common";
import config from "./config";
export const GetConfig = config.Get;
export const SaveConfig = config.Save;
export * from "./config";
export const Slurp = config.Get(SlurpConfig, "slurp");
export const WFRecorder = config.Get(WFRecorderConfig, "wf-recorder");
export default {
    GetConfig: config.Get,
    SaveConfig: config.Save,
    Slurp: Slurp,
    WFRecorder: WFRecorder,
};

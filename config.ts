import { GLib, readFile, writeFile, writeFileAsync } from "astal";
import { App } from "astal/gtk3";

const file = `${GLib.get_user_config_dir()}/ags/config.json`;
function Load() {
    try {
        return JSON.parse(readFile(file));
    } catch (e) {
        console.error(e);
        return {};
    }
}
export const Data: any = Load();
export function Save() {
    writeFileAsync(file, JSON.stringify(Data, null, 4)).catch((e) => console.error(e));
}
export function Get<T>(type: { new (): T }, key: string): T {
    if (!Data.hasOwnProperty(key)) {
        Data[key] = new type();
    }
    const newValue = new type() as any;
    if ("fromJSON" in newValue && typeof newValue.fromJSON === "function") {
        newValue.fromJSON(Data[key]);
    }
    Data[key] = { ...newValue, ...Data[key] };
    return Data[key];
}

export default {
    Data,
    Save,
    Get,
};

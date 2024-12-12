import { GLib, readFile, writeFileAsync } from "astal";
const file = `${GLib.get_user_config_dir()}/ags/config.json`;
function Load() {
    try {
        return JSON.parse(readFile(file));
    } catch (e) {
        console.error(e);
        return {};
    }
}
const Data: any = Load();
function Save() {
    writeFileAsync(file, JSON.stringify(Data, null, 4)).catch((e) => console.error(e));
}
function Get<T>(type: { new (): T }, key: string): T {
    if (!Data.hasOwnProperty(key)) {
        const newValue = new type() as any;
        Data[key] = newValue;
        Save();
    }
    return Data[key];
}
function GetAny(key: string): any {
    class AnyClass {}
    return Get(AnyClass, key);
}

export default {
    Data,
    Save,
    Get,
    GetAny,
};

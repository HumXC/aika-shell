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
        Data[key] = new type();
        Save();
    }
    const newValue = new type() as any;
    if ("fromJSON" in newValue && typeof newValue.fromJSON === "function") {
        newValue.fromJSON(Data[key]);
        Data[key] = newValue;
    } else {
        Data[key] = { ...newValue, ...Data[key] };
    }
    return Data[key];
}
function GetAny(key: string): any {
    class AnyClass {}
    return Get(AnyClass, key);
}
class MapConfig<T> extends Map<string, T> {
    toJSON() {
        let obj: any = {};
        for (let [key, value] of this) {
            obj[key] = value;
        }
        return obj;
    }
    fromJSON(obj: any) {
        for (let key in obj) {
            this.set(key, obj[key]);
        }
    }
}
export default {
    Data,
    Save,
    Get,
    GetAny,
    MapConfig,
};

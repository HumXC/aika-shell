import { GLib, readFile, writeFileAsync } from "astal";
const file = `${GLib.get_user_config_dir()}/ags/config.json`;
const ready = new Map<string, null>();
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
        if ("default" in newValue) {
            Data[key] = newValue.default;
        } else {
            Data[key] = newValue;
        }
        Save();
    }

    if (ready.has(key)) {
        return Data[key];
    }
    const newValue = new type() as any;
    if ("fromJSON" in newValue && typeof newValue.fromJSON === "function") {
        newValue.fromJSON(Data[key]);
        Data[key] = newValue;
    } else {
        Data[key] = { ...newValue, ...Data[key] };
    }
    ready.set(key, null);
    return Data[key];
}
function GetAny(key: string): any {
    class AnyClass {}
    return Get(AnyClass, key);
}
// TODO: Remove this
export class MapConfig<T> extends Map<string, T> {
    constructor(defaultValue?: { [key: string]: T }) {
        super();
        if (!defaultValue) return;
        for (let key in defaultValue) {
            this.set(key, defaultValue[key]);
        }
    }
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
// TODO: Remove this
export class ArrayConfig<T> extends Array<T> {
    fromJSON(arr: any) {
        for (let item of arr) {
            this.push(item);
        }
    }
    default: Array<T> = [];
}

export default {
    Data,
    Save,
    Get,
    GetAny,
    MapConfig,
    ArrayConfig,
};

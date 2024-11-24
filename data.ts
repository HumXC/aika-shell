import { GLib, readFile, writeFile, writeFileAsync } from "astal";

const file = `${GLib.get_user_data_dir()}/.ags.json`;
function Parse() {
    try {
        return JSON.parse(readFile(file));
    } catch (e) {
        console.error(e);
        return {};
    }
}
export const Data: any = Parse();
export function SaveData() {
    writeFileAsync(JSON.stringify(Data), file).catch((e) => console.error(e));
}

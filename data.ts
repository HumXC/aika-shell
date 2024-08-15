const file = `${Utils.HOME}/.ags.json`;
function Parse() {
    try {
        return JSON.parse(Utils.readFile(file));
    } catch (e) {
        console.error(e);
        return {};
    }
}
export const Data: any = Parse();
export function SaveData() {
    Utils.writeFile(JSON.stringify(Data), file).catch((e) => console.error(e));
}

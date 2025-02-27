import { bind } from "astal";
import { Gtk, hook } from "astal/gtk4";
import AstalTray from "gi://AstalTray";
function makeItem(item: AstalTray.TrayItem): Gtk.Widget {
    return (
        <box>
            <image iconName={item.iconName} />
        </box>
    );
}
export default function Tray() {
    const tray = AstalTray.get_default();
    tray.items;
    return <box>{bind(tray, "items").as((items) => items.map((item) => makeItem(item)))}</box>;
}

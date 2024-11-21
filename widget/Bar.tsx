import { App, Astal, Gtk, Gdk } from "astal/gtk3";
import { bind, Variable } from "astal";
import Tray from "./Tray";
import Clock from "./Clock";
import NetSpeed from "./NetSpeed";
import Space from "./Space";
import Icon from "./Icon";
export default function Bar(gdkmonitor: Gdk.Monitor) {
    return (
        <window
            className="Bar"
            gdkmonitor={gdkmonitor}
            exclusivity={Astal.Exclusivity.EXCLUSIVE}
            anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.LEFT | Astal.WindowAnchor.RIGHT}
            application={App}
            namespace={"top-bar"}
        >
            <centerbox heightRequest={1}>
                <box halign={Gtk.Align.START}>
                    <Icon name="nix-snowflake-colours" size={24} />
                    <Space space={8} />
                    <Tray height={24} />
                    <Space space={10} />
                    <NetSpeed height={24} />
                </box>
                <box halign={Gtk.Align.CENTER}>
                    <Clock fontSize={16} />
                </box>
                <box halign={Gtk.Align.END}></box>
            </centerbox>
        </window>
    );
}

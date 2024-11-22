import { App, Astal, Gtk, Gdk } from "astal/gtk3";
import Tray from "../Tray";
import Clock from "./Clock";
import NetSpeed from "../NetSpeed";
import { EventIcon, Space } from "../base";
import DevicesIcon from "../DevicesIcon";
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
                    <EventIcon iconName="nix-snowflake-colours" size={24} />
                    <Space space={8} />
                    <Tray height={24} />
                    <Space space={10} />
                    <NetSpeed height={24} />
                </box>
                <box halign={Gtk.Align.CENTER}>
                    <Clock fontSize={16} />
                </box>
                <box halign={Gtk.Align.END}>
                    <DevicesIcon size={24} />
                </box>
            </centerbox>
        </window>
    );
}

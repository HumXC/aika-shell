import { App, Astal, Gtk, Gdk } from "astal/gtk3";
import Tray from "./tray";
import Clock from "./clock";
import NetSpeed from "./net-speed";
import { EventIcon, Space } from "../base";
import StatusIndicators from "./status-indicators";
export default function Bar(gdkmonitor: Gdk.Monitor) {
    return (
        <window
            className="Bar"
            gdkmonitor={gdkmonitor}
            exclusivity={Astal.Exclusivity.EXCLUSIVE}
            anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.LEFT | Astal.WindowAnchor.RIGHT}
            application={App}
            namespace={"top-bar"}
            keymode={Astal.Keymode.ON_DEMAND}
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
                    <StatusIndicators size={24} />
                </box>
            </centerbox>
        </window>
    );
}

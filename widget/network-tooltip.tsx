import { Astal, Gtk } from "astal/gtk3";
import PopupWindow from "./base/popup-window";
import { Variable } from "astal";
import Network from "gi://AstalNetwork";
import NetworkIcon from "./network-icon";
import { Space } from "./base";

export default function NetworkTooltip({
    forward,
    trigger,
    onHover = () => {},
    onHoverLost = () => {},
}: {
    forward: "bottom" | "top" | "left" | "right";
    trigger: Gtk.Widget;
    onHover?: (self: Astal.Window, event: Astal.HoverEvent) => void;
    onHoverLost?: (self: Astal.Window, event: Astal.HoverEvent) => void;
}) {
    const network = Network.get_default();
    const iconName = Variable("network-disconnected-symbolic");
    const netName = Variable("");
    const ipInterface = Variable("");
    const speed = Variable("");
    const setIcon = () => {
        switch (network.primary) {
            case Network.Primary.WIFI:
                iconName.set(network.wifi.get_icon_name());
                break;
            case Network.Primary.WIRED:
                iconName.set(network.wired.get_icon_name());
                break;
            default:
                iconName.set("network-disconnected-symbolic");
                break;
        }
    };
    const setLabel = () => {
        switch (network.primary) {
            case Network.Primary.WIFI:
                if (
                    network.wifi.device.ipInterface === null ||
                    network.wifi.activeAccessPoint.frequency === null
                )
                    return;
                netName.set(network.wifi.ssid);
                ipInterface.set(network.wifi.device.ipInterface);
                speed.set(network.wifi.activeAccessPoint.frequency.toString() + "MHz");
                break;
            case Network.Primary.WIRED:
                if (
                    network.wired.device.ipInterface === null ||
                    network.wired.device.speed === null
                )
                    return;
                netName.set("Wired");
                ipInterface.set(network.wired.device.ipInterface);
                speed.set(network.wired.device.speed.toString() + "Mbps");
                break;
            default:
                netName.set("Disconnected");
                ipInterface.set("");
                speed.set("");
                break;
        }
    };
    network.connect("notify", () => {
        setIcon();
        setLabel();
    });
    setIcon();
    setLabel();
    return (
        <PopupWindow forward={forward} trigger={trigger}>
            <eventbox
                onHover={(self, e) => onHover(self.parent as Astal.Window, e)}
                onHoverLost={(self, e) => onHoverLost(self.parent as Astal.Window, e)}
            >
                <box
                    className={"NetworkTooltip"}
                    spacing={6}
                    css={`
                        padding: 10px;
                    `}
                >
                    <box valign={Gtk.Align.START}>
                        <NetworkIcon size={38} onlyIcon={true} padding={0} />
                    </box>
                    <box vertical={true} spacing={2} css={"padding: 3px 0 0 0;"}>
                        <box valign={Gtk.Align.CENTER} vexpand={true}>
                            <label
                                halign={Gtk.Align.START}
                                className={"NetworkName"}
                                label={netName()}
                                css={`
                                    font-size: 14px;
                                `}
                            />
                            <Space space={4} />
                            <label
                                halign={Gtk.Align.START}
                                className={"NetworkInterface"}
                                label={ipInterface()}
                                css={`
                                    font-size: 12px;
                                    color: #888;
                                `}
                            />
                        </box>
                        <label
                            visible={speed().as((s) => (s === "" ? false : true))}
                            className={"NetworkSpeed"}
                            halign={Gtk.Align.START}
                            label={speed()}
                            css={`
                                font-size: 12px;
                            `}
                        />
                    </box>
                </box>
            </eventbox>
        </PopupWindow>
    ) as Astal.Window;
}

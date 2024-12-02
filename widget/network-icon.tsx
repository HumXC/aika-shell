import { Variable } from "astal";
import Network from "gi://AstalNetwork";
import { EventIcon } from "./base";
import { setHoverClassName } from "../utils";
import { Gtk } from "astal/gtk3";
// padding1 是 断网图标的边距
// padding2 是 联网图标的边距
export default function NetworkIcon({ size, padding = 1 }: { size: number; padding?: number }) {
    const network = Network.get_default();
    const iconName = Variable("network-disconnected-symbolic");
    const getIcon = () => {
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
    network.connect("notify", () => getIcon());
    getIcon();
    return (
        <box
            css={`
                padding: 3px ${padding}px 0 ${padding}px;
            `}
            halign={Gtk.Align.CENTER}
            valign={Gtk.Align.CENTER}
        >
            <EventIcon
                halign={Gtk.Align.CENTER}
                valign={Gtk.Align.CENTER}
                useCssColor={false}
                iconSize={64}
                iconName={iconName()}
                size={size - padding * 2}
                padding={0}
                setup={(self) => setHoverClassName(self, "Icon")}
            />
        </box>
    );
}

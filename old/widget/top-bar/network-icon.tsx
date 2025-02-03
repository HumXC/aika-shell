import { Variable } from "astal";
import Network from "gi://AstalNetwork";
import { EventIcon } from "../base";
import { setHoverClassName } from "../../utils";
import { Gtk } from "astal/gtk3";
import NetworkTooltip from "./network-tooltip";
import { SetupTooltip } from "../tooltip";

export default function NetworkIcon({
    size,
    padding = 1,
    onlyIcon = false,
    currentPopup = null,
    iconSize = 64,
}: {
    size: number;
    padding?: number;
    onlyIcon?: boolean;
    currentPopup?: Variable<string> | null;
    iconSize?: 64 | 16 | 22 | 24 | 32 | 256;
}) {
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
                padding: ${iconName.get() === "network-wired-symbolic" ? 3 : 0}px ${padding}px 0
                    ${padding}px;
            `}
            halign={Gtk.Align.CENTER}
            valign={Gtk.Align.CENTER}
        >
            <EventIcon
                halign={Gtk.Align.CENTER}
                valign={Gtk.Align.CENTER}
                useCssColor={false}
                iconSize={iconSize}
                iconName={iconName()}
                size={size - padding * 2}
                padding={0}
                setup={(self) => {
                    setHoverClassName(self, "Icon");
                    if (onlyIcon) return;
                    SetupTooltip(
                        self,
                        NetworkTooltip,
                        "network-tooltip",
                        "bottom",
                        currentPopup,
                        600
                    );
                }}
            />
        </box>
    );
}

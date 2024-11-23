import { Variable } from "astal";
import Network from "gi://AstalNetwork";
import { EventIcon } from "./base";
import { setHoverClassName } from "../utils";
// padding1 是 断网图标的边距
// padding2 是 联网图标的边距
export default function NetworkIcon({
    size,
    padding1,
    padding2,
}: {
    size: number;
    padding1: number;
    padding2: number;
}) {
    const network = Network.get_default();
    const getIcon = () => {
        const iconName = new Variable("network-disconnected-symbolic");
        switch (network.primary) {
            case Network.Primary.WIFI:
                iconName.set(network.wifi.get_icon_name());
                break;
            case Network.Primary.WIRED:
                iconName.set(network.wired.get_icon_name());
                break;
            default:
                return (
                    <EventIcon
                        setup={(self) => setHoverClassName(self, "Icon")}
                        iconName={iconName()}
                        size={size}
                        padding={padding1}
                    />
                );
        }
        return (
            <EventIcon
                setup={(self) => setHoverClassName(self, "Icon")}
                iconName={iconName()}
                size={size}
                padding={padding2}
            />
        );
    };
    return (
        <box
            setup={(self) => {
                self.set_child(getIcon());
                self.hook(network, "notify", (self) => {
                    self.get_child().destroy();
                    self.set_child(getIcon());
                });
            }}
        />
    );
}

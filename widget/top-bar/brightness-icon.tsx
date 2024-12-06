import { bind, Variable } from "astal";
import DDCBrightness from "../../lib/ddc-brightness";
import { EventIcon } from "../base";
import { setHoverClassName } from "../../utils";
import { GetConfig, SaveConfig, MapConfig } from "../../configs";
import BrightnessTooltip from "./brightness-tooltip";
import { SetupTooltip } from "../tooltip";
import Hyprland from "gi://AstalHyprland?version=0.1";
export default function BrightnessIcon({
    size,
    padding = 1,
    onlyIcon = false,
    currentPopup = null,
}: {
    size: number;
    padding?: number;
    onlyIcon?: boolean;
    currentPopup?: Variable<string> | null;
}) {
    const hypr = Hyprland.get_default();
    hypr.monitors[0].get_id();
    const ddc = DDCBrightness.get_monitor(1);
    const config = GetConfig(MapConfig<number>, "brightness");
    if (!config.has(ddc.monitorID.toString())) config.set(ddc.monitorID.toString(), ddc.light);
    if (!onlyIcon) ddc.light = config.get(ddc.monitorID.toString())!;

    return (
        <EventIcon
            useCssColor={false}
            iconSize={64}
            setup={(self) => {
                setHoverClassName(self, "Icon");
                self.hook(ddc, "brightness-changed", (self, val: number) => {
                    config.set(ddc.monitorID.toString(), val);
                    SaveConfig();
                });
                if (onlyIcon) return;
                SetupTooltip(self, BrightnessTooltip, "brightness-tooltip", "bottom", currentPopup);
            }}
            iconName={bind(ddc, "iconName")}
            size={size}
            padding={padding}
            onScroll={(self, e) => {
                ddc.light += e.delta_y > 0 ? -5 : 5;
            }}
        />
    );
}

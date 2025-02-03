import { bind, Variable } from "astal";
import DDCBrightness, { Monitor } from "../../lib/ddc-brightness";
import { EventIcon } from "../base";
import { setHoverClassName } from "../../utils";
import BrightnessTooltip from "./brightness-tooltip";
import { SetupPopup, SetupTooltip } from "../tooltip";
import BrightnessPopup from "./brightness-popup";

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
    const ddc = DDCBrightness.get_default();
    let monitor: Monitor;
    const iconName = Variable("display-brightness-high-symbolic");
    return (
        <EventIcon
            useCssColor={false}
            iconSize={64}
            setup={(self) => {
                monitor = ddc.monitors[self.get_display().get_n_monitors() - 1];
                self.hook(bind(monitor, "iconName"), (_, icon) => {
                    iconName.set(icon);
                });
                setHoverClassName(self, "Icon");
                if (onlyIcon) return;
                SetupTooltip(
                    self,
                    BrightnessTooltip,
                    "brightness-tooltip",
                    "bottom",
                    currentPopup,
                    600
                );
                SetupPopup(self, BrightnessPopup, "brightness-popup", "bottom", currentPopup);
            }}
            iconName={bind(iconName)}
            size={size}
            padding={padding}
            onScroll={(self, e) => {
                monitor!.brightness += e.delta_y > 0 ? -5 : 5;
            }}
        />
    );
}

import { AstalIO, bind, timeout, Variable } from "astal";
import DDCBrightness from "../lib/ddc-brightness";
import { EventIcon } from "./base";
import { setHoverClassName } from "../utils";
import { GetConfig, SaveConfig, MapConfig } from "../configs";
import { Astal, Gtk } from "astal/gtk3";
import BrightnessTooltip from "./brightness-tooltip";

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
    const popupName = "brightness-tooltip";
    const ddc = DDCBrightness.get_monitor(1);
    const config = GetConfig(MapConfig<number>, "brightness");
    if (!config.has(ddc.monitorID.toString())) config.set(ddc.monitorID.toString(), ddc.light);
    if (!onlyIcon) ddc.light = config.get(ddc.monitorID.toString())!;

    let popup: Astal.Window | null = null;
    let closeTimer: AstalIO.Time | null = null;
    const closePopup = () => {
        if (popup === null) return;
        if (closeTimer) closeTimer.cancel();
        closeTimer = timeout(500, () => {
            if (onHover) return;
            popup?.close();
            popup = null;
        });
    };
    const makePopup = (t: Gtk.Widget) => {
        if (currentPopup) currentPopup.set(popupName);
        return BrightnessTooltip({
            forward: "bottom",
            trigger: t,
            onHover: () => (onHover = true),
            onHoverLost: () => {
                onHover = false;
                closePopup();
            },
        });
    };
    let onHover = false;
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
                self.connect("hover", () => {
                    onHover = true;
                    if (!popup) popup = makePopup(self);
                });
                self.connect("hover-lost", () => {
                    onHover = false;
                    closePopup();
                });
                if (currentPopup) {
                    self.hook(bind(currentPopup), () => {
                        popup?.close();
                        popup = null;
                    });
                }
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

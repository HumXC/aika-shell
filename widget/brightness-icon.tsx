import { bind } from "astal";
import DDCBrightness from "../lib/ddc-brightness";
import { EventIcon } from "./base";
import { setHoverClassName } from "../utils";
import { GetConfig, SaveConfig, MapConfig } from "../configs";

export default function BrightnessIcon({ size }: { size: number }) {
    const ddc = DDCBrightness.get_monitor(1);
    const config = GetConfig(MapConfig<number>, "brightness");
    if (!config.has(ddc.monitorID.toString())) config.set(ddc.monitorID.toString(), ddc.light);
    ddc.light = config.get(ddc.monitorID.toString())!;
    return (
        <EventIcon
            setup={(self) => {
                setHoverClassName(self, "Icon");
                self.hook(ddc, "brightness-changed", (self, val: number) => {
                    config.set(ddc.monitorID.toString(), val);
                    SaveConfig();
                });
            }}
            iconName={bind(ddc, "iconName")}
            size={size}
            onScroll={(self, e) => {
                ddc.light += e.delta_y > 0 ? -5 : 5;
            }}
            tooltipText={bind(ddc, "light").as((l) => `${l}%`)}
        />
    );
}

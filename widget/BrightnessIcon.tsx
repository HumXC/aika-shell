import { bind } from "astal";
import DDCBrightness from "../lib/DDCBrightness";
import { EventIcon } from "./base";
import { Astal } from "astal/gtk3";
import { setHoverClassName } from "../utils";
export default function BrightnessIcon({ size }: { size: number }) {
    const ddc = new DDCBrightness();
    return (
        <EventIcon
            setup={(self) => setHoverClassName(self, "Icon")}
            iconName={bind(ddc, "iconName")}
            size={size}
            onScroll={(self, e) => {
                ddc.light += e.delta_y > 0 ? -10 : 10;
            }}
            tooltipText={bind(ddc, "light").as((l) => `${l}%`)}
        />
    );
}

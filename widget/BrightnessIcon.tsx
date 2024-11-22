import { bind } from "astal";
import DDCBrightness from "../lib/DDCBrightness";
import EventIcon from "./EventIcon";
import { Astal } from "astal/gtk3";
export default function BrightnessIcon({ size }: { size: number }) {
    const ddc = new DDCBrightness();
    return (
        <EventIcon
            iconName={bind(ddc, "iconName")}
            size={size}
            onScroll={(self, e) => {
                ddc.light -= e.delta_y;
            }}
            tooltipText={bind(ddc, "light").as((l) => `${l}%`)}
            onClick={(self, e) => {
                if (e.button === Astal.MouseButton.PRIMARY) {
                    ddc.light += 20;
                } else if (e.button === Astal.MouseButton.SECONDARY) {
                    ddc.light -= 20;
                }
            }}
        />
    );
}

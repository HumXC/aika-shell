import { bind } from "astal";
import DDCBrightness from "../lib/ddc-brightness";
import { EventIcon } from "./base";
import { Astal } from "astal/gtk3";
import { setHoverClassName } from "../utils";
import Config from "../config";
class Cfg {
    brightness: Map<number, number> = new Map();

    toJSON() {
        let obj: any = {};
        for (let [key, value] of this.brightness) {
            obj[key] = value;
        }
        return obj;
    }
    fromJSON(obj: any) {
        for (let key in obj) {
            this.brightness.set(parseInt(key), obj[key]);
        }
    }
}
export default function BrightnessIcon({ size }: { size: number }) {
    const ddc = DDCBrightness.get_monitor(1);
    const config = Config.Get(Cfg, "brightness");
    if (!config.brightness.has(ddc.monitorID)) config.brightness.set(ddc.monitorID, ddc.light);
    ddc.light = config.brightness.get(ddc.monitorID)!;
    return (
        <EventIcon
            setup={(self) => {
                setHoverClassName(self, "Icon");
                self.hook(ddc, "brightness-changed", (self, val: number) => {
                    config.brightness.set(ddc.monitorID, val);
                    Config.Save();
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

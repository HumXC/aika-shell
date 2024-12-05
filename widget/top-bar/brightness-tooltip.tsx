import { Astal, Gdk, Gtk } from "astal/gtk3";
import PopupWindow from "../base/popup-window";
import { bind } from "astal";
import BrightnessIcon from "./brightness-icon";
import DDCBrightness from "../../lib/ddc-brightness";
export default function BrightnessTooltip({
    forward,
    trigger,
    onHover = () => {},
    onHoverLost = () => {},
}: {
    forward: "bottom" | "top" | "left" | "right";
    trigger: Gtk.Widget;
    onHover?: (self: Astal.Window, event: Astal.HoverEvent) => void;
    onHoverLost?: (self: Astal.Window, event: Astal.HoverEvent) => void;
}) {
    const ddc = DDCBrightness.get_monitor(1);

    return (
        <PopupWindow forward={forward} trigger={trigger}>
            <eventbox
                onScroll={(_, e) => (ddc.light += e.delta_y > 0 ? -5 : 5)}
                onHover={(self, e) => onHover(self.parent as Astal.Window, e)}
                onHoverLost={(self, e) => onHoverLost(self.parent as Astal.Window, e)}
            >
                <box
                    className={"BrightnessTooltip"}
                    vertical={true}
                    spacing={2}
                    css={`
                        padding: 10px;
                    `}
                >
                    <BrightnessIcon size={28} onlyIcon={true} padding={1} />
                    <slider
                        setup={(self) => {
                            self.value = ddc.light;
                            self.connect("scroll-event", (_, e: Gdk.Event) => {
                                let v = ddc.light + 5 * (e.get_scroll_deltas()[2] < 0 ? 1.0 : -1.0);
                                ddc.light = Math.min(Math.max(v, 0), 100);
                            });
                        }}
                        heightRequest={100}
                        halign={Gtk.Align.CENTER}
                        hexpand={true}
                        orientation={Gtk.Orientation.VERTICAL}
                        inverted={true}
                        max={100}
                        onDragged={(self) => (ddc.light = self.value)}
                        value={bind(ddc, "light")}
                    />
                    <label
                        css={"font-size: 14px;"}
                        label={bind(ddc, "light").as((v) => v.toFixed(0).toString())}
                    />
                </box>
            </eventbox>
        </PopupWindow>
    ) as Astal.Window;
}

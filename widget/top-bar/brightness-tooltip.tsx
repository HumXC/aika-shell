import { Astal, Gdk, Gtk } from "astal/gtk3";
import PopupWindow from "../base/popup-window";
import { bind } from "astal";
import BrightnessIcon from "./brightness-icon";
import DDCBrightness from "../../lib/ddc-brightness";
import Hyprland from "gi://AstalHyprland?version=0.1";
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
    const ddc = DDCBrightness.get_default();
    const hypr = Hyprland.get_default();
    const monitor = ddc.monitors[trigger.get_display().get_n_monitors() - 1];
    return (
        <PopupWindow forward={forward} trigger={trigger}>
            <eventbox
                onScroll={(_, e) => {
                    monitor.brightness += e.delta_y > 0 ? -5 : 5;
                }}
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
                            self.value = monitor.brightness;
                            self.connect("scroll-event", (_, e: Gdk.Event) => {
                                let v =
                                    monitor.brightness +
                                    5 * (e.get_scroll_deltas()[2] < 0 ? 1.0 : -1.0);
                                monitor.brightness = Math.min(Math.max(v, 0), 100);
                            });
                        }}
                        heightRequest={100}
                        halign={Gtk.Align.CENTER}
                        hexpand={true}
                        orientation={Gtk.Orientation.VERTICAL}
                        inverted={true}
                        max={100}
                        onDragged={(self) => (monitor.brightness = self.value)}
                        value={bind(monitor, "brightness")}
                    />
                    <label
                        css={"font-size: 14px;"}
                        label={bind(monitor, "brightness").as((v) => v.toFixed(0).toString())}
                    />
                </box>
            </eventbox>
        </PopupWindow>
    ) as Astal.Window;
}

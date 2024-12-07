import { Astal, Gdk, Gtk } from "astal/gtk3";
import PopupWindow from "../base/popup-window";
import { bind } from "astal";
import { EventIcon } from "../base";
import ddcBrightness, { Monitor } from "../../lib/ddc-brightness";

function Slider({ monitor: p }: { monitor: Monitor }) {
    return (
        <eventbox onScroll={(_, e) => (p.brightness += e.delta_y > 0 ? -5 : 5)}>
            <box
                css={`
                    background: ${"rgba(255, 255, 255, 0.1)"};
                    padding: 6px 12px 6px 12px;
                    border-radius: 8px;
                `}
            >
                <EventIcon
                    iconName={"display-symbolic"}
                    size={38}
                    iconSize={64}
                    padding={2}
                    useCssColor={false}
                />
                <box vertical={true} hexpand={true}>
                    <label
                        label={p.info?.drm_connector.substring(6, 100)}
                        halign={Gtk.Align.START}
                        marginStart={10}
                        marginEnd={10}
                    />
                    <slider
                        setup={(self) => {
                            self.value = 100;
                            self.connect(
                                "scroll-event",
                                (_, e: Gdk.Event) =>
                                    (p.brightness += e.get_scroll_deltas()[2] > 0 ? -5 : 5)
                            );
                        }}
                        halign={Gtk.Align.FILL}
                        hexpand={true}
                        orientation={Gtk.Orientation.HORIZONTAL}
                        widthRequest={230}
                        max={100}
                        onDragged={(self) => (p.brightness = self.value)}
                        value={bind(p, "brightness")}
                    />
                </box>
                <label
                    css={"font-size: 16px;"}
                    halign={Gtk.Align.CENTER}
                    widthRequest={32}
                    label={bind(p, "brightness").as((n) => n.toFixed(0))}
                />
            </box>
        </eventbox>
    );
}
export default function BrightnessPopup({
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
    return (
        <PopupWindow forward={forward} trigger={trigger}>
            <eventbox
                onHover={(self, e) => onHover(self.parent as Astal.Window, e)}
                onHoverLost={(self, e) => onHoverLost(self.parent as Astal.Window, e)}
            >
                <box
                    className={"BrightnessPopup"}
                    vertical={true}
                    spacing={8}
                    css={`
                        padding: 16px;
                    `}
                >
                    <label
                        label={"屏幕"}
                        halign={Gtk.Align.START}
                        marginStart={8}
                        css={`
                            font-size: 20px;
                        `}
                    />
                    {bind(ddcBrightness.get_default(), "monitors").as((monitors) => {
                        return monitors.map((p) => {
                            return Slider({ monitor: p });
                        });
                    })}
                </box>
            </eventbox>
        </PopupWindow>
    ) as Astal.Window;
}

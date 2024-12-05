import { Astal, Gdk, Gtk } from "astal/gtk3";
import PopupWindow from "../base/popup-window";
import WirePlumber from "gi://AstalWp";
import { bind } from "astal";
import VolumeIcon from "./volume-icon";
import { EventIcon } from "../base";
const setVolume = (device: WirePlumber.Endpoint, v: number) => {
    device.volume = v;
    if (v == 0) device.mute = true;
    else device.mute = false;
};
const onScroll = (device: WirePlumber.Endpoint, delta_y: number) => {
    let v = device.volume + 0.01 * (delta_y < 0 ? 1.0 : -1.0);
    setVolume(device, Math.min(Math.max(v, 0), 1));
};
function Slider({ device }: { device: WirePlumber.Endpoint }) {
    return (
        <box>
            <EventIcon iconName={bind(device, "icon")} size={32} />
            <box vertical={true} hexpand={true} spacing={2}>
                <label label={"DEVICE"} />
                <slider
                    setup={(self) => {
                        self.value = device.volume * 100;
                        self.connect("scroll-event", (_, e: Gdk.Event) =>
                            onScroll(device, e.get_scroll_deltas()[2])
                        );
                    }}
                    heightRequest={100}
                    halign={Gtk.Align.CENTER}
                    hexpand={true}
                    orientation={Gtk.Orientation.HORIZONTAL}
                    max={100}
                    onDragged={(self) => setVolume(device, self.value / 100)}
                    value={bind(device, "volume").as((n) => n * 100)}
                />
            </box>
            <label
                css={"font-size: 14px;"}
                label={bind(device, "volume").as((n) => (n * 100).toFixed(0))}
            />
        </box>
    );
}
export default function VolumePopup({
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
    const wp = WirePlumber.get_default() as WirePlumber.Wp;

    return (
        <PopupWindow forward={forward} trigger={trigger}>
            <eventbox
                onHover={(self, e) => onHover(self.parent as Astal.Window, e)}
                onHoverLost={(self, e) => onHoverLost(self.parent as Astal.Window, e)}
            >
                <box
                    className={"VolumeTooltip"}
                    vertical={true}
                    spacing={2}
                    widthRequest={500}
                    css={`
                        padding: 10px;
                    `}
                >
                    {wp.get_endpoints()?.map((device) => Slider({ device }))}
                </box>
            </eventbox>
        </PopupWindow>
    ) as Astal.Window;
}

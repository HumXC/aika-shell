import { Astal, Gdk, Gtk } from "astal/gtk3";
import PopupWindow from "./base/popup-window";
import WirePlumber from "gi://AstalWp";
import { bind } from "astal";
import VolumeIcon from "./volume-icon";

export default function VolumeTooltip({
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

    const setVolume = (v: number) => {
        wp.defaultSpeaker.volume = v;
        if (v == 0) wp.defaultSpeaker.mute = true;
        else wp.defaultSpeaker.mute = false;
    };
    const onScroll = (delta_y: number) => {
        let v = wp.defaultSpeaker.volume + 0.01 * (delta_y < 0 ? 1.0 : -1.0);
        setVolume(Math.min(Math.max(v, 0), 1));
    };
    return (
        <PopupWindow forward={forward} trigger={trigger}>
            <eventbox
                onScroll={(_, e) => onScroll(e.delta_y)}
                onHover={(self, e) => onHover(self.parent as Astal.Window, e)}
                onHoverLost={(self, e) => onHoverLost(self.parent as Astal.Window, e)}
            >
                <box className={"VolumeTooltip"} vertical={true} spacing={2}>
                    <VolumeIcon size={22} onlyIcon={true} padding={0} />
                    <slider
                        setup={(self) => {
                            self.value = wp.defaultSpeaker.volume * 100;
                            self.connect("scroll-event", (_, e: Gdk.EventScroll) => {
                                // BUG: e is not null, but it's not a valid event.
                                // onScroll(e.delta_y);
                            });
                        }}
                        heightRequest={100}
                        halign={Gtk.Align.CENTER}
                        hexpand={true}
                        orientation={Gtk.Orientation.VERTICAL}
                        inverted={true}
                        max={100}
                        onDragged={(self) => setVolume(self.value / 100)}
                        value={bind(wp.defaultSpeaker, "volume").as((n) => n * 100)}
                    />
                    <label
                        css={"font-size: 14px;"}
                        label={bind(wp.defaultSpeaker, "volume").as((n) => (n * 100).toFixed(0))}
                    />
                </box>
            </eventbox>
        </PopupWindow>
    ) as Astal.Window;
}

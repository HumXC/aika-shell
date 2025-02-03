import { Astal, Gdk, Gtk } from "astal/gtk3";
import PopupWindow from "../base/popup-window";
import WirePlumber from "gi://AstalWp";
import { bind } from "astal";
import { EventIcon, Space } from "../base";
import Pango from "gi://Pango?version=1.0";
import { getHyprlandRounding } from "../../utils";
const setVolume = (device: WirePlumber.Endpoint, v: number) => {
    device.volume = v;
    if (v == 0) device.set_mute(true);
    else device.set_mute(false);
};
const onScroll = (device: WirePlumber.Endpoint, delta_y: number) => {
    let v = device.volume + 0.01 * (delta_y < 0 ? 1.0 : -1.0);
    setVolume(device, Math.min(Math.max(v, 0), 1));
};
function Slider({ endpoint: p, rounding }: { endpoint: WirePlumber.Endpoint; rounding: number }) {
    const m = WirePlumber.MediaClass;
    const getIcon = () => {
        switch (p.mediaClass) {
            case m.AUDIO_STREAM:
            case m.AUDIO_SPEAKER:
            case m.AUDIO_RECORDER:
                if (p.mute) return "audio-volume-muted-symbolic";
                else return "audio-volume-high-symbolic";
            case m.AUDIO_MICROPHONE:
                if (p.mute) return "audio-input-microphone-muted-symbolic";
                else return "audio-input-microphone-high-symbolic";
            default:
                return "audio-volume-high-symbolic";
        }
    };
    return (
        <eventbox onScroll={(_, e) => onScroll(p, e.delta_y)}>
            <box
                className={"PopupWindowItem"}
                css={`
                    border-radius: ${rounding}px;
                    padding: 0 12px;
                `}
                setup={(self) => {
                    const setCss = () => {
                        if (p.isDefault && p.mediaClass === m.AUDIO_SPEAKER)
                            self.className = "PopupWindowItem PopupWindowItem-selected";
                        else self.className = "PopupWindowItem";
                    };
                    self.hook(bind(p, "isDefault"), setCss);
                    setCss();
                }}
            >
                <EventIcon
                    iconName={bind(p, "mute").as((m) => {
                        return getIcon();
                    })}
                    size={38}
                    iconSize={64}
                    useCssColor={false}
                    onClick={() => {
                        p.set_mute(!p.mute);
                    }}
                    tooltipText={p.description}
                />
                <eventbox onClick={() => p.set_is_default(true)}>
                    <box vertical={true} hexpand={true} marginEnd={6}>
                        <label
                            label={p.description}
                            halign={Gtk.Align.START}
                            marginTop={12}
                            marginStart={10}
                            ellipsize={Pango.EllipsizeMode.END}
                            marginEnd={10}
                            wrap={true}
                            wrapMode={Pango.WrapMode.CHAR}
                        />
                        <slider
                            setup={(self) => {
                                self.value = p.volume * 100;
                                self.connect("scroll-event", (_, e: Gdk.Event) =>
                                    onScroll(p, e.get_scroll_deltas()[2])
                                );
                            }}
                            halign={Gtk.Align.FILL}
                            hexpand={true}
                            orientation={Gtk.Orientation.HORIZONTAL}
                            max={100}
                            onDragged={(self) => setVolume(p, self.value / 100)}
                            value={bind(p, "volume").as((n) => n * 100)}
                        />
                    </box>
                </eventbox>
                <label
                    css={"font-size: 16px;"}
                    halign={Gtk.Align.CENTER}
                    widthRequest={32}
                    label={bind(p, "volume").as((n) => (n * 100).toFixed(0))}
                />
            </box>
        </eventbox>
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
    const rounding = getHyprlandRounding();
    return (
        <PopupWindow forward={forward} trigger={trigger}>
            <eventbox
                onHover={(self, e) => onHover(self.parent as Astal.Window, e)}
                onHoverLost={(self, e) => onHoverLost(self.parent as Astal.Window, e)}
            >
                <box
                    widthRequest={360}
                    className={"VolumePopup"}
                    vertical={true}
                    spacing={8}
                    css={`
                        padding: 16px;
                    `}
                >
                    <label
                        label={"声音"}
                        halign={Gtk.Align.START}
                        marginStart={8}
                        css={`
                            font-size: 20px;
                        `}
                    />
                    {(() => {
                        const list = wp
                            .get_endpoints()
                            ?.filter(
                                (p) =>
                                    p.mediaClass === WirePlumber.MediaClass.AUDIO_STREAM ||
                                    p.mediaClass === WirePlumber.MediaClass.VIDEO_STREAM ||
                                    p.mediaClass === WirePlumber.MediaClass.AUDIO_RECORDER
                            )
                            .map((endpoint) => Slider({ endpoint, rounding }));
                        if (list?.length && list.length > 0)
                            list.push(<Space space={8} useVertical={true} />);
                        return list;
                    })()}
                    {(() => {
                        return wp
                            .get_endpoints()
                            ?.filter(
                                (p) =>
                                    p.mediaClass === WirePlumber.MediaClass.AUDIO_SPEAKER ||
                                    p.mediaClass === WirePlumber.MediaClass.VIDEO_SINK
                            )
                            .map((endpoint) => Slider({ endpoint, rounding }));
                    })()}
                    {(() => {
                        return wp
                            .get_endpoints()
                            ?.filter(
                                (p) =>
                                    ![
                                        WirePlumber.MediaClass.AUDIO_STREAM,
                                        WirePlumber.MediaClass.VIDEO_STREAM,
                                        WirePlumber.MediaClass.AUDIO_SPEAKER,
                                        WirePlumber.MediaClass.VIDEO_SINK,
                                        WirePlumber.MediaClass.AUDIO_RECORDER,
                                    ].includes(p.mediaClass)
                            )
                            .map((endpoint) => Slider({ endpoint, rounding }));
                    })()}
                </box>
            </eventbox>
        </PopupWindow>
    ) as Astal.Window;
}

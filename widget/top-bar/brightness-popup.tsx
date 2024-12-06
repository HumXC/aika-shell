import { Astal, Gdk, Gtk } from "astal/gtk3";
import PopupWindow from "../base/popup-window";
import WirePlumber from "gi://AstalWp";
import { bind, Variable } from "astal";
import { EventIcon, Space } from "../base";
const setVolume = (device: WirePlumber.Endpoint, v: number) => {
    device.volume = v;
    if (v == 0) device.mute = true;
    else device.mute = false;
};
const onScroll = (device: WirePlumber.Endpoint, delta_y: number) => {
    let v = device.volume + 0.01 * (delta_y < 0 ? 1.0 : -1.0);
    setVolume(device, Math.min(Math.max(v, 0), 1));
};
function Slider({ endpoint: p }: { endpoint: WirePlumber.Endpoint }) {
    const bgColor = Variable("rgba(255, 255, 255, 0.1)");
    return (
        <box
            setup={(self) => {
                self.hook(bind(p, "isDefault"), () => {
                    if (p.isDefault && p.mediaClass === WirePlumber.MediaClass.AUDIO_SPEAKER)
                        bgColor.set("rgba(31, 218, 255, 0.149)");
                    else bgColor.set("rgba(255, 255, 255, 0.1)");
                });
                if (p.isDefault && p.mediaClass === WirePlumber.MediaClass.AUDIO_SPEAKER)
                    bgColor.set("rgba(31, 218, 255, 0.149)");
                else bgColor.set("rgba(255, 255, 255, 0.1)");
            }}
            css={bgColor(
                (c) => `
                background: ${c};
                padding: 6px 12px 6px 12px;
                border-radius: 8px;
            `
            )}
        >
            <EventIcon
                iconName={bind(p, "volumeIcon")}
                size={38}
                iconSize={64}
                useCssColor={false}
                onClick={() => {
                    p.mute = !p.mute;
                }}
            />
            <box vertical={true} hexpand={true}>
                <label
                    label={p.description}
                    halign={Gtk.Align.START}
                    marginStart={10}
                    marginEnd={10}
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
                    widthRequest={230}
                    max={100}
                    onDragged={(self) => setVolume(p, self.value / 100)}
                    value={bind(p, "volume").as((n) => n * 100)}
                />
            </box>
            <label
                css={"font-size: 16px;"}
                halign={Gtk.Align.CENTER}
                widthRequest={32}
                label={bind(p, "volume").as((n) => (n * 100).toFixed(0))}
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
                    className={"BrightnessPopup"}
                    vertical={true}
                    spacing={8}
                    css={`
                        padding: 16px;
                    `}
                    setup={(self) => {
                        const speakerBox = self.get_children()[0] as Gtk.ComboBoxText;
                        let index = -1;
                        wp.get_endpoints()!.forEach((p) => {
                            if (p.mediaClass !== WirePlumber.MediaClass.AUDIO_SPEAKER) return;
                            speakerBox.append_text(p.description);
                            index++;
                            if (p.isDefault) speakerBox.set_active(index);
                        });
                        speakerBox.connect("changed", (self) => {
                            const name = self.get_active_text();
                            wp.get_endpoints()!.forEach((p) => {
                                if (p.description === name) {
                                    p.set_is_default(true);
                                    return;
                                }
                            });
                        });
                    }}
                >
                    {(() => {
                        const box = Gtk.ComboBoxText.new();
                        box.show_all();
                        return box;
                    })()}
                    {(() => {
                        const list = wp
                            .get_endpoints()
                            ?.filter(
                                (p) =>
                                    p.mediaClass === WirePlumber.MediaClass.AUDIO_STREAM ||
                                    p.mediaClass === WirePlumber.MediaClass.VIDEO_STREAM
                            )
                            .map((endpoint) => Slider({ endpoint: endpoint }));
                        if (list?.length && list.length > 0)
                            list.unshift(<Space space={8} useVertical={true} />);
                        return list;
                    })()}
                    {(() => {
                        const list = wp
                            .get_endpoints()
                            ?.filter(
                                (p) =>
                                    p.mediaClass === WirePlumber.MediaClass.AUDIO_SPEAKER ||
                                    p.mediaClass === WirePlumber.MediaClass.VIDEO_SINK
                            )
                            .map((endpoint) => Slider({ endpoint: endpoint }));
                        if (list?.length && list.length > 0)
                            list.unshift(<Space space={8} useVertical={true} />);
                        return list;
                    })()}
                    {(() => {
                        const list = wp
                            .get_endpoints()
                            ?.filter(
                                (p) =>
                                    ![
                                        WirePlumber.MediaClass.AUDIO_STREAM,
                                        WirePlumber.MediaClass.VIDEO_STREAM,
                                        WirePlumber.MediaClass.AUDIO_SPEAKER,
                                        WirePlumber.MediaClass.VIDEO_SINK,
                                    ].includes(p.mediaClass)
                            )
                            .map((endpoint) => Slider({ endpoint: endpoint }));
                        if (list?.length && list.length > 0)
                            list.unshift(<Space space={8} useVertical={true} />);
                        return list;
                    })()}
                </box>
            </eventbox>
        </PopupWindow>
    ) as Astal.Window;
}

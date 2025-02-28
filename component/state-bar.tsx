import { bind } from "astal";
import { Gdk, Gtk } from "astal/gtk4";
import AstalWp from "gi://AstalWp";
import AstalNetwork from "gi://AstalNetwork";
import Astal from "gi://AstalBluetooth";
import { addClickController, addHoverController, addScrollController } from "../utils";
import { Popover } from "astal/gtk4/widget";
import PopupWindow, { PopupWindowProps } from "./popup-window";
function Sound() {
    const wp = AstalWp.get_default() as AstalWp.Wp;
    return (
        <box
            setup={(self) => {
                addScrollController(self, (_, dy) => {
                    wp.get_default_speaker()?.set_volume(wp.defaultSpeaker.volume - 0.05 * dy);
                });
                addClickController(self, "onRelease", (_, button) => {
                    const defaultSpeaker = wp.get_default_speaker();
                    if (button === Gdk.BUTTON_PRIMARY)
                        defaultSpeaker?.set_mute(!defaultSpeaker.get_mute());
                });
                // const popover = self.get_children()[1] as unknown as PopupWindowProps;
                // addHoverController(self, 1000, () => popover.popup());
                const rect = self.get_allocation();
                rect.height += 50; // TODO: 适配hyprland高度
                // popover.set_pointing_to(rect);
            }}
        >
            <image iconName={bind(wp.defaultSpeaker, "volumeIcon")} />
            <PopupWindow>
                <box vertical={true}>
                    {/* <button
                        onButtonPressed={(_, button) => {
                            const defaultSpeaker = wp.get_default_speaker();
                            if (button.get_button() === Gdk.BUTTON_PRIMARY) {
                                defaultSpeaker?.set_mute(!defaultSpeaker.get_mute());
                            }
                        }}
                    >
                        <image iconName={bind(wp.defaultSpeaker, "volumeIcon")} />
                    </button>

                    <slider
                        heightRequest={100}
                        halign={Gtk.Align.CENTER}
                        hexpand={true}
                        orientation={Gtk.Orientation.VERTICAL}
                        inverted={true}
                        max={100}
                        value={bind(wp.defaultSpeaker, "volume").as((n) => n * 100)}
                        setup={(self) => {
                            self.connect("value-changed", () => {
                                wp.get_default_speaker()?.set_volume(self.get_value() / 100);
                            });
                        }}
                    />
                    <label
                        label={bind(wp.defaultSpeaker, "volume").as(
                            (n) => (n * 100).toFixed(0) + "%"
                        )}
                        hexpand={true}
                    /> */}
                </box>
            </PopupWindow>
        </box>
    );
}
export default function StateBar() {
    // 声音，显示器，网络，蓝牙
    const network = AstalNetwork.get_default();
    const bluetooth = Astal.get_default();
    return <box spacing={6}>{Sound()}</box>;
}

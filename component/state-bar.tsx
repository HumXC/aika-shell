import { AstalIO, bind, Gio, idle, timeout, Variable } from "astal";
import { Gdk, Gtk } from "astal/gtk4";
import AstalWp from "gi://AstalWp";
import AstalNetwork from "gi://AstalNetwork";
import Astal from "gi://AstalBluetooth";
import { addClickController, addHoverController, addScrollController } from "../utils";
import { Popover, PopoverProps } from "astal/gtk4/widget";
import PopupWindow, { PopupWindowProps } from "./popup-window";
import ddcBrightness, { Monitor } from "../lib/ddc-brightness";
function Sound(popupName: Variable<string>) {
    const name = "sound";
    let popover: Gtk.Popover = null as any;
    let isFocused = false;
    let timer: AstalIO.Time | null = null;
    const closePopover = (delay: number) => {
        isFocused = false;
        timer = timeout(delay, () => {
            if (isFocused) return;
            popover.popdown();
        });
    };
    popupName.subscribe((n) => {
        print(n);
        if (n !== name) {
            if (timer) timer.cancel();
            isFocused = false;
            popover.popdown();
        }
    });

    const wp = AstalWp.get_default() as AstalWp.Wp;
    return (
        <box
            setup={(self) => {
                addScrollController(self, (_, dy) => {
                    wp.get_default_speaker()?.set_volume(wp.defaultSpeaker.volume - 0.05 * dy);
                    popover.popup();
                });
                addClickController(self, "onRelease", (_, button) => {
                    const defaultSpeaker = wp.get_default_speaker();
                    if (button === Gdk.BUTTON_PRIMARY)
                        defaultSpeaker?.set_mute(!defaultSpeaker.get_mute());
                });
                addHoverController(
                    self,
                    2000,
                    () => popover.popup(),
                    () => closePopover(500)
                );
                const rect = self.get_allocation();
                rect.height += 50; // TODO: 适配hyprland高度
                popover.set_pointing_to(rect);
            }}
        >
            <image iconName={bind(wp.defaultSpeaker, "volumeIcon")} />
            {/* BUG: image 会穿透鼠标 */}
            <popover
                autohide={false}
                hasArrow={false}
                setup={(self) => {
                    self.set_default_widget(self.get_child());
                    popover = self;
                    self.connect("show", () => popupName.set(name));

                    addScrollController(self, (_, dy) => {
                        wp.get_default_speaker()?.set_volume(wp.defaultSpeaker.volume - 0.05 * dy);
                    });
                    addHoverController(
                        self,
                        0,
                        () => (isFocused = true),
                        () => closePopover(100)
                    );
                }}
            >
                <box vertical={true} widthRequest={46}>
                    <image
                        iconSize={Gtk.IconSize.LARGE}
                        pixelSize={26}
                        iconName={bind(wp.defaultSpeaker, "volumeIcon")}
                        setup={(self) => {
                            addClickController(self, "onRelease", (_, button) => {
                                const defaultSpeaker = wp.get_default_speaker();
                                if (button === Gdk.BUTTON_PRIMARY) {
                                    defaultSpeaker?.set_mute(!defaultSpeaker.get_mute());
                                }
                            });
                        }}
                    />
                    <slider
                        marginTop={6}
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
                        label={bind(wp.defaultSpeaker, "volume").as((n) => (n * 100).toFixed(0))}
                        hexpand={true}
                    />
                </box>
            </popover>
        </box>
    );
}
function Brightness(popupName: Variable<string>) {
    const name = "brightness";
    let popover: Gtk.Popover = null as any;
    let isFocused = false;
    let timer: AstalIO.Time | null = null;
    const closePopover = (delay: number) => {
        isFocused = false;
        timer = timeout(delay, () => {
            if (isFocused) return;
            popover.popdown();
        });
    };
    popupName.subscribe((n) => {
        if (n !== name) {
            if (timer) timer.cancel();
            isFocused = false;
            popover.popdown();
        }
    });
    const ddc = ddcBrightness.get_default();
    // TODO: 适配多显示器
    let monitor: Monitor = ddc.monitors[0];

    return (
        <box
            setup={(self) => {
                addScrollController(self, (_, dy) => {
                    monitor!.brightness += dy > 0 ? -5 : 5;
                    popover.popup();
                });
                addHoverController(
                    self,
                    2000,
                    () => popover.popup(),
                    () => closePopover(500)
                );
                const rect = self.get_allocation();
                rect.height += 50; // TODO: 适配hyprland高度
                popover.set_pointing_to(rect);
            }}
        >
            <image iconName={bind(monitor, "iconName")} />

            <popover
                autohide={false}
                hasArrow={false}
                setup={(self) => {
                    self.connect("show", () => popupName.set(name));
                    popover = self;
                    addScrollController(self, (_, dy) => {
                        monitor!.brightness += dy > 0 ? -5 : 5;
                    });
                    addHoverController(
                        self,
                        0,
                        () => (isFocused = true),
                        () => closePopover(100)
                    );
                }}
            >
                <box vertical={true} widthRequest={46}>
                    <image
                        iconName={bind(monitor, "iconName")}
                        iconSize={Gtk.IconSize.LARGE}
                        pixelSize={26}
                    />
                    <slider
                        marginTop={6}
                        heightRequest={100}
                        halign={Gtk.Align.CENTER}
                        hexpand={true}
                        orientation={Gtk.Orientation.VERTICAL}
                        inverted={true}
                        max={100}
                        value={bind(monitor, "brightness")}
                        setup={(self) => {
                            self.value = monitor.brightness;
                            self.connect("value-changed", () => {
                                monitor.brightness = self.get_value();
                            });
                        }}
                    />
                    <label
                        label={bind(monitor, "brightness").as((n) => n.toFixed(0).toString())}
                        hexpand={true}
                    />
                </box>
            </popover>
        </box>
    );
}

function Networking(popupName: Variable<string>) {
    const name = "network";
    let popover: Gtk.Popover = null as any;
    let isFocused = false;
    let timer: AstalIO.Time | null = null;
    const closePopover = (delay: number) => {
        isFocused = false;
        timer = timeout(delay, () => {
            if (isFocused) return;
            popover.popdown();
        });
    };
    popupName.subscribe((n) => {
        if (n !== name) {
            if (timer) timer.cancel();
            isFocused = false;
            popover.popdown();
        }
    });
    const network = AstalNetwork.get_default();
    const iconName = Variable("network-disconnected-symbolic");
    const getIcon = () => {
        switch (network.primary) {
            case AstalNetwork.Primary.WIFI:
                iconName.set(network.wifi.get_icon_name());
                break;
            case AstalNetwork.Primary.WIRED:
                iconName.set(network.wired.get_icon_name());
                break;
            default:
                iconName.set("network-disconnected-symbolic");
                break;
        }
    };
    network.connect("notify", () => getIcon());
    getIcon();
    return (
        <box
            setup={(self) => {
                addHoverController(
                    self,
                    2000,
                    () => popover.popup(),
                    () => closePopover(500)
                );
                const rect = self.get_allocation();
                rect.height += 50; // TODO: 适配hyprland高度
                popover.set_pointing_to(rect);
            }}
        >
            <image iconName={iconName()} />

            <popover
                autohide={false}
                hasArrow={false}
                setup={(self) => {
                    self.connect("show", () => popupName.set(name));
                    popover = self;
                    addHoverController(
                        self,
                        0,
                        () => (isFocused = true),
                        () => closePopover(100)
                    );
                }}
            >
                <box vertical={true} widthRequest={46}>
                    <label label="网络" />
                </box>
            </popover>
        </box>
    );
}
export default function StateBar() {
    // 声音，显示器，网络，蓝牙
    const popupName = Variable("");
    return (
        <box spacing={6}>
            {Sound(popupName)}
            {Brightness(popupName)}
            {Networking(popupName)}
        </box>
    );
}

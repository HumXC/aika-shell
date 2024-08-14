const hyprland = await Service.import("hyprland");
const audio = await Service.import("audio");
const systemtray = await Service.import("systemtray");
const network = await Service.import("network");
const mpris = await Service.import("mpris");
const players = mpris.bind("players");
import { RightBar } from "modules/right-bar/index";
const date = Variable("", {
    poll: [1000, 'date "+%H:%M %S %m/%d 周%a"'],
});
let ifstatePrevDate = { kernel: {} };
function formatSpeed(bytesPerSecond: number) {
    if (bytesPerSecond < 1e6) {
        return `${(bytesPerSecond / 1024).toFixed(2)} KB/s`;
    } else {
        return `${(bytesPerSecond / 1e6).toFixed(2)} MB/s`;
    }
}
const ifstate = Variable(
    { downloadSpeed: "", uploadSpeed: "" },
    {
        poll: [
            1000,
            "ifstat -j",
            (out) => {
                let currentData = JSON.parse(out);
                if (ifstatePrevDate === undefined) {
                    ifstatePrevDate = currentData;
                }
                const previousData = ifstatePrevDate;
                const result = {
                    downloadSpeed: "",
                    uploadSpeed: "",
                };
                let totalRxBytes = 0;
                let totalTxBytes = 0;

                for (const iface of Object.keys(currentData.kernel)) {
                    if (iface === "lo") continue; // 忽略 lo 接口
                    const prev = previousData.kernel[iface];
                    const current = currentData.kernel[iface];
                    if (!prev || !current) continue;
                    totalRxBytes += current.rx_bytes - prev.rx_bytes;
                    totalTxBytes += current.tx_bytes - prev.tx_bytes;
                }
                result.downloadSpeed = formatSpeed(totalRxBytes);
                result.uploadSpeed = formatSpeed(totalTxBytes);
                ifstatePrevDate = currentData;
                return result;
            },
        ],
    }
);
const WifiIndicator = () => {
    const value = Widget.Revealer({
        class_name: "wifi-indicator-value",
        revealChild: false,
        transition_duration: 200,
        transition: "slide_right",
        child: Widget.Label({
            label: network.wifi.bind("ssid").as((ssid) => " " + (ssid || "Unknown") + "  "),
        }),
    });
    return Widget.EventBox({
        on_hover: () => (value.reveal_child = true),
        on_hover_lost: () => Utils.timeout(100, () => (value.reveal_child = false)),
        child: Widget.Box({
            css: "min-width: 30px;",
            children: [
                Widget.Icon({
                    size: 24,
                    width_request: 30,
                    height_request: 30,
                    css: "padding: 0px 0px 2px 0px;",
                    icon: network.wifi.bind("icon_name"),
                }),
                value,
            ],
        }),
    });
};

const WiredIndicator = () =>
    Widget.Icon({
        size: 24,
        width_request: 30,
        height_request: 30,
        icon: network.wired.bind("icon_name"),
    });

const NetworkIndicator = () =>
    Widget.Stack({
        class_name: "network-indicator",
        children: {
            wifi: WifiIndicator(),
            wired: WiredIndicator(),
        },
        shown: network.bind("primary").as((p) => p || "wifi"),
    });

const NetworkSpeed = () =>
    Widget.Label({
        class_name: "network-speed",
        use_markup: true,
        css: "font-weight: normal;",
        label: ifstate
            .bind()
            .as(
                (data) =>
                    ` <span font_size="small">${data.downloadSpeed}</span>  <span font_size="small">${data.uploadSpeed}</span>`
            ),
    });

function Workspaces() {
    const activeId = hyprland.active.workspace.bind("id");
    const workspaces = hyprland.bind("workspaces").as((ws) =>
        ws
            .sort((a, b) => a.id - b.id)
            .map(({ id }) =>
                Widget.EventBox({
                    on_primary_click: () => hyprland.messageAsync(`dispatch workspace ${id}`),
                    child: Widget.Label({
                        label: id === 10 ? "0" : id.toString(),
                        width_request: 24,
                        height_request: 24,
                        css: "font-size: 16px;",
                    }),
                    class_name: activeId.as((i) => (i === id ? "focused" : "normal")),
                })
            )
    );

    return Widget.Box({
        class_name: "workspaces",
        children: workspaces,
        height_request: 30,
    });
}

function Volume() {
    const icons = {
        101: "overamplified",
        67: "high",
        34: "medium",
        1: "low",
        0: "muted",
    };

    function getIcon() {
        const icon = audio.speaker.is_muted
            ? 0
            : [101, 67, 34, 1, 0].find((threshold) => threshold <= audio.speaker.volume * 100);
        // @ts-ignore
        return `audio-volume-${icons[icon]}-symbolic`;
    }
    const value = Widget.Revealer({
        class_name: "volume-value",
        revealChild: false,
        transition_duration: 140,
        transition: "slide_right",
        child: Widget.Label({
            label: "xx%",
            width_request: 40,
            setup: (self) =>
                self.hook(audio.speaker, () => {
                    self.label = (Math.floor(audio.speaker.volume * 100) || 0) + "%";
                }),
        }),
    });
    return Widget.EventBox({
        on_hover: () => (value.reveal_child = true),
        on_hover_lost: () => Utils.timeout(100, () => (value.reveal_child = false)),
        on_scroll_down: () => (audio.speaker.volume -= 0.01),
        on_scroll_up: () => {
            if (audio.speaker.volume < 1) audio.speaker.volume += 0.01;
        },
        onPrimaryClick: () => (audio.speaker.is_muted = !audio.speaker.is_muted),
        child: Widget.Box({
            class_name: "volume",
            children: [
                Widget.Icon({
                    css: "padding: 0px 3px 0px 2px;",
                    size: 24,
                    width_request: 30,
                    height_request: 30,
                    icon: Utils.watch(getIcon(), audio.speaker, getIcon),
                }),
                value,
            ],
        }),
    });
}
function Brightness() {
    const icons = {
        80: "high",
        50: "medium",
        25: "low",
        0: "off",
    };
    function getIcon() {
        const icon = [80, 50, 25, 0].find((threshold) => {
            return threshold <= light.value;
        });
        // @ts-ignore
        return `display-brightness-${icons[icon]}-symbolic`;
    }

    const light = Variable(100);
    let maxValue = 100;
    Utils.execAsync("ddcutil getvcp 10").then((output) => {
        const regex = /current value\s*=\s*(\d+)\s*,\s*max value\s*=\s*(\d+)/;
        const match = output.match(regex);
        if (match) {
            light.setValue(parseInt(match[1], 10));
            maxValue = parseInt(match[2], 10);
        }
    });
    const lock = Variable(false);
    const value = Widget.Revealer({
        class_name: "brightness-value",
        revealChild: false,
        transition_duration: 140,
        transition: "slide_right",
        child: Widget.Label({
            label: light.bind().as((light) => `${light}%`),
            width_request: 40,
        }),
    });
    return Widget.EventBox({
        on_hover: () => (value.reveal_child = true),
        on_hover_lost: () => {
            Utils.timeout(100, () => (value.reveal_child = false));
            if (lock.value) return;
            lock.setValue(true);
            Utils.execAsync(`ddcutil setvcp 10 ${Math.floor(maxValue * (light.value / 100))}`)
                .then(() => lock.setValue(false))
                .catch((error) => print("ddcutil error: ", error));
        },
        on_scroll_down: () => {
            if (light.value > 0) light.setValue(light.value - 1);
        },
        on_scroll_up: () => {
            if (light.value < 100) light.setValue(light.value + 1);
        },
        onPrimaryClick: () => {
            if (light.value + 10 < 100) {
                light.setValue(light.value + 10);
            } else {
                light.setValue(100);
            }
        },
        on_secondary_click: () => {
            if (light.value - 10 > 0) {
                light.setValue(light.value - 10);
            } else {
                light.setValue(0);
            }
        },
        child: Widget.Box({
            class_name: "brightness",
            children: [
                Widget.Icon({
                    size: 22,
                    width_request: 30,
                    height_request: 30,
                    css: "padding: 0px 0px 1px 2px;",
                    icon: Utils.watch(getIcon(), light, getIcon),
                }),
                value,
            ],
        }),
    });
}
function Clock() {
    return Widget.Label({
        class_name: "clock",
        css: "font-weight: bold; font-size: 16px;",
        label: date.bind().as((date) => date.split(" ")[0]),
        tooltip_text: date.bind().as((date) => {
            return date.split(" ")[1] + "s | " + date.split(" ").slice(-2).join(" ");
        }),
    });
}

function SysTray() {
    const items = systemtray.bind("items").as((items) =>
        items.map((item) => {
            return Widget.EventBox({
                class_name: "systemtray-item",
                child: Widget.Icon({
                    icon: item.bind("icon"),
                    size: 18,
                    class_name: "systemtray-icon",
                }),
                on_primary_click: (_, event) => item.activate(event),
                on_secondary_click: (_, event) => item.openMenu(event),
                tooltip_markup: item.bind("tooltip_markup"),
            });
        })
    );

    return Widget.Box({
        children: items,
        spacing: 6,
        css: "padding: 0px 6px 0px 6px;",
        class_name: "systemtray",
        height_request: 30,
    });
}
function Player(player) {
    const FALLBACK_ICON = "audio-x-generic-symbolic";
    const PLAY_ICON = "media-playback-start-symbolic";
    const PAUSE_ICON = "media-playback-pause";
    const PREV_ICON = "media-skip-backward-symbolic";
    const NEXT_ICON = "media-skip-forward-symbolic";
    const play_status = Variable("Stopped");
    const control = Widget.Revealer({
        class_name: "player-control",
        revealChild: false,
        transition_duration: 300,
        transition: "slide_right",
        child: Widget.Box({
            css: "padding: 3px 4px 3px 4px;",
            spacing: 8,
            children: [
                Widget.EventBox({
                    on_primary_click: () => player.previous(),
                    class_name: "player-control-button",
                    child: Widget.Icon({
                        size: 24,
                        width_request: 24,
                        height_request: 24,
                        icon: PREV_ICON,
                    }),
                }),
                Widget.EventBox({
                    on_primary_click: () =>
                        play_status.value === "Playing" ? player.playPause() : player.play(),
                    class_name: "player-control-button",
                    child: Widget.Icon({
                        width_request: 24,
                        height_request: 24,
                        css: player.bind("play-back-status").as((s) => {
                            play_status.setValue(s);
                            return s === "Playing"
                                ? "padding: 0px 5px 0px 5px;"
                                : "padding: 0px 1px 0px 1px;";
                        }),
                        size: player
                            .bind("play-back-status")
                            .as((s) => (s === "Playing" ? 16 : 24)),
                        icon: player
                            .bind("play-back-status")
                            .as((s) => (s === "Playing" ? PAUSE_ICON : PLAY_ICON)),
                    }),
                }),
                Widget.EventBox({
                    on_primary_click: () => player.next(),
                    class_name: "player-control-button",
                    child: Widget.Icon({
                        size: 24,
                        width_request: 24,
                        height_request: 24,
                        icon: NEXT_ICON,
                    }),
                }),
            ],
        }),
    });

    const eb = Widget.EventBox({
        child: Widget.Box({
            class_name: player.bind("play-back-status").as((status) => {
                if (status === "Playing") {
                    return "player-playing";
                }
                return "player";
            }),
            children: [
                Widget.Icon({
                    css: "padding: 0px 1px 0px 0px;",
                    size: 18,
                    width_request: 30,
                    height_request: 30,
                    icon: FALLBACK_ICON,
                }),
                control,
            ],
        }),
    });
    eb.on_hover = () => (control.reveal_child = true);
    eb.on_hover_lost = () => {
        Utils.timeout(300, () => {
            if (eb.isHovered()) return;
            control.reveal_child = false;
        });
    };
    return eb;
}
function Media() {
    return Widget.Box({
        visible: players.as((p) => p.filter((p) => p.can_play).length > 0),
        children: players.as((p) => p.filter((p) => p.can_play).map(Player)),
    });
}

function OpenRightBar(right_bar: ReturnType<typeof RightBar>) {
    if (right_bar === null) throw new Error("Right bar is null");
    return Widget.EventBox({
        class_name: "open-right-bar",
        onPrimaryClick: () => {
            right_bar.is_show.setValue(!right_bar.is_show.value);
        },
        child: Widget.Icon({
            size: 24,
            width_request: 30,
            height_request: 30,
            icon: right_bar.is_show.bind().as((e) => {
                return e ? "sidebar-collapse-right" : "sidebar-expand-right";
            }),
        }),
    });
}
function Left() {
    return Widget.Box({
        spacing: 8,
        children: [SysTray(), Workspaces(), NetworkSpeed()],
    });
}

function Center() {
    return Widget.Box({
        spacing: 8,
        children: [Clock()],
    });
}

function Right(right_bar) {
    return Widget.Box({
        hpack: "end",
        spacing: 8,
        children: [Media(), Volume(), Brightness(), NetworkIndicator(), OpenRightBar(right_bar)],
    });
}
function TopBar(monitor = 0, right_bar) {
    return Widget.Window({
        name: `top-bar-${monitor}`,
        class_name: "top-bar",
        monitor,
        anchor: ["top", "left", "right"],
        exclusivity: "exclusive",
        child: Widget.CenterBox({
            margin_bottom: 2,
            margin_top: 6,
            margin_left: 8,
            margin_right: 8,
            start_widget: Left(),
            center_widget: Center(),
            end_widget: Right(right_bar),
        }),
    });
}
export { TopBar };

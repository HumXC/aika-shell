import Pango from "types/@girs/pango-1.0/pango-1.0";
import { MprisPlayer } from "types/service/mpris";
import { Variable as VariableType } from "types/variable";

const mpris = await Service.import("mpris");
const FALLBACK_ICON = "audio-x-generic-symbolic";
const PLAY_ICON = "media-playback-start-symbolic";
const PAUSE_ICON = "media-playback-pause-symbolic";
const PREV_ICON = "media-skip-backward-symbolic";
const NEXT_ICON = "media-skip-forward-symbolic";
function lengthStr(length) {
    const min = Math.floor(length / 60);
    const sec = Math.floor(length % 60);
    const sec0 = sec < 10 ? "0" : "";
    return `${min}:${sec0}${sec}`;
}

const Player = (player: MprisPlayer) => {
    const img = Widget.Box({
        class_name: "cover-box",
        // image
        child: Widget.Stack({
            children: {
                default: Widget.Icon({
                    class_name: "cover-default",
                    icon: "tools-rip-audio-cd",
                    size: 100,
                }),
                img: Widget.Box({
                    class_name: "cover-img",
                    vpack: "start",
                    height_request: 100,
                    width_request: 100,
                    css: player.bind("cover_path").transform(
                        (p) => `
                        background-image: url('${p}');
                    `
                    ),
                }),
            },
            shown: player.bind("cover_path").as((path) => (path !== "" ? "img" : "default")),
        }),
    });
    const info = Widget.Box({
        class_name: "info",
        hpack: "start",
        vertical: true,
        children: [
            Widget.Label({
                hpack: "start",
                class_name: "title",
                max_width_chars: 26,
                wrap_mode: Pango.WrapMode.CHAR,
                ellipsize: Pango.EllipsizeMode.END,
                label: player.bind("track_title"),
            }),
            Widget.Label({
                hpack: "start",
                class_name: "artist",
                max_width_chars: 28,
                wrap_mode: Pango.WrapMode.CHAR,
                ellipsize: Pango.EllipsizeMode.END,
                label: player.bind("track_artists").transform((artists) => artists.join(", ")),
            }),
        ],
    });
    const positionLabel = Widget.Label({
        class_name: "position",
        hpack: "start",
        vpack: "start",
        setup: (self) => {
            const update = (_, time: number | null) => {
                self.label = lengthStr(time || player.position);
                self.visible = player.length > 0;
            };

            self.hook(player, update, "position");
            self.poll(1000, () => update(null, null));
        },
    });

    const lengthLabel = Widget.Label({
        class_name: "length",
        hpack: "end",
        vpack: "start",
        visible: player.bind("length").transform((l) => l > 0),
        label: player.bind("length").transform(lengthStr),
    });
    const controller = Widget.Box({
        class_name: "controller",
        spacing: 12,
        vpack: "end",
        hpack: "center",
        children: [
            Widget.EventBox({
                class_name: "prev",
                vpack: "center",
                child: Widget.Icon({
                    size: 23,
                    icon: PREV_ICON,
                    css: "padding: 3px",
                }),
                on_primary_click: player.previous,
            }),
            Widget.EventBox({
                class_name: "play-pause",
                vpack: "center",
                child: Widget.Icon({
                    size: 28,
                    css: "padding: 5px",
                    icon: player.bind("play_back_status").as((status) => {
                        if (status === "Playing") {
                            return PAUSE_ICON;
                        } else {
                            return PLAY_ICON;
                        }
                    }),
                }),
                on_primary_click: player.playPause,
            }),
            Widget.EventBox({
                class_name: "next",
                vpack: "center",
                child: Widget.Icon({
                    size: 23,
                    css: "padding: 3px",
                    icon: NEXT_ICON,
                }),
                on_primary_click: player.next,
            }),
        ],
    });
    const progress = Widget.ProgressBar({
        class_name: "progress",
        value: player.bind("position").transform((p) => p / player.length),
        vexpand: false,
        visible: player.bind("length").as((l) => l > 0),
        setup: (self) => {
            function update() {
                const value = player.position / player.length;
                self.value = value > 0 ? value : 0;
            }
            self.hook(player, update);
            self.hook(player, update, "position");
            self.poll(1000, update);
        },
    });

    return Widget.Box({
        class_name: "media",
        vexpand: true,
        hexpand: true,
        height_request: 100,
        children: [
            img,
            Widget.Box({
                vertical: true,
                vexpand: true,
                hexpand: true,
                vpack: "end",
                class_name: "info-controller-box",
                children: [
                    info,
                    progress,
                    Widget.CenterBox({
                        css: "padding: 0px 3px 0px 3px",
                        start_widget: positionLabel,
                        center_widget: controller,
                        end_widget: lengthLabel,
                    }),
                ],
            }),
        ],
    });
};

function Media() {
    const current_player: VariableType<any> = Variable(null);

    const media = Widget.Box({
        child: current_player.bind().as((player) => {
            if (player === null) {
                return Widget.Box();
            }
            return Player(player);
        }),
    });
    mpris.connect("player-closed", (_, ...args) => {
        if (mpris.players.length === 0) {
            current_player.setValue(null);
        }
    });
    mpris.connect("player-changed", (_, ...args) => {
        for (const player of mpris.players) {
            if (player["play-back-status"] !== "Playing") continue;

            if (current_player.value === null) {
                current_player.setValue(player);
            }
            if (player.bus_name !== current_player.value.bus_name) {
                current_player.setValue(player);
            }
            return;
        }
    });

    return media;
}
export default Media;

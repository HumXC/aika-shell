import { Gdk, Gtk } from "astal/gtk3";
import { EventIcon, RegularWindow } from "./base";
import { exec, Gio, idle } from "astal";
import Hyprland from "gi://AstalHyprland";
import { getHyprloandOption, sleep } from "../utils";
import GdkPixbuf from "gi://GdkPixbuf?version=2.0";
export default function Clipboard() {
    const hypr = Hyprland.get_default();
    let init = false;
    const title = "clipboard";
    return (
        <RegularWindow
            title={title}
            className={"Ｃlipboard"}
            decorated={false}
            onKeyPressEvent={(self, e) => {
                if (e.get_keyval()[1] === Gdk.KEY_Escape) {
                    self.close();
                }
            }}
            onDraw={(self) => {
                if (init) return;
                init = true;
                idle(async () => {
                    let clipboard: Hyprland.Client | undefined = undefined;
                    while (clipboard === undefined) {
                        [clipboard] = hypr.clients.filter((c) => {
                            return c.title === title;
                        });
                        await sleep(1);
                    }
                    let x = hypr.cursorPosition.x - clipboard.x;
                    let y = hypr.cursorPosition.y - clipboard.y;
                    const monitor = hypr.get_focused_monitor();
                    const gapsOption = getHyprloandOption("general:gaps_out", "custom");
                    let gapx = 0;
                    let gapy = 0;
                    if (gapsOption) {
                        const gaps = gapsOption.split(" ").map(Number);
                        gapx = gaps[0];
                        gapy = gaps[2];
                    }
                    const mWidth = monitor.get_width() / monitor.get_scale();
                    const mHeight = monitor.get_height() / monitor.get_scale();
                    if (x + clipboard.x + clipboard.width > mWidth) {
                        x = mWidth - clipboard.width - clipboard.x - gapx;
                    }
                    if (y + clipboard.y + clipboard.height > mHeight) {
                        y = mHeight - clipboard.height - clipboard.y - gapy;
                    }
                    hypr.dispatch("movewindowpixel", `${x} ${y},title:${title}`);
                });
            }}
            css={`
                color: white;
            `}
        >
            <box>
                <EventIcon useCssColor={false} iconName={"critical-notif-symbolic"} size={128} />{" "}
                <EventIcon useCssColor={false} iconName={"critical-notif-symbolic"} size={128} />
                <icon
                    setup={(self) => {
                        let theme = Gtk.IconTheme.get_default();
                        let icon = theme.lookup_icon("critical-notif-symbolic", 128, 0);
                        self.gIcon = icon?.load_icon()!;
                    }}
                    css={`
                        font-size: 96px;
                        color: white;
                    `}
                />
            </box>
        </RegularWindow>
    );
}

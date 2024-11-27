import { App, Gdk, Gtk } from "astal/gtk3";
import { RegularWindow } from "./base";
import { exec, idle, timeout } from "astal";
import Hyprland from "gi://AstalHyprland";
import { sleep } from "../utils";
export default function Clipboard() {
    const hypr = Hyprland.get_default();
    let init = false;
    const title = "clipboard";
    return (
        <RegularWindow
            title={title}
            className={"clipboard"}
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
                    const gapsOption: {
                        option: string;
                        custom: string;
                        set: boolean;
                    } = JSON.parse(exec(["hyprctl", "-j", "getoption", "general:gaps_out"]));
                    let gapx = 0;
                    let gapy = 0;
                    if (gapsOption.set) {
                        const gaps = gapsOption.custom.split(" ").map(Number);
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
        ></RegularWindow>
    );
}

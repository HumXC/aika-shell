import { Variable } from "resource:///com/github/Aylur/ags/variable.js";
import { Util } from "types/@girs/atk-1.0/atk-1.0.cjs";
import Gdk from "types/@girs/gdk-3.0/gdk-3.0";
import GdkPixbuf from "types/@girs/gdkpixbuf-2.0/gdkpixbuf-2.0";
import { ByteArray } from "types/@girs/glib-2.0/glib-2.0.cjs";
import Gtk from "types/@girs/gtk-3.0/gtk-3.0";
import Pango from "types/@girs/pango-1.0/pango-1.0";
import W from "types/widget";
import { RegularWindow } from "window";
class Item {
    type: string = "text";
    data: string = "*Unknown*";
    index: string = "";
    constructor(payload: string) {
        const i = payload.indexOf("\t");
        this.index = payload.slice(0, i);
        payload = payload.slice(i + 1, payload.length);
        if (payload.startsWith("[[")) {
            const split = payload.split(" ");
            if (split.length === 8) {
                const type = split[1] + " " + split[2];
                const size = split[3] + " " + split[4];
                const ext = split[5];
                const date = split[6];
                if (
                    ext === "png" ||
                    ext === "jpg" ||
                    ext === "jpeg" ||
                    ext === "gif" ||
                    ext === "bmp" ||
                    ext === "svg" ||
                    ext === "webp"
                ) {
                    this.type = "image";
                    this.data = "file:///tmp/cliphist/" + this.index + "." + ext;
                }
            }
        } else if (payload.startsWith("/")) {
            this.type = "file";
            this.data = payload;
        } else {
            this.data = payload;
        }
    }
}
const is_show = new Variable(false);
function ClipboardWindow() {
    let index = 0;
    const box = Widget.Box({
        vpack: "start",
        vexpand: true,
        hexpand: true,
        vertical: true,
        class_name: "box",
        spacing: 10,
    });
    const setItem = (list: Array<Gtk.Widget>) => {
        box.children = list;
    };
    const w = RegularWindow({
        name: "clipboard",
        class_name: "clipboard",
        vpack: "start",
        vexpand: true,
        hexpand: true,
        title: "clipboard",
        default_height: 514,
        default_width: 370,
        visible: is_show.bind(),
        resizable: false,
        child: Widget.Scrollable({
            class_name: "scrollable",
            hscroll: "never",
            vscroll: "always",
            visible: true,
            height_request: 514,
            child: box,
        }),
    });
    const result: [typeof w, typeof setItem] = [w, setItem];
    return result;
}
function Clipboard() {
    let selected: number = 0;
    const select = (box: any, index: number) => {
        box.child.class_name = "item item-selected";
        selected = index;
    };
    const deselect = (box) => {
        box.child.class_name = "item";
    };
    const emitCopy = (index: number) => {
        Utils.execAsync(["sh", "-c", `cliphist decode ${index} | wl-copy`]);
        is_show.value = false;
    };
    let [w, setItem] = ClipboardWindow();
    const init = () => {
        w.on("destroy", () => {
            is_show.value = false;
        });

        w.on("key-press-event", (self, event: Gdk.Event) => {
            const key = event.get_keyval()[1];
            switch (key) {
                case Gdk.KEY_Escape:
                    is_show.value = false;
                    break;
                case Gdk.KEY_Down:
                    // @ts-ignore
                    const s: Gtk.ScrolledWindow = w.child;
                    const adj: Gtk.Adjustment = s.get_vadjustment();

                    break;
                case Gdk.KEY_Up:
                    break;
                default:
                    break;
            }
        });
    };
    init();
    const show = () => {
        const list: Array<Gtk.Widget> = [];
        for (const item of Utils.exec("cliphist list").split("\n")) {
            const entry = new Item(item);
            const box = Widget.EventBox(
                {
                    on_hover: (self, event) => {
                        select;
                    },
                    on_hover_lost: (self, event) => {
                        self.child.class_name = "item";
                    },
                    on_primary_click: () => {
                        Utils.execAsync(["sh", "-c", `cliphist decode ${entry.index} | wl-copy`]);
                        is_show.value = false;
                    },
                },
                Widget.Box({
                    class_name: "item",
                    orientation: Gtk.Orientation.VERTICAL,
                    height_request: 90,
                    vexpand: true,
                    vpack: "start",
                    hpack: "fill",
                    child: Widget.Label({
                        label: entry.data,
                        hpack: "start",
                        wrap_mode: Pango.WrapMode.CHAR,
                        wrap: true,
                    }),
                })
            );
            list.push(box);
        }
        setItem(list);
        log(list.length);
    };
    Utils.watch(null, is_show, () => {
        if (!is_show.value) {
            return;
        }

        if (w.is_destroyed) {
            [w, setItem] = ClipboardWindow();
            init();
        }

        show();
    });
}
export { Clipboard, is_show };

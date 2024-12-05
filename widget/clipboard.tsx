import { Gdk, Gtk, Widget } from "astal/gtk3";
import { RegularWindow } from "./base";
import { exec, execAsync, Gio, GLib, idle, interval, timeout, Variable } from "astal";
import Hyprland from "gi://AstalHyprland";
import { getHyprloandOption, sleep } from "../utils";
import Pango from "gi://Pango?version=1.0";

function cliphistDecode(index: string) {
    try {
        const [_, out, __] = Gio.Subprocess.new(
            ["cliphist", "decode", index],
            Gio.SubprocessFlags.STDOUT_PIPE
        ).communicate_utf8(null, null);
        return out;
    } catch (error) {
        return "";
    }
}
class Entry {
    type: string = "text";
    text: string = "*Unknown*";
    icon: Widget.Icon | null = null;
    index: string = "";
    constructor(payload: string) {
        const i = payload.indexOf("\t");
        this.index = payload.slice(0, i);
        payload = payload.slice(i + 1, payload.length);
        const icon = (name: string) => {
            return (
                <icon
                    marginEnd={10}
                    css={`
                        font-size: 40px;
                    `}
                    icon={name}
                />
            ) as Widget.Icon;
        };
        if (payload.startsWith("[[")) {
            const split = payload.split(" ");
            if (split.length === 8) {
                const type = split[1] + " " + split[2];
                const size = split[3] + " " + split[4];
                const ext = split[5];
                const date = split[6];
                this.type = "file";
                this.icon = icon("document-preview");
                this.text = `Binary ( ${type}, ${size}, ${date})`;

                if (["png", "jpg", "jpeg", "gif", "bmp", "svg", "webp"].includes(ext)) {
                    this.type = "image";
                    this.text = `Image ( ${size}, ${date})`;
                    this.icon = icon("view-preview");
                }
            }
        } else if (payload.startsWith("file://")) {
            this.type = "file";
            this.icon = icon("document-preview");
            this.text = payload.slice(7, payload.length);
        } else {
            this.text = payload;
        }
    }
}
function EntryBox(entry: Entry) {
    return (
        <eventbox
            onHover={(self) => {
                (self.parent as Gtk.ListBoxRow).activate();
            }}
        >
            <box className={"ClipboardEntry"} heightRequest={50} margin={10}>
                {entry.icon}
                <label label={entry.text} wrap={true} wrapMode={Pango.WrapMode.CHAR} />
            </box>
        </eventbox>
    );
}
export default function Clipboard() {
    const hypr = Hyprland.get_default();
    let init = false;
    const title = "clipboard";
    const currentFilter = Variable("");
    let listBox: Gtk.ListBox = null as any;
    let entry: Gtk.Entry = null as any;
    const selected = Variable("");
    const lines = exec("cliphist list").split("\n");
    const addEntry = (start: number, count: number = 10) => {
        for (let i = start; i < start + count; i++) {
            if (i >= lines.length) break;
            const entry = new Entry(lines[i]);
            const row = new Gtk.ListBoxRow();
            const box = EntryBox(entry);
            row.set_margin_top(5);
            row.set_margin_bottom(5);
            row.add(box);
            row.show_all();
            row.connect("activate", () => {
                selected.set(entry.index);
            });
            row.connect("focus-in-event", () => {
                row.activate();
            });
            listBox.add(row);
        }
    };
    return (
        <RegularWindow
            title={title}
            decorated={false}
            onKeyPressEvent={(self, e) => {
                if (e.get_keyval()[1] === Gdk.KEY_Escape) {
                    self.close();
                }
                if (
                    ![
                        Gdk.KEY_Return,
                        Gdk.KEY_Tab,
                        Gdk.KEY_space,
                        Gdk.KEY_Left,
                        Gdk.KEY_Right,
                        Gdk.KEY_Up,
                        Gdk.KEY_Down,
                        Gdk.KEY_Page_Up,
                        Gdk.KEY_Page_Down,
                        Gdk.KEY_Home,
                        Gdk.KEY_End,
                        Gdk.KEY_Shift_L,
                        Gdk.KEY_Shift_R,
                        Gdk.KEY_Control_L,
                        Gdk.KEY_Control_R,
                        Gdk.KEY_Alt_L,
                        Gdk.KEY_Alt_R,
                        Gdk.KEY_Super_L,
                        Gdk.KEY_Super_R,
                        Gdk.KEY_Menu,
                    ].includes(e.get_keyval()[1]) &&
                    !entry.isFocus
                ) {
                    entry.grab_focus();
                    entry.select_region(-1, -1);
                }
                if (e.get_keyval()[1] === Gdk.KEY_space) {
                    self.close();
                    let cmd = `cliphist decode ${selected.get()} | wl-copy`;
                    if (cliphistDecode(selected.get()).startsWith("file://"))
                        cmd += " -t text/uri-list";
                    execAsync(["sh", "-c", cmd]).catch((e) => console.error(e));
                }
                if (e.get_keyval()[1] === Gdk.KEY_Return) {
                    self.close();
                    let cmd = `cliphist decode ${selected.get()} | wl-copy`;
                    if (cliphistDecode(selected.get()).startsWith("file://"))
                        cmd += " -t text/uri-list";
                    GLib.timeout_add(GLib.PRIORITY_DEFAULT_IDLE, 10, () => {
                        if (hypr.focusedClient && hypr.focusedClient.title === title) return true;
                        Gio.Subprocess.new(["sh", "-c", cmd], Gio.SubprocessFlags.NONE).wait(null);
                        Gio.Subprocess.new(
                            ["wtype", "-M", "ctrl", "v", "-m", "ctrl"],
                            Gio.SubprocessFlags.NONE
                        ).wait(null);
                        return false;
                    });
                }
            }}
            setup={(self) => self.set_focus(listBox.get_row_at_index(0))}
            css={"background: transparent;"}
            heightRequest={500}
            widthRequest={320}
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
        >
            <box
                css={`
                    padding: 10px;
                `}
                vertical={true}
                hexpand={true}
                className={"Clipboard"}
            >
                <entry
                    onChanged={(self) => {
                        currentFilter.set(self.get_text());
                        listBox.invalidate_filter();
                    }}
                    marginBottom={20}
                    marginTop={20}
                    setup={(self) => (entry = self)}
                />
                {(() => {
                    const scrollWindow = Gtk.ScrolledWindow.new(null, null);
                    const list = Gtk.ListBox.new();
                    listBox = list;
                    scrollWindow.set_policy(Gtk.PolicyType.NEVER, Gtk.PolicyType.AUTOMATIC);
                    scrollWindow.add(list);
                    scrollWindow.set_vexpand(true);
                    list.connect("row-selected", () => {
                        if (list.get_selected_row() === list.get_children().pop())
                            addEntry(list.get_children().length);
                    });
                    scrollWindow.connect("edge-reached", (self, pos) => {
                        if (pos === Gtk.PositionType.BOTTOM) addEntry(list.get_children().length);
                    });
                    list.set_filter_func((row) => {
                        const text = (
                            (row as any).get_child().get_child().get_children().pop() as Gtk.Label
                        ).get_text();
                        return text.toLowerCase().includes(currentFilter.get().toLowerCase());
                    });
                    scrollWindow.show_all();
                    addEntry(0);
                    return scrollWindow;
                })()}
            </box>
        </RegularWindow>
    );
}

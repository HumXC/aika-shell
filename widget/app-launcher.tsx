import { bind, Gio, GLib, idle, timeout, Variable } from "astal";
import { Astal, Gdk, Gtk, Widget } from "astal/gtk3";
import Apps from "gi://AstalApps";
import { isControlKey } from "../utils";
import cairo from "gi://cairo?version=1.0";
export default function AppLauncher() {
    const apps = new Apps.Apps({
        nameMultiplier: 2,
        entryMultiplier: 0,
        executableMultiplier: 2,
    });
    const allApps = apps.get_list().sort((a, b) => b.frequency - a.frequency);
    const appList = Variable<Apps.Application[]>([]);
    let window: Widget.Window = null as any;
    const hoveredApp = Variable(-1);
    const selectedApp = Variable(-1);
    const columns = 8;
    const rows = 4;
    const launch = (action: string | null = null) => {
        window.close();
        idle(() => {
            if (action) {
                const appInfo = appList.get()[selectedApp.get()].app as Gio.DesktopAppInfo;
                appInfo.launch_action(action, null);
                return;
            }
            const app = appList.get()[selectedApp.get()];
            app.launch();
        });
    };
    const page = Variable(1);
    let entry: Widget.Entry = null as any;
    const filter = Variable("");
    return (
        <window
            anchor={
                Astal.WindowAnchor.TOP |
                Astal.WindowAnchor.LEFT |
                Astal.WindowAnchor.RIGHT |
                Astal.WindowAnchor.BOTTOM
            }
            keymode={Astal.Keymode.EXCLUSIVE}
            layer={Astal.Layer.TOP}
            css={"background: transparent;"}
            onKeyPressEvent={(self, e: Gdk.Event) => {
                const key = e.get_keyval()[1];
                switch (key) {
                    case Gdk.KEY_Escape:
                        self.close();
                        break;
                    case Gdk.KEY_Return:
                        launch();
                        break;
                    case Gdk.KEY_Page_Up:
                        selectedApp.set(Math.max(selectedApp.get() - columns * rows, 0));
                        break;
                    case Gdk.KEY_Page_Down:
                        selectedApp.set(
                            Math.min(selectedApp.get() + columns * rows, appList.get().length - 1)
                        );
                        break;
                    case Gdk.KEY_Home:
                        selectedApp.set(0);
                        break;
                    case Gdk.KEY_End:
                        selectedApp.set(appList.get().length - 1);
                        break;
                }
                if (!isControlKey(key) && !entry.isFocus) {
                    entry.grab_focus();
                    entry.select_region(-1, -1);
                }
            }}
            exclusivity={Astal.Exclusivity.IGNORE}
            namespace={"app-launcher"}
            setup={(self) => {
                window = self;
                self.connect("motion-notify-event", () => {
                    if (hoveredApp.get() >= 0) selectedApp.set(hoveredApp.get());
                });
                self.connect("move-focus", (self, d) => {
                    const selected = selectedApp.get();
                    const list = appList.get();
                    switch (d) {
                        case Gtk.DirectionType.LEFT:
                        case Gtk.DirectionType.TAB_BACKWARD:
                            if (selected > 0) selectedApp.set(selected - 1);
                            break;
                        case Gtk.DirectionType.RIGHT:
                        case Gtk.DirectionType.TAB_FORWARD:
                            if (selected < list.length - 1) selectedApp.set(selected + 1);
                            break;
                        case Gtk.DirectionType.UP:
                            if (selected > columns - 1) selectedApp.set(selected - columns);
                            break;
                        case Gtk.DirectionType.DOWN:
                            if (selected < list.length - columns)
                                selectedApp.set(selected + columns);
                            else if (selected != list.length - 1)
                                selectedApp.set(list.length - (list.length % (columns * rows)));
                            break;
                    }
                });
                self.hook(bind(selectedApp), (_, i) => {
                    if (i < 0) return;
                    page.set(Math.ceil((i + 1) / (columns * rows)));
                });
                self.hook(bind(filter), (_, txt) => {
                    selectedApp.set(-1);
                    appList.set(
                        allApps.filter((app) => {
                            return (
                                app.name.toLowerCase().includes(txt.toLowerCase()) ||
                                app.description?.toLowerCase().includes(txt.toLowerCase()) ||
                                app.categories?.some((cat) =>
                                    cat.toLowerCase().includes(txt.toLowerCase())
                                )
                            );
                        })
                    );
                    selectedApp.set(0);
                });
                appList.set(allApps);
                selectedApp.set(0);
            }}
        >
            <box
                className={"AppLauncher"}
                vertical={true}
                setup={(self) => self.set_focus_chain([self.get_children()[1]])}
            >
                <box halign={Gtk.Align.CENTER} marginTop={140} marginBottom={60}>
                    <overlay>
                        <entry
                            onChanged={(self) => filter.set(self.text)}
                            widthRequest={300}
                            heightRequest={40}
                            xalign={0.5}
                            setup={(self) => {
                                entry = self;
                                self.connect("focus-out-event", () => {
                                    (self.parent as Widget.Overlay).get_children()[1].visible =
                                        self.textLength === 0 && !self.isFocus;
                                });
                                self.connect("key-press-event", () => {
                                    (self.parent as Widget.Overlay).get_children()[1].visible =
                                        self.textLength === 0 && !self.isFocus;
                                });
                            }}
                            css={"font-size: 16px;"}
                        />
                        <icon icon={"search-symbolic"} iconSize={64} css={"font-size: 20px;"} />
                    </overlay>
                </box>
                <eventbox
                    onScroll={(_, e) => {
                        if (e.delta_y < 0) {
                            if (page.get() > 1) page.set(page.get() - 1);
                        } else {
                            if (page.get() < Math.ceil(appList.length / (columns * rows)))
                                page.set(page.get() + 1);
                        }
                    }}
                >
                    <stack
                        transitionType={Gtk.StackTransitionType.SLIDE_UP_DOWN}
                        transitionDuration={500}
                        setup={(self) => {
                            self.hook(bind(appList), (_, list) => {
                                self.foreach((child) => child.destroy());
                                let start = 0;
                                let p = 0;
                                while (start !== list.length) {
                                    if (start > 50) break;
                                    let grid: Gtk.Grid | null = null;
                                    [grid, start] = Grid(
                                        start,
                                        columns,
                                        rows,
                                        list,
                                        launch,
                                        selectedApp,
                                        hoveredApp
                                    );
                                    p++;
                                    self.add_named(grid, `page${p}`);
                                }
                                if (list.length === 0) {
                                    self.add_named(
                                        <label
                                            label={"(￣▽￣)"}
                                            hexpand={true}
                                            marginTop={120}
                                            opacity={0.5}
                                            css={`
                                                font-size: 24px;
                                            `}
                                        />,
                                        `page${p + 1}`
                                    );
                                }
                            });
                            self.hook(bind(page), (_, p) => (self.shown = `page${p}`));
                        }}
                    />
                </eventbox>
            </box>
        </window>
    );
}
function Grid(
    start: number,
    columns: number,
    rows: number,
    appList: Apps.Application[],
    launch: (action?: string | null) => void,
    selectedApp: Variable<number>,
    hoveredApp: Variable<number>
): [Gtk.Grid, number] {
    const margin = 120;
    const grid = new Gtk.Grid();
    grid.set_can_focus(true);
    grid.set_column_homogeneous(true);
    grid.set_row_homogeneous(true);
    grid.set_column_spacing(10);
    grid.set_row_spacing(10);
    grid.set_margin_bottom(margin);
    grid.set_margin_left(margin);
    grid.set_margin_right(margin);
    grid.set_halign(Gtk.Align.FILL);
    let i = start;
    for (; i < appList.length; i++) {
        const ii = i;
        let column = ii % columns;
        let row = Math.floor((ii - start) / columns);
        if (row === rows) break;
        let menu: Gtk.Menu | null = null;
        const app = appList[ii];
        const box = (
            <box
                halign={Gtk.Align.CENTER}
                valign={Gtk.Align.CENTER}
                vertical={true}
                canFocus={true}
                onDestroy={() => menu?.destroy()}
            >
                <eventbox
                    hexpand={true}
                    vexpand={true}
                    setup={(self) => {
                        self.connect("focus-in-event", () => selectedApp.set(i));
                        self.hook(bind(selectedApp), (_, index) => {
                            if (index === ii) {
                                hoveredApp.set(ii);
                                grid.grab_focus();
                                (self.get_child() as Widget.Icon).className =
                                    "AppLauncherIcon AppLauncherIcon-hover";
                            } else {
                                (self.get_child() as Widget.Icon).className = "AppLauncherIcon";
                            }
                        });
                    }}
                    canFocus={true}
                    halign={Gtk.Align.CENTER}
                    onClick={(_, e) => {
                        if (e.button === Astal.MouseButton.PRIMARY) {
                            selectedApp.set(ii);
                            launch();
                        }
                        if (e.button === Astal.MouseButton.SECONDARY) {
                            const appInfo = app.app as Gio.DesktopAppInfo;
                            const actions = appInfo.list_actions();
                            if (actions.length === 0) return;
                            menu = new Gtk.Menu();
                            for (const action of actions) {
                                const item = new Gtk.MenuItem({
                                    label: appInfo.get_action_name(action),
                                });
                                item.connect("activate", () => {
                                    menu!.destroy();
                                    launch(action);
                                });
                                menu.append(item);
                            }
                            menu.show_all();
                            menu.popup_at_pointer(null);
                        }
                    }}
                    onHover={() => hoveredApp.set(ii)}
                >
                    <icon
                        className={"AppLauncherIcon"}
                        heightRequest={120}
                        widthRequest={120}
                        css={`
                            font-size: 64px;
                            border-radius: 20%;
                        `}
                        icon={app.iconName}
                    />
                </eventbox>
                <label label={app.name} marginTop={6} />
            </box>
        );
        grid.attach(box, column, row, 1, 1);
    }
    const end = i;
    for (let j = i % (columns * rows); j < columns * rows; j++) {
        const box = new Gtk.Box();
        box.set_size_request(0, 0);
        grid.attach(box, j % columns, Math.floor(j / columns), 1, 1);
    }
    grid.show_all();
    return [grid, end];
}

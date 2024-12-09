import { Gio, GLib, idle, Variable } from "astal";
import { Astal, Gdk, Gtk, Widget } from "astal/gtk3";
import Apps from "gi://AstalApps";
export default function AppLauncher() {
    const apps = new Apps.Apps({
        nameMultiplier: 2,
        entryMultiplier: 0,
        executableMultiplier: 2,
    });
    const appList = apps.get_list();
    let grid: Gtk.Grid = null as any;
    let window: Widget.Window = null as any;
    const columns = 8; // 每行显示的列数
    const hoveredApp = Variable(-1);
    const selectedApp = Variable(0);
    const launch = (action: string | null = null) => {
        window.close();
        idle(() => {
            if (action) {
                const appInfo = appList[selectedApp.get()].app as Gio.DesktopAppInfo;
                appInfo.launch_action(action, null);
                return;
            }
            const app = appList[selectedApp.get()];
            app.launch();
        });
    };
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
                if (e.get_keyval()[1] === Gdk.KEY_Escape) self.close();
            }}
            exclusivity={Astal.Exclusivity.IGNORE}
            namespace={"app-launcher"}
            setup={(self) => {
                window = self;
                self.connect("motion-notify-event", () => {
                    if (hoveredApp.get() >= 0) selectedApp.set(hoveredApp.get());
                });
                self.connect("move-focus", (self, d) => {
                    switch (d) {
                        case Gtk.DirectionType.LEFT:
                        case Gtk.DirectionType.TAB_BACKWARD:
                            if (selectedApp.get() > 0) selectedApp.set(selectedApp.get() - 1);
                            break;
                        case Gtk.DirectionType.RIGHT:
                        case Gtk.DirectionType.TAB_FORWARD:
                            if (selectedApp.get() < appList.length - 1)
                                selectedApp.set(selectedApp.get() + 1);
                            break;
                        case Gtk.DirectionType.UP:
                            if (selectedApp.get() > columns - 1)
                                selectedApp.set(selectedApp.get() - columns);
                            break;
                        case Gtk.DirectionType.DOWN:
                            if (selectedApp.get() < appList.length - columns)
                                selectedApp.set(selectedApp.get() + columns);
                            break;
                    }
                });
            }}
        >
            <box className={"AppLauncher"}>
                {(() => {
                    const margin = 120;
                    grid = new Gtk.Grid();
                    grid.set_can_focus(true);
                    grid.set_column_homogeneous(true);
                    grid.set_row_homogeneous(true);
                    grid.set_column_spacing(10);
                    grid.set_row_spacing(10);
                    grid.set_margin_top(margin);
                    grid.set_margin_bottom(margin);
                    grid.set_margin_left(margin);
                    grid.set_margin_right(margin);
                    grid.set_hexpand(true);
                    grid.set_halign(Gtk.Align.FILL);
                    appList.push(...apps.get_list());
                    const children = appList.map((app, i) => {
                        return (
                            <box
                                halign={Gtk.Align.CENTER}
                                valign={Gtk.Align.CENTER}
                                vertical={true}
                                canFocus={true}
                            >
                                <eventbox
                                    hexpand={true}
                                    vexpand={true}
                                    setup={(self) => {
                                        self.connect("focus-in-event", () => selectedApp.set(i));
                                    }}
                                    canFocus={true}
                                    halign={Gtk.Align.CENTER}
                                    onKeyPressEvent={(self, e) => {
                                        if (
                                            e.get_keyval()[1] === Gdk.KEY_Return ||
                                            e.get_keyval()[1] === Gdk.KEY_space
                                        )
                                            launch();
                                    }}
                                    onClick={(self, e) => {
                                        if (e.button === Astal.MouseButton.PRIMARY) {
                                            selectedApp.set(i);
                                            launch();
                                        }
                                        if (e.button === Astal.MouseButton.SECONDARY) {
                                            const appInfo = app.app as Gio.DesktopAppInfo;
                                            const actions = appInfo.list_actions();
                                            if (actions.length === 0) return;
                                            const menu = new Gtk.Menu();
                                            for (const action of actions) {
                                                const item = new Gtk.MenuItem({
                                                    label: appInfo.get_action_name(action),
                                                });
                                                item.connect("activate", () => {
                                                    menu.destroy();
                                                    launch(action);
                                                });
                                                menu.append(item);
                                            }
                                            menu.show_all();
                                            menu.popup_at_pointer(null);
                                        }
                                    }}
                                    onHover={(self) => hoveredApp.set(i)}
                                >
                                    <icon
                                        className={selectedApp((index) => {
                                            if (index === i) return "AppLauncherIcon-hover";
                                            return "AppLauncherIcon";
                                        })}
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
                    });

                    for (let i = 0; i < children.length; i++) {
                        const box = children[i];
                        let column = i % columns; // 当前控件的列位置
                        let row = Math.floor(i / columns); // 当前控件的行位置
                        grid.attach(box, column, row, 1, 1); // 添加到 Grid
                    }
                    grid.show_all();
                    return grid;
                })()}
            </box>
        </window>
    );
}

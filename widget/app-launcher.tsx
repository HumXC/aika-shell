import { idle, Variable } from "astal";
import { App, Astal, Gdk, Gtk, Widget } from "astal/gtk3";
import Apps from "gi://AstalApps";
export default function AppLauncher() {
    const apps = new Apps.Apps({
        nameMultiplier: 2,
        entryMultiplier: 0,
        executableMultiplier: 2,
    });
    let grid: Gtk.Grid = null as any;
    let window: Widget.Window = null as any;
    const columns = 8; // 每行显示的列数
    const selectedApp = Variable(0);
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
            setup={(self) => (window = self)}
        >
            <box className={"AppLauncher"}>
                {(() => {
                    const margin = 120;
                    grid = new Gtk.Grid();
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

                    const appList = apps.get_list();
                    appList.push(...apps.get_list());
                    // 遍历数组并按顺序添加到 Grid
                    for (let i = 0; i < appList.length; i++) {
                        const app = appList[i];
                        const box = (
                            <box
                                halign={Gtk.Align.CENTER}
                                valign={Gtk.Align.CENTER}
                                vertical={true}
                            >
                                <eventbox
                                    hexpand={true}
                                    vexpand={true}
                                    halign={Gtk.Align.CENTER}
                                    onClick={(self, e) => {
                                        if (e.button === Astal.MouseButton.PRIMARY) {
                                            window.close();
                                            idle(() => app.launch());
                                        }
                                    }}
                                    onHover={(self) => selectedApp.set(i)}
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

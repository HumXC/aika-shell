import { Astal, Gdk, Gtk } from "astal/gtk3";
import { EventIcon, Space } from "./base";
import { bind, exec, execAsync, Variable } from "astal";
import { GetConfig, ArrayConfig } from "../configs";
import { Clock } from "./top-bar";

class PowermenuConfig extends ArrayConfig<{
    label: string;
    iconName: string;
    action: string;
    default: boolean;
}> {
    default = [
        {
            label: "Suspend",
            iconName: "system-suspend-symbolic",
            action: "systemctl suspend",
            default: false,
        },
        {
            label: "Logout",
            iconName: "system-log-out-symbolic",
            action: "hyprctl dispatch exit",
            default: false,
        },
        {
            label: "Lock",
            iconName: "system-lock-screen-symbolic",
            action: "ags request lockscreen",
            default: true,
        },
        {
            label: "Reboot",
            iconName: "system-reboot-symbolic",
            action: "systemctl reboot",
            default: false,
        },
        {
            label: "Poweroff",
            iconName: "system-shutdown-symbolic",
            action: "systemctl poweroff",
            default: false,
        },
    ];
}
export default function Powermenu() {
    const cfg = GetConfig(PowermenuConfig, "powermenu");
    const select = Variable(-1);
    const icon = (index: number, iconName: string) => {
        return (
            <box>
                <EventIcon
                    className={"PowermenuIcon"}
                    iconName={iconName}
                    size={160}
                    padding={32}
                    setup={(self) => {
                        self.hook(bind(select), (self) => {
                            if (select.get() === index) {
                                self.className = "PowermenuIcon-hover";
                            } else {
                                self.className = "PowermenuIcon";
                            }
                        });
                    }}
                />
            </box>
        );
    };
    return (
        <window
            keymode={Astal.Keymode.EXCLUSIVE}
            exclusivity={Astal.Exclusivity.IGNORE}
            onKeyReleaseEvent={(self, e) => {
                const key = e.get_keyval()[1];
                switch (key) {
                    case Gdk.KEY_Escape:
                        self.close();
                        break;
                    case Gdk.KEY_Return:
                        if (select.get() === -1) return;
                        const item = cfg[select.get()];
                        execAsync(["bash", "-c", item.action]);
                        self.close();
                        break;
                    case Gdk.KEY_a:
                    case Gdk.KEY_w:
                        select.set((select.get() - 1 + cfg.length) % cfg.length);
                        break;
                    case Gdk.KEY_d:
                    case Gdk.KEY_s:
                        select.set((select.get() + 1) % cfg.length);
                        break;
                }
            }}
            anchor={
                Astal.WindowAnchor.TOP |
                Astal.WindowAnchor.RIGHT |
                Astal.WindowAnchor.BOTTOM |
                Astal.WindowAnchor.LEFT
            }
            title={"powermenu"}
            namespace={"powermenu"}
            className={"Powermenu"}
            setup={(self) => {
                self.connect("focus", (self, e: Gtk.DirectionType) => {
                    switch (e) {
                        case Gtk.DirectionType.TAB_FORWARD:
                        case Gtk.DirectionType.RIGHT:
                        case Gtk.DirectionType.DOWN:
                            select.set((select.get() + 1) % cfg.length);
                            break;
                        case Gtk.DirectionType.TAB_BACKWARD:
                        case Gtk.DirectionType.LEFT:
                        case Gtk.DirectionType.UP:
                            select.set((select.get() - 1 + cfg.length) % cfg.length);
                            break;
                    }
                });
            }}
        >
            <centerbox vertical={true}>
                <Clock fontSize={128} fontWeight="lighter" />
                <centerbox
                    spacing={64}
                    halign={Gtk.Align.CENTER}
                    valign={Gtk.Align.CENTER}
                    setup={(self) => {
                        let defaultIndex = 0;
                        const b = Gtk.Builder.new();
                        cfg.forEach((item, index) => {
                            if (item.default) {
                                defaultIndex = index;
                            }
                            self.add_child(b, icon(index, item.iconName), null);
                        });
                        select.set(defaultIndex);
                    }}
                />
                <label
                    valign={Gtk.Align.START}
                    halign={Gtk.Align.CENTER}
                    label={select().as((i) => cfg[i].label)}
                    css={"font-size: 32px;margin-top: 128px;"}
                />
            </centerbox>
        </window>
    );
}

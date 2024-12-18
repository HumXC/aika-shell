import { Astal, Gtk, Widget } from "astal/gtk3";
import PopupWindow from "../base/popup-window";
import { bind, Gio, GLib, Variable } from "astal";
import { EventIcon, Space } from "../base";
import Notifd from "gi://AstalNotifd";
import { getHyprlandRounding, setHoverClassName } from "../../utils";
import Apps from "gi://AstalApps?version=0.1";

function Item({
    notifd,
    appName,
    appIcon,
    count,
}: {
    notifd: Notifd.Notifd;
    appName: string;
    appIcon: string;
    count: number;
}) {
    const rounding = getHyprlandRounding();
    return (
        <revealer
            transitionDuration={100}
            transitionType={Gtk.RevealerTransitionType.SLIDE_DOWN}
            revealChild={true}
        >
            <eventbox
                marginTop={12}
                setup={(self) => setHoverClassName(self, "PopupWindowItem")}
                css={`
                    border-radius: ${rounding}px;
                `}
            >
                <box
                    className={"PopupWindowItem"}
                    halign={Gtk.Align.FILL}
                    valign={Gtk.Align.CENTER}
                    css={`
                        border-radius: ${rounding}px;
                        padding: 6px;
                    `}
                >
                    <eventbox
                        onClick={(self, e) => {
                            if (e.button !== Astal.MouseButton.PRIMARY) return;
                            self.get_toplevel().get_toplevel()!.destroy();
                        }}
                    >
                        <box>
                            <box className={"NotificationIcon"}>
                                <icon
                                    css={`
                                        font-size: 38px;
                                    `}
                                    icon={appIcon}
                                />
                            </box>
                            <Space space={10} />
                            <label
                                label={appName}
                                css={"font-size: 14px;"}
                                hexpand={true}
                                halign={Gtk.Align.START}
                            />
                            <label
                                label={count.toString()}
                                halign={Gtk.Align.END}
                                css={"font-size: 14px;"}
                            />
                            <Space space={4} />
                        </box>
                    </eventbox>
                    <EventIcon
                        setup={(self) => setHoverClassName(self, "NotificationIconClearButton")}
                        onClick={(self, e) => {
                            if (e.button !== Astal.MouseButton.PRIMARY) return;
                            const revealer = self.parent.parent.parent as Widget.Revealer;
                            revealer.set_reveal_child(false);
                            notifd.notifications.forEach((nn) => {
                                if (nn.appName === appName) {
                                    nn.dismiss();
                                }
                            });
                        }}
                        iconName={"edit-delete-symbolic"}
                        size={28}
                        halign={Gtk.Align.END}
                    />
                </box>
            </eventbox>
        </revealer>
    );
}
export default function NotificationTooltip({
    forward,
    trigger,
    onHover = () => {},
    onHoverLost = () => {},
    onDestroy = () => {},
}: {
    forward: "bottom" | "top" | "left" | "right";
    trigger: Gtk.Widget;
    onHover?: (self: Astal.Window, event: Astal.HoverEvent) => void;
    onHoverLost?: (self: Astal.Window, event: Astal.HoverEvent) => void;
    onDestroy?: (self: Astal.Window) => void;
}) {
    const apps = new Apps.Apps().get_list();

    const notifd = Notifd.get_default();
    const ns = Array.from(notifd.notifications);
    return (
        <PopupWindow forward={forward} trigger={trigger}>
            <eventbox
                onHover={(self, e) => onHover(self.parent as Astal.Window, e)}
                onHoverLost={(self, e) => onHoverLost(self.parent as Astal.Window, e)}
                onDestroy={(self) => onDestroy(self.parent as Astal.Window)}
            >
                <box
                    className={"NotificationTooltip"}
                    vertical={true}
                    widthRequest={300}
                    hexpand={true}
                    css={`
                        padding: 12px;
                    `}
                >
                    <box hexpand={true} halign={Gtk.Align.FILL} valign={Gtk.Align.START}>
                        <EventIcon iconName={"notifications-disabled-symbolic"} size={32} />
                        <label label={"勿扰"} />
                        <switch
                            hexpand={true}
                            halign={Gtk.Align.END}
                            setup={(self) => {
                                self.state = notifd.dontDisturb;
                                self.hook(bind(notifd, "dontDisturb"), () => {
                                    self.state = notifd.dontDisturb;
                                });
                                self.connect("state-changed", () => {
                                    notifd.set_dont_disturb(self.state);
                                });
                            }}
                        />
                    </box>
                    <box vertical={true}>
                        {(() => {
                            const filtered = new Map<
                                string,
                                { appName: string; appIcon: string; count: number }
                            >();
                            ns.forEach((n) => {
                                if (!filtered.has(n.appName)) {
                                    let icon: string = n.appIcon;
                                    if (icon === "") {
                                        icon = "applications-system-symbolic";
                                        const desktop = apps.find(
                                            (d) =>
                                                d.get_entry() ===
                                                n.desktopEntry.toLowerCase() + ".desktop"
                                        );
                                        if (desktop) icon = desktop.iconName;
                                    }
                                    filtered.set(n.appName, {
                                        appName: n.appName,
                                        appIcon: icon,
                                        count: 0,
                                    });
                                }
                                filtered.get(n.appName)!.count++;
                            });
                            return Array.from(filtered.values()).map((n) =>
                                Item({
                                    notifd,
                                    ...n,
                                })
                            );
                        })()}
                    </box>
                </box>
            </eventbox>
        </PopupWindow>
    ) as Astal.Window;
}

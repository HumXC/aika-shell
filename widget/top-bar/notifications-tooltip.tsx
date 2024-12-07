import { Astal, Gtk, Widget } from "astal/gtk3";
import PopupWindow from "../base/popup-window";
import { bind } from "astal";
import { EventIcon, Space } from "../base";
import Notifd from "gi://AstalNotifd";
import { setHoverClassName } from "../../utils";
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
    return (
        <revealer
            transitionDuration={100}
            transitionType={Gtk.RevealerTransitionType.SLIDE_DOWN}
            revealChild={true}
        >
            <eventbox setup={(self) => setHoverClassName(self, "PopupWindowItem")}>
                <box
                    className={"PopupWindowItem"}
                    halign={Gtk.Align.FILL}
                    valign={Gtk.Align.CENTER}
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
                                    icon={appIcon === "" ? "applications-system-symbolic" : appIcon}
                                    css={`
                                        font-size: 26px;
                                    `}
                                />
                            </box>
                            <Space space={10} />
                            <label
                                label={appName}
                                css={"font-size: 16px;"}
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
                            notifd.notifications.forEach((nn) => {
                                if (nn.appName === appName) {
                                    nn.dismiss();
                                }
                            });
                            const revealer = self.parent.parent.parent as Widget.Revealer;
                            revealer.set_reveal_child(false);
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
    const notifd = Notifd.get_default();
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
                    widthRequest={250}
                    hexpand={true}
                    css={`
                        padding: 10px;
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
                    <box
                        heightRequest={16}
                        visible={bind(notifd, "notifications").as((ns) => {
                            return ns.length > 0;
                        })}
                    />
                    <box spacing={8} vertical={true}>
                        {(() => {
                            const filtered = new Map<
                                string,
                                { appName: string; appIcon: string; count: number }
                            >();
                            notifd.notifications.forEach((n) => {
                                if (!filtered.has(n.appName)) {
                                    filtered.set(n.appName, {
                                        appName: n.appName,
                                        appIcon: n.appIcon,
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

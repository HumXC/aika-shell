import { Astal, Gtk } from "astal/gtk3";
import PopupWindow from "./base/popup-window";
import { bind, timeout } from "astal";
import { EventIcon, Space } from "./base";
import Notifd from "gi://AstalNotifd";
import { setHoverClassName } from "../utils";

export default function NotificationTooltip({
    forward,
    trigger,
    onHover = () => {},
    onHoverLost = () => {},
}: {
    forward: "bottom" | "top" | "left" | "right";
    trigger: Gtk.Widget;
    onHover?: (self: Astal.Window, event: Astal.HoverEvent) => void;
    onHoverLost?: (self: Astal.Window, event: Astal.HoverEvent) => void;
}) {
    const notifd = Notifd.get_default();

    return (
        <PopupWindow forward={forward} trigger={trigger}>
            <eventbox
                onHover={(self, e) => onHover(self.parent as Astal.Window, e)}
                onHoverLost={(self, e) => onHoverLost(self.parent as Astal.Window, e)}
            >
                <box
                    className={"NotificationTooltip"}
                    vertical={true}
                    spacing={8}
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
                                    notifd.dontDisturb = self.state;
                                });
                            }}
                        />
                    </box>
                    {/* <box
                        heightRequest={8}
                        visible={bind(notifd, "notifications").as((ns) => ns.length > 0)}
                    /> */}
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
                        return Array.from(filtered.values()).map((n) => {
                            return (
                                <box halign={Gtk.Align.FILL} valign={Gtk.Align.CENTER}>
                                    <box className={"NotificationIcon"}>
                                        <icon
                                            icon={
                                                n.appIcon === ""
                                                    ? "applications-system-symbolic"
                                                    : n.appIcon
                                            }
                                            css={`
                                                font-size: 26px;
                                                margin: 6px;
                                            `}
                                        />
                                    </box>
                                    <Space space={4} />
                                    <label
                                        label={n.appName}
                                        css={"font-size: 16px;"}
                                        hexpand={true}
                                        halign={Gtk.Align.START}
                                    />
                                    <label
                                        label={n.count.toString()}
                                        halign={Gtk.Align.END}
                                        css={"font-size: 14px;"}
                                    />
                                    <Space space={4} />
                                    <EventIcon
                                        setup={(self) =>
                                            setHoverClassName(self, "NotificationIconClearButton")
                                        }
                                        onClick={(self, e) => {
                                            if (e.button !== Astal.MouseButton.PRIMARY) return;
                                            notifd.notifications.forEach((nn) => {
                                                if (nn.appName === n.appName) {
                                                    nn.dismiss();
                                                }
                                            });
                                            const box = self.parent.parent;
                                            self.parent.visible = false;
                                        }}
                                        iconName={"edit-delete-symbolic"}
                                        size={28}
                                        halign={Gtk.Align.END}
                                    />
                                </box>
                            );
                        });
                    })()}
                </box>
            </eventbox>
        </PopupWindow>
    ) as Astal.Window;
}
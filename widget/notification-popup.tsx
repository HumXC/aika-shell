import { Astal, Gtk, Widget } from "astal/gtk3";
import Notifd from "gi://AstalNotifd";
import {
    createRoundedMask,
    getHyprlandGaps,
    getHyprlandRounding,
    getHyprloandOption,
    setHoverClassName,
} from "../utils";
import { Binding, idle, timeout, Variable } from "astal";
import Pango from "gi://Pango?version=1.0";
import { Space } from "./base";
import { BindableChild } from "astal/gtk3/astalify";
import TransitionInOut from "./base/transition-in-out";

function Notification({
    n,
    gaps,
    rounding,
}: {
    n: Notifd.Notification;
    gaps: number[];
    rounding: number;
}) {
    let isClosed = false;
    let box: Widget.Box = null as any;
    let onHover = false;
    const duration = 100;
    const close = () => {
        if (isClosed || onHover) return;
        isShow.set(false);
        timeout(duration, () => idle(() => box.destroy()));
        isClosed = true;
    };
    const isShow = Variable(false);
    return (
        <TransitionInOut isShow={isShow()} duration={duration}>
            <box
                setup={(self) => {
                    idle(() => isShow.set(true));
                    box = self;
                    timeout(5000, () => {
                        close();
                    });
                }}
                css={`
                    margin: ${gaps[0]}px ${gaps[1]}px 0 ${gaps[3]}px;
                    border-radius: ${rounding}px;
                `}
                className={"PopupWindow NotificationPopup"}
                widthRequest={320}
                valign={Gtk.Align.FILL}
            >
                <eventbox
                    css={`
                        border-radius: ${rounding}px;
                    `}
                    setup={(self) => setHoverClassName(self, "PopupWindowItem")}
                    onClick={(self, e) => {
                        if (e.button !== Astal.MouseButton.PRIMARY) return;
                        onHover = false;
                        close();
                        n.actions.forEach((a) => {
                            if (a.id === "default") n.invoke(a.id);
                        });
                    }}
                    onHover={() => (onHover = true)}
                    onHoverLost={() => {
                        onHover = false;
                        timeout(3000, () => {
                            close();
                        });
                    }}
                >
                    <box className={"NotificationContent"} vertical={true}>
                        <box>
                            <icon
                                // @ts-ignore
                                onDraw={(self: Widget.Icon, cr: any) => {
                                    if (!n.image) return;
                                    createRoundedMask(cr, 0, 0, 48, 48, rounding);
                                    cr.clip();
                                }}
                                setup={(self) => {
                                    if (!n.image) return;
                                    self.css = "font-size: 48px;";
                                }}
                                icon={n.image || n.appIcon || "applications-system-symbolic"}
                                css={`
                                    font-size: 40px;
                                    margin: 2px;
                                `}
                            />
                            <box vertical={true} halign={Gtk.Align.START} marginStart={12}>
                                <box hexpand={true}>
                                    <label
                                        label={n.summary}
                                        css={"font-size: 14px;"}
                                        halign={Gtk.Align.START}
                                        ellipsize={Pango.EllipsizeMode.END}
                                        wrapMode={Pango.WrapMode.CHAR}
                                    />
                                    <label
                                        marginStart={4}
                                        label={n.appName}
                                        hexpand={true}
                                        css={"font-size: 12px; color: #888;"}
                                        halign={Gtk.Align.START}
                                        valign={Gtk.Align.END}
                                    />
                                </box>
                                <Space space={2} useVertical={true} />
                                <label
                                    label={n.body}
                                    ellipsize={Pango.EllipsizeMode.END}
                                    css={"font-size: 12px; color: #e3e3e3;"}
                                    hexpand={true}
                                    halign={Gtk.Align.START}
                                />
                            </box>
                        </box>
                        <box
                            marginTop={12}
                            halign={Gtk.Align.FILL}
                            spacing={6}
                            visible={n.actions.length > 1}
                        >
                            {n.actions.map((a) => {
                                return (
                                    <button
                                        label={a.label}
                                        onClick={() => {
                                            onHover = false;
                                            close();
                                            n.invoke(a.id);
                                        }}
                                    />
                                );
                            })}
                        </box>
                    </box>
                </eventbox>
            </box>
        </TransitionInOut>
    );
}
export default function NotifactionPopup({ notificationID: id }: { notificationID: number }) {
    const notifd = Notifd.get_default();
    const gaps = getHyprlandGaps();
    const rounding = getHyprlandRounding();
    return (
        <window
            title={"NotificationPopup"}
            namespace={"popup-window"}
            layer={Astal.Layer.TOP}
            anchor={Astal.WindowAnchor.RIGHT | Astal.WindowAnchor.TOP}
            css={"background: transparent;"}
            exclusivity={Astal.Exclusivity.NORMAL}
        >
            <box
                setup={(self) => {
                    self.connect("remove", () => {
                        if (self.get_children().length === 0) self.parent.destroy();
                    });
                    self.hook(notifd, "notified", (_, id) => {
                        if (notifd.dontDisturb) return;
                        self.add(Notification({ n: notifd.get_notification(id), gaps, rounding }));
                    });
                }}
                vertical={true}
            >
                <Notification n={notifd.get_notification(id)} gaps={gaps} rounding={rounding} />
            </box>
        </window>
    );
}

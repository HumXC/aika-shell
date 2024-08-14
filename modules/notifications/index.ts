const notifications = await Service.import("notifications");
import Pango from "types/@girs/pango-1.0/pango-1.0";
import { Notification as NotificationType } from "types/service/notifications";
const InnerAnimationTime = 100;
const OuterAnimationTime = 300;
function Animated(id: number) {
    const n = notifications.getNotification(id)!;
    const widget = Notification(n);
    const inner = Widget.Revealer({
        transition: "slide_left",
        transition_duration: InnerAnimationTime,
        child: widget,
    });

    const outer = Widget.Revealer({
        transition: "crossfade",
        transition_duration: OuterAnimationTime,
        child: inner,
    });

    const box = Widget.Box({
        hpack: "end",
        child: outer,
    });

    Utils.idle(() => {
        outer.reveal_child = true;
        Utils.timeout(OuterAnimationTime, () => {
            inner.reveal_child = true;
        });
    });

    return Object.assign(box, {
        can_destory: false,
        dismiss() {
            outer.reveal_child = false;
            Utils.timeout(OuterAnimationTime, () => {
                inner.reveal_child = false;
                Utils.timeout(InnerAnimationTime + 100, () => {
                    this.can_destory = true;
                    box.destroy();
                });
            });
        },
    });
}

function NotificationIcon({ app_entry, app_icon, image }: NotificationType) {
    if (image) {
        return Widget.Box({
            width_request: 50,
            height_request: 50,
            css:
                "border-radius: 10px;" +
                `background-image: url("${image}");` +
                "background-size: contain;" +
                "background-repeat: no-repeat;" +
                "background-position: center;",
        });
    }

    let icon = "dialog-information-symbolic";
    if (Utils.lookUpIcon(app_icon)) icon = app_icon;

    if (app_entry && Utils.lookUpIcon(app_entry)) icon = app_entry;

    return Widget.Box({
        child: Widget.Icon({
            icon: icon,
            size: 44,
            css: "border-radius: 10px;padding:3px;",
        }),
    });
}
function PopupList() {
    const map: Map<number, ReturnType<typeof Animated>> = new Map();
    const box = Widget.Box({
        hpack: "end",
        class_name: "notifications",
        vertical: true,
        spacing: 8,
    });
    interface Destroyable {
        destroy: () => void;
        can_destory: boolean;
    }
    const destroys: Destroyable[] = [];
    let notifying = false;
    function remove(_: unknown, id: number) {
        const w = map.get(id);
        if (!w) return;
        w.dismiss();
        map.delete(id);
        destroys.push(w);
        // if (map.size === 0) {
        //     notifying = false;
        //     Utils.timeout(OuterAnimationTime * 2 + InnerAnimationTime * 2 + 300, () => {
        //         if (notifying) return;
        //         while (destroys.length) {
        //             const dest = destroys.pop();
        //             if (!dest) continue;
        //             if (dest.can_destory) {
        //                 dest.destroy();
        //             } else {
        //                 destroys.push(dest);
        //             }
        //         }
        //     });
        // }
    }

    return box
        .hook(
            notifications,
            (_, id: number) => {
                if (id !== undefined) {
                    if (map.has(id)) remove(null, id);
                    if (notifications.dnd) return;
                    notifying = true;
                    const w = Animated(id);
                    map.set(id, w);
                    box.children = [w, ...box.children];
                }
            },
            "notified"
        )
        .hook(notifications, remove, "dismissed")
        .hook(notifications, remove, "closed");
}
function Notification(n: NotificationType) {
    let t = n.timeout;
    const progress = Widget.ProgressBar({
        hexpand: true,
        class_name: "notification-progress",
        value: 1,
    });
    let interval = setInterval(() => {
        t -= 15;
        progress.value = t / n.timeout;
        if (t <= 0) {
            clearInterval(interval);
            progress.value = 0;
        }
    }, 15);
    progress.on("destroy", () => clearInterval(interval));

    const actions_box = Widget.Box({
        hpack: "center",
        hexpand: true,
        spacing: 8,
    });
    const eb = Widget.EventBox({
        width_request: 400,
        height_request: 1,
        hpack: "start",
        class_name: "notification",
        child: Widget.Box({
            vertical: true,
            children: [
                Widget.Box({
                    class_name: "notification-box",
                    children: [
                        Widget.Box({
                            class_name: "notification-icon",
                            width_request: 70,
                            height_request: 70,
                            child: NotificationIcon(n),
                        }),
                        Widget.Box({
                            vertical: true,
                            children: [
                                Widget.Label({
                                    hexpand: true,
                                    hpack: "start",
                                    class_name: "notification-title",
                                    label: n.summary,
                                    max_width_chars: 30,
                                }),
                                Widget.Label({
                                    hpack: "start",
                                    hexpand: true,
                                    class_name: "notification-body",
                                    max_width_chars: 40,
                                    wrap_mode: Pango.WrapMode.WORD_CHAR,
                                    wrap: true,
                                    label: n.body,
                                }),
                                Widget.Box({
                                    vexpand: true,
                                    child: progress,
                                    css: "padding: 5px 8px 5px 0px;",
                                }),
                            ],
                        }),
                    ],
                }),
                actions_box,
            ],
        }),
    });
    eb.on_secondary_click = () => {
        n.close();
    };
    n.actions.forEach((a) => {
        if (a.id === "default") {
            eb.on_primary_click = () => {
                n.close();
                n.invoke("default");
            };
            return;
        }
        print(a.id);
        const w = Widget.Box({
            css: "padding-bottom: 5px;",
            child: Widget.EventBox({
                class_name: "notification-action",
                on_primary_click: () => {
                    n.close();
                    n.invoke(a.id);
                },
                child: Widget.Label({
                    class_name: "notification-action-label",
                    label: a.label,
                }),
            }),
        });

        actions_box.children = [w, ...actions_box.children];
    });

    return eb;
}
function Notifications() {
    const w = Widget.Window({
        name: `notifications`,
        anchor: ["top", "right"],
        exclusivity: "ignore",
        layer: "overlay",
        margins: [47, 0, 0, 0],
        css: "background: transparent;",
        keymode: "none",
        child: PopupList(),
    });

    return w;
}
export { Notifications };

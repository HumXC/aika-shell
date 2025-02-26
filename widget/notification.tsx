import { App, Astal, Gtk, Gdk, hook, Widget } from "astal/gtk4";
import Gsk from "gi://Gsk";
import { bind, GLib, idle, timeout, Variable } from "astal";
import Notifd from "gi://AstalNotifd";
import Pango from "gi://Pango?version=1.0";
import GdkPixbuf from "gi://GdkPixbuf";
import { Label } from "astal/gtk4/widget";
import Cairo from "gi://cairo";
import Graphene from "gi://Graphene?version=1.0";
class RoundImage extends Gtk.Image {}
export function Window(gdkmonitor: Gdk.Monitor) {
    const { TOP, RIGHT } = Astal.WindowAnchor;
    const box: Astal.Box = <box vertical spacing={8} heightRequest={1} widthRequest={1} />;
    const window = (
        <window
            visible
            cssName="notification"
            namespace={"popup-window"}
            cssClasses={["window"]}
            gdkmonitor={gdkmonitor}
            exclusivity={Astal.Exclusivity.EXCLUSIVE}
            anchor={RIGHT | TOP}
            application={App}
            marginTop={10}
            marginRight={8}
        >
            {box}
        </window>
    );
    function push(n: Notifd.Notification) {
        box.children = [Popup(n), ...box.children];
    }
    return { window, push };
}
function Popup(n: Notifd.Notification) {
    const isHovered = Variable(false);
    var isInTrash = false;
    var box: Astal.Box = null as any;

    function destroy() {
        const parent = box.parent as Astal.Box;
        parent.remove(box);
        if (parent.children.length <= 0) (parent.parent as Gtk.Window).close();
    }
    function Top() {
        return (
            <box
                setup={(self) => {
                    if (n.image) {
                        const drawArea = new Gtk.DrawingArea();
                        drawArea.set_size_request(48, 48);
                        const drawFunc: Gtk.DrawingAreaDrawFunc = (
                            drawing_area: Gtk.DrawingArea,
                            cr: Cairo.Context,
                            width: number,
                            height: number
                        ) => {
                            let pixbuf = GdkPixbuf.Pixbuf.new_from_file(n.image);
                            pixbuf = pixbuf.scale_simple(48, 48, GdkPixbuf.InterpType.BILINEAR)!;
                            Gdk.cairo_set_source_pixbuf(cr, pixbuf, 0, 0);
                            createRoundedMask(cr, 0, 0, 48, 48, 12);
                            // @ts-ignore
                            cr.clip();
                            // @ts-ignore
                            cr.paint();
                        };
                        drawArea.set_draw_func(drawFunc);
                        self.children = [drawArea, ...self.children];
                    } else {
                        const image = Widget.Image({
                            iconName: n.appIcon === "" ? "applications-system-symbolic" : n.appIcon,
                            iconSize: Gtk.IconSize.LARGE,
                            pixelSize: 48,
                        });
                        self.children = [image, ...self.children];
                    }
                }}
            >
                <box vertical marginStart={8}>
                    <box>
                        <label
                            halign={Gtk.Align.START}
                            label={n.summary.split("\n")[0]}
                            ellipsize={Pango.EllipsizeMode.END}
                            wrap
                            maxWidthChars={1}
                            cssClasses={["notification-title"]}
                            marginTop={2}
                        />
                        <label
                            cssClasses={["notification-app-name"]}
                            marginStart={2}
                            visible={isHovered((v) => !v)}
                            marginTop={2}
                            halign={Gtk.Align.START}
                            label={n.appName}
                        />
                        <box hexpand />
                        <image
                            halign={Gtk.Align.END}
                            marginStart={8}
                            marginTop={2}
                            iconName={"user-trash-symbolic"}
                            iconSize={Gtk.IconSize.NORMAL}
                            setup={(self) => {
                                const ctl = Gtk.EventControllerLegacy.new();
                                ctl.connect("event", (_, event: Gdk.Event) => {
                                    if (
                                        isHovered.get() &&
                                        event.get_event_type() === Gdk.EventType.BUTTON_RELEASE
                                    ) {
                                        const e = event as Gdk.ButtonEvent;
                                        if (e.get_button() === Gdk.BUTTON_PRIMARY) {
                                            isInTrash = true;
                                            n.dismiss();
                                            destroy();
                                        }
                                    }
                                });
                                self.add_controller(ctl);
                            }}
                        />
                    </box>
                    <box>
                        <label
                            cssClasses={["notification-body"]}
                            visible={isHovered((v) => !v)}
                            ellipsize={Pango.EllipsizeMode.END}
                            marginTop={4}
                            maxWidthChars={1}
                            wrap
                            label={n.body.split("\n")[0]}
                        />
                        <label
                            marginTop={4}
                            cssClasses={["notification-app-name"]}
                            visible={isHovered()}
                            label={n.appName}
                        />
                    </box>
                </box>
            </box>
        );
    }
    function Body() {
        return (
            <box marginTop={8} visible={isHovered()}>
                <label
                    cssClasses={["notification-body"]}
                    label={n.body}
                    wrap
                    wrapMode={Pango.WrapMode.WORD_CHAR}
                    maxWidthChars={1}
                />
            </box>
        );
    }
    function Actions() {
        return (
            <box visible={n.actions.length > 1}>
                {n.actions.map((a, i) => {
                    return (
                        <button
                            onClicked={() => {
                                n.invoke(a.id);
                                destroy();
                            }}
                        >
                            {a.label}
                        </button>
                    );
                })}
            </box>
        );
    }
    return (
        <box
            cssClasses={["popup"]}
            widthRequest={320}
            valign={Gtk.Align.FILL}
            setup={(self) => {
                box = self;
                const motionCtl = Gtk.EventControllerMotion.new();
                motionCtl.connect("enter", () => isHovered.set(true));
                motionCtl.connect("leave", () => isHovered.set(false));

                const clickCtl = Gtk.EventControllerLegacy.new();
                clickCtl.connect("event", (_, event: Gdk.Event) => {
                    if (
                        isHovered.get() &&
                        event.get_event_type() === Gdk.EventType.BUTTON_RELEASE
                    ) {
                        const e = event as Gdk.ButtonEvent;
                        // 此处 idle 防止与删除通知的点击事件冲突
                        idle(() => {
                            if (isInTrash) return;
                            print("delete");
                            if (e.get_button() === Gdk.BUTTON_PRIMARY) {
                                const defaultAction = n.actions.find((a) => a.id === "default");
                                if (defaultAction) n.invoke(defaultAction.id);
                            }
                            destroy();
                        });
                    }
                });
                self.add_controller(motionCtl);
                self.add_controller(clickCtl);
                self.show();
            }}
        >
            <box
                vertical
                valign={Gtk.Align.FILL}
                marginTop={8}
                marginBottom={8}
                marginStart={8}
                marginEnd={8}
            >
                {Top()}
                {Body()}
                {Actions()}
            </box>
        </box>
    );
}
export function createRoundedMask(
    cr: any,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
) {
    cr.newPath();
    cr.moveTo(x + radius, y);
    cr.lineTo(x + width - radius, y);
    cr.arc(x + width - radius, y + radius, radius, 1.5 * Math.PI, 2 * Math.PI); // Top-right corner
    cr.lineTo(x + width, y + height - radius);
    cr.arc(x + width - radius, y + height - radius, radius, 0, 0.5 * Math.PI); // Bottom-right corner
    cr.lineTo(x + radius, y + height);
    cr.arc(x + radius, y + height - radius, radius, 0.5 * Math.PI, Math.PI); // Bottom-left corner
    cr.lineTo(x, y + radius);
    cr.arc(x + radius, y + radius, radius, Math.PI, 1.5 * Math.PI); // Top-left corner
    cr.closePath();
}

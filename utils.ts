import { AstalIO, timeout } from "astal";
import { Astal, Gdk, Gtk } from "astal/gtk4";

function addHoverController(
    widget: Gtk.Widget,
    delay: number,
    hover: (self: Gtk.Widget) => void = () => {},
    leave: (self: Gtk.Widget) => void = () => {}
) {
    const ctl = Gtk.EventControllerMotion.new();
    let isHovering = false;
    let timer: AstalIO.Time | null = null;
    ctl.connect("enter", () => {
        timer = timeout(delay, () => {
            if (!isHovering) {
                isHovering = true;
                hover(widget);
            }
        });
    });
    ctl.connect("leave", () => {
        if (timer) timer.cancel();
        isHovering = false;
        leave(widget);
    });
    widget.add_controller(ctl);
}

function addClickController(
    widget: Gtk.Widget,
    mode: "onRelease" | "onPress",
    callback: (self: Gtk.Widget, gdkButton: number, x: number, y: number) => void
) {
    const clickCtl = Gtk.EventControllerLegacy.new();
    let clickType = Gdk.EventType.BUTTON_PRESS;
    let isEntering = false;
    if (mode === "onRelease") clickType = Gdk.EventType.BUTTON_RELEASE;
    clickCtl.connect("event", (_, event: Gdk.Event) => {
        if (event.get_event_type() === clickType && isEntering) {
            const e = event as Gdk.ButtonEvent;
            const p = e.get_position();
            callback(widget, e.get_button(), p[1], p[2]);
        }
    });
    widget.add_controller(clickCtl);
    addHoverController(
        widget,
        0,
        () => (isEntering = true),
        () => (isEntering = false)
    );
}

function addScrollController(widget: Gtk.Widget, callback: (self: Gtk.Widget, dy: number) => void) {
    const ctl = Gtk.EventControllerScroll.new(Gtk.EventControllerScrollFlags.VERTICAL);
    ctl.connect("scroll", (e, dx, dy) => callback(widget, dy));
    widget.add_controller(ctl);
}
export { addHoverController, addClickController, addScrollController };

import { Astal, ConstructProps, Gdk, Gtk, astalify } from "astal/gtk3";

function getMonitorSize(widget: Gtk.Widget) {
    const rect = new Gdk.Rectangle();
    const screen = widget.get_screen();
    const monitor = screen.get_monitor_geometry(screen.get_primary_monitor());
    const scaleFactor = screen.get_monitor_scale_factor(screen.get_primary_monitor());
    if (monitor?.width) rect.width = monitor.width * scaleFactor;
    if (monitor?.height) rect.height = monitor.height * scaleFactor;
    return rect;
}
function getRealLocation(widget: Gtk.Widget) {
    let w = widget;

    for (let i = 0; i < 10; i++) {
        const al = w.get_allocation();
        print(al.x, al.y, al.width, al.height);
        if (w.get_toplevel) w = w.get_toplevel();
        else break;
    }
}

export default function PopupWindow(trigger: Gtk.Widget) {
    const size = getMonitorSize(trigger);
    getRealLocation(trigger);
    return (
        <window
            decorated={false}
            resizable={true}
            title="PopupWindow"
            anchor={
                Astal.WindowAnchor.TOP |
                Astal.WindowAnchor.LEFT |
                Astal.WindowAnchor.RIGHT |
                Astal.WindowAnchor.BOTTOM
            }
            className={"PopupWindow"}
        >
            <box
                setup={(self) => {
                    self.set_allocation(trigger.get_allocation());
                }}
                widthRequest={200}
                heightRequest={200}
                className={"FloatingMenu"}
            ></box>
        </window>
    );
}

import Gtk from "gi://Gtk?version=3.0";
var RegularWindow = Widget.subclass(Gtk.Window);

function RightBar() {
    return RegularWindow({
        name: `right-bar`,
        class_name: "right-bar",
        vexpand: true,
        title: "Settings",
        default_height: 600,
        default_width: 850,
        visible: true,
        resizable: false,

        child: Widget.Box({
            width_request: 30,
            height_request: 100,
        }),
    });
}

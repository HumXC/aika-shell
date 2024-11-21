import { App, Astal, Gdk, Gtk } from "astal/gtk3";
import { Register as R } from "../RequestHandler";
import { exec, GLib, subprocess, writeFile, writeFileAsync } from "astal";
import GdkPixbuf from "gi://GdkPixbuf?version=2.0";
import { DrawingArea } from "astal/gtk3/widget";
import cairo from "gi://cairo?version=1.0";
import Json from "gi://Json?version=1.0";

function Window(gdkmonitor: Gdk.Monitor) {
    exec(["grim", "-l", "0", "/tmp/screenshot.png"]);
    const pixbuf = GdkPixbuf.Pixbuf.new_from_file("/tmp/screenshot.png");

    return (
        <window
            className="ScreenShot"
            gdkmonitor={gdkmonitor}
            decorated={false}
            keymode={Astal.Keymode.EXCLUSIVE}
            exclusivity={Astal.Exclusivity.IGNORE}
            layer={Astal.Layer.OVERLAY}
            events={Gdk.EventMask.BUTTON_PRESS_MASK | Gdk.EventMask.BUTTON_RELEASE_MASK}
            anchor={
                Astal.WindowAnchor.TOP |
                Astal.WindowAnchor.LEFT |
                Astal.WindowAnchor.RIGHT |
                Astal.WindowAnchor.BOTTOM
            }
            onKeyPressEvent={(self, e) => {
                switch (e.get_keyval()[1]) {
                    case Gdk.KEY_Escape:
                        self.close();
                        break;
                    default:
                        break;
                }
            }}
            application={App}
            namespace={"top-bar"}
            setup={(self) => {
                self.connect("motion-notify-event", (self) => {
                    print("Mouse moved");
                });
                self.connect("button-press-event", (self, e: Gdk.Event) => {
                    switch (e.get_button()[1]) {
                        case Gdk.BUTTON_PRIMARY:
                            break;
                        case Gdk.BUTTON_SECONDARY:
                            break;
                        case Gdk.BUTTON_MIDDLE:
                            break;
                    }
                });
            }}
        >
            <drawingarea
                setup={(self) => {
                    const alloc = gdkmonitor.get_geometry();
                    const scaleFactor = gdkmonitor.get_scale_factor();
                    self.set_size_request(alloc.width * scaleFactor, alloc.height * scaleFactor);

                    self.connect("draw", (da: DrawingArea, cr: cairo.Context) => {
                        // @ts-ignore
                        Gdk.cairo_set_source_pixbuf(cr, pixbuf, 0, 0);
                        // @ts-ignore
                        cr.paint();
                    });
                }}
            ></drawingarea>
        </window>
    );
}
function Register() {
    R("screenshot", () => {
        print("Screenshot taken");
        App.get_monitors().forEach((monitor) => {
            Window(monitor);
        });
    });
}

export default Register;

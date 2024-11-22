import { App, Astal, Gdk, Gtk, Widget } from "astal/gtk3";
import { exec, execAsync, Gio } from "astal";

function Window(gdkmonitor: Gdk.Monitor, index: number, args: string[]) {
    let imgType = "png";
    for (let i = args.indexOf("-t"); i !== -1; ) {
        imgType = args[i + 1];
        break;
    }
    const img = `/tmp/screenshot-${index}.${imgType}`;
    exec(["bash", "-c", "grim " + args.join(" ") + " " + img]);
    return (
        <window
            onDestroy={() => {
                execAsync(["rm", img]);
            }}
            className="ScreenMask"
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
            namespace={"screen-mask"}
            css={`
                background-image: url("${img}");
            `}
            setup={(self) => {
                const alloc = gdkmonitor.get_geometry();
                const scaleFactor = gdkmonitor.get_scale_factor();
                self.set_size_request(alloc.width * scaleFactor, alloc.height * scaleFactor);
            }}
        ></window>
    );
}
function Handler(request: string) {
    const req = request.split(" ").filter((s) => s.length > 0);
    let args = [];
    let cmd = "";
    for (let i = 1; i < req.length; i++) {
        const c = req[i];
        if (["-s", "-g", "-t", "-q", "-l", "-o"].indexOf(c) != -1) {
            i++;
            args.push(c);
            args.push(req[i]);
            continue;
        } else if (c === "-c") {
            args.push(c);
            continue;
        }
        cmd = req.slice(i).join(" ");
        break;
    }
    const windows: Gtk.Widget[] = [];
    const close = () => {
        // @ts-ignore
        windows.forEach((window) => window.close());
    };
    const monitors = App.get_monitors();
    for (let i = 0; i < monitors.length; i++) {
        const monitor = monitors[i];
        try {
            windows.push(Window(monitor, i, args));
        } catch (error) {
            close();
            // @ts-ignore
            return error.message;
        }
    }

    try {
        const result = exec(["bash", "-c", cmd]);
        close();
        return result;
    } catch (error) {
        close();
        // @ts-ignore
        return error.message;
    }
}
export { Handler, Window };

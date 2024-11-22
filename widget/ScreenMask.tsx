import { App, Astal, Gdk } from "astal/gtk3";
import { exec, execAsync, Gio } from "astal";

function Window(gdkmonitor: Gdk.Monitor, index: number) {
    const img = `/tmp/screenshot-${index}.png`;
    exec(["grim", "-l", "0", img]);
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
            namespace={"top-bar"}
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
    const windows = App.get_monitors().map((monitor, index) => {
        return Window(monitor, index);
    });
    const close = () => {
        // @ts-ignore
        windows.forEach((window) => window.close());
    };
    try {
        const result = exec(["bash", "-c", request.replace("screenmask ", "")]);
        close();
        return result;
    } catch (error) {
        close();
        // @ts-ignore
        return error.message;
    }
}
export { Handler, Window };

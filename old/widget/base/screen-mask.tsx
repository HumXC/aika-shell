import { App, Astal, Gdk } from "astal/gtk3";
import { execAsync } from "astal";

export default function Window(gdkmonitor: Gdk.Monitor, background: string) {
    return (
        <window
            onDestroy={() => {
                execAsync(["rm", background]);
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
                background-image: url("${background}");
            `}
            setup={(self) => {
                const alloc = gdkmonitor.get_geometry();
                const scaleFactor = gdkmonitor.get_scale_factor();
                self.set_size_request(alloc.width * scaleFactor, alloc.height * scaleFactor);
            }}
        ></window>
    );
}

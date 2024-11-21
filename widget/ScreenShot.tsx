import { App, Astal, Gdk } from "astal/gtk3";
import { Register as R } from "../RequestHandler";
import { exec, writeFile } from "astal";

function Window(gdkmonitor: Gdk.Monitor) {
    return (
        <window
            className="ScreenShot"
            gdkmonitor={gdkmonitor}
            decorated={false}
            keymode={Astal.Keymode.EXCLUSIVE}
            exclusivity={Astal.Exclusivity.IGNORE}
            layer={Astal.Layer.OVERLAY}
            anchor={
                Astal.WindowAnchor.TOP |
                Astal.WindowAnchor.LEFT |
                Astal.WindowAnchor.RIGHT |
                Astal.WindowAnchor.BOTTOM
            }
            onKeyPressEvent={(self, e) => {
                if (e.get_keyval()[1] === Gdk.KEY_Escape) {
                    self.close();
                }
            }}
            application={App}
            namespace={"top-bar"}
        >
            <drawingarea></drawingarea>
        </window>
    );
}
function Register() {
    R("screenshot", () => {
        print("Screenshot taken");
        App.get_monitors().forEach((monitor) => {
            Window(monitor);

            const img = exec(["grim", "-"]);
        });
    });
}

export default Register;

import { exec, GLib, Variable } from "astal";
import { Gdk, Gtk } from "astal/gtk3";
import Auth from "gi://AstalAuth";
import { Clock } from "./top-bar";
import { GetConfig } from "../configs";

function auth(password: string): Promise<void> {
    return new Promise((resolve, reject) => {
        Auth.Pam.authenticate(password, (_, task) => {
            try {
                Auth.Pam.authenticate_finish(task);
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    });
}
class LockScreenConfig {
    wallpaper: string = "";
}

export default function LockScreen() {
    let wallpaper = GetConfig(LockScreenConfig, "lockscreen").wallpaper;
    if (wallpaper !== "") {
        const allowImages = ["jpg", "jpeg", "png"];
        const ext = wallpaper.split(".").pop()?.toLowerCase();
        if (ext !== undefined && !allowImages.includes(ext)) {
            try {
                const images = exec(["ls", "-1", wallpaper])
                    .split("\n")
                    .filter((file) => {
                        const ext = file.split(".").pop()?.toLowerCase();
                        return ext !== undefined && allowImages.includes(ext);
                    });
                wallpaper += "/" + images[Math.floor(Math.random() * images.length)];
            } catch (error) {}
        }
    }
    const err = new Variable("");
    const window = new Gtk.Window({
        child: (
            <box
                className={"LockScreen"}
                css={`
                    background-image: url("${wallpaper}");
                    background-size: cover;
                    background-repeat: no-repeat;
                    background-position: center;
                    background: rgb(0, 0, 0);
                `}
            >
                <centerbox vertical={true} hexpand={true} halign={Gtk.Align.CENTER}>
                    <Clock fontSize={128} fontWeight="lighter" />
                    <box halign={Gtk.Align.CENTER} css={"padding-bottom: 192px;"}>
                        <box
                            vexpand={false}
                            heightRequest={200}
                            widthRequest={200}
                            css={`
                                background-image: url("${GLib.get_home_dir()}/.face");
                                background-size: cover;
                                background-repeat: no-repeat;
                                background-position: center;
                                border-radius: 100%;
                            `}
                        />
                    </box>
                    <box vertical={true}>
                        <entry
                            halign={Gtk.Align.CENTER}
                            activatesDefault={true}
                            visibility={false}
                            css={`
                                border-radius: 20px;
                                margin-bottom: 32px;
                            `}
                            onKeyPressEvent={(self, e) => {
                                if (e.get_keyval()[1] !== Gdk.KEY_Return) return;
                                err.set("");
                                const password = self.get_text();
                                self.editable = false;
                                auth(password)
                                    .then(() => {
                                        const window = self.parent.parent.parent
                                            .parent as Gtk.Window;
                                        window.close();
                                        return;
                                    })
                                    .catch((error) => {
                                        err.set(error.message);
                                        self.editable = true;
                                        self.grab_focus();
                                        self.select_region(0, -1);
                                    });
                            }}
                        />
                        <label halign={Gtk.Align.CENTER} label={err()} />
                    </box>
                </centerbox>
            </box>
        ),
    });

    return window;
}

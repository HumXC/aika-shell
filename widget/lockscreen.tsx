import { timeout, Variable } from "astal";
import { Astal, Gdk, Gtk } from "astal/gtk3";
import Lock from "gi://GtkSessionLock";
import { RegularWindow } from "./base";

import Auth from "gi://AstalAuth";

function auth(password: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
        Auth.Pam.authenticate(password, (_, task) => {
            try {
                Auth.Pam.authenticate_finish(task);
                resolve(true);
            } catch (error) {
                reject(error);
            }
        });
    });
}

export default function LockScreen() {
    const err = new Variable("");
    const window = new Gtk.Window({
        child: (
            <box className={"LockScreen"}>
                <entry
                    activatesDefault={true}
                    visibility={false}
                    onKeyPressEvent={(self, e) => {
                        if (e.get_keyval()[1] !== Gdk.KEY_Return) return;
                        const password = self.get_text();
                        self.editable = false;
                        auth(password)
                            .then((success) => {
                                if (success) return (self.get_toplevel() as Astal.Window).close();
                                self.editable = true;
                                self.grab_focus();
                                self.select_region(0, -1);
                            })
                            .catch((e) => {});
                    }}
                />
            </box>
        ),
    });

    return window;
}

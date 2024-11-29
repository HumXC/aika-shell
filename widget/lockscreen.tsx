import { timeout } from "astal";
import { Astal, Gdk, Gtk } from "astal/gtk3";
import Lock from "gi://GtkSessionLock";
import { RegularWindow } from "./base";
export default function LockScreen() {
    const window = new Gtk.Window({});

    return window;
}

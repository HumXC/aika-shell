import { App, Gdk, Gtk } from "astal/gtk3";
import LockScreen from "../widget/lockscreen";
import Lock from "gi://GtkSessionLock";
import { timeout } from "astal";

export default function Handler(request: string) {
    const lock = Lock.prepare_lock();
    const doLock = (window: Gtk.Window) => {
        lock.lock_lock();
        const display = Gdk.Display.get_default();
        if (!display) return;
        for (let m = 0; m < display.get_n_monitors(); m++) {
            const monitor = display.get_monitor(m);
            if (!monitor) continue;
            lock.new_surface(window, monitor);
        }
        window.show_all();
    };
    const doUnlock = (window: Gtk.Window) => {
        lock.unlock_and_destroy();
        Gdk.Display.get_default()!.sync();
    };
    const window = LockScreen();
    // doLock(window);
    // window.connect("destroy", () => {
    //     doUnlock(window);
    // });
    // timeout(5000, () => doUnlock(window));
    window.show_all();
}

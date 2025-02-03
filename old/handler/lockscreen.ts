import { App, Gdk, Gtk } from "astal/gtk3";
import LockScreen from "../widget/lockscreen";
import Lock from "gi://GtkSessionLock";

export default function Handler(request: string) {
    if (request.endsWith("dev")) {
        App.get_monitors().forEach((monitor) => LockScreen(monitor).show_all());
        return;
    }
    const lock = Lock.prepare_lock();
    const doLock = (window: Gtk.Window, monitor: Gdk.Monitor) => {
        lock.lock_lock();
        const display = monitor.get_display();
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

    App.get_monitors().map((monitor) => {
        const w = LockScreen(monitor);
        doLock(w, monitor);
        w.connect("destroy", () => {
            doUnlock(w);
        });
        return w;
    });
}

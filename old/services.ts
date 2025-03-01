import Wallpaper from "../lib/wallpaper";

import Notifd from "gi://AstalNotifd?version=0.1";
import NotifactionPopup from "./widget/notification-popup";
import { Gtk } from "astal/gtk3";

export function wallpaper() {
    Wallpaper.get_default();
}
export function notification() {
    let notifd = Notifd.get_default();
    let window: Gtk.Widget | null = null;
    notifd.connect("notified", (_, n) => {
        if (notifd.dontDisturb || window) return;
        window = NotifactionPopup({ notificationID: n });
        window.connect("destroy", () => (window = null));
    });
}

export default function services() {
    wallpaper();
    notification();
}

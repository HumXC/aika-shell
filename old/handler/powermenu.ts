import { Gtk } from "astal/gtk3";
import Powermenu from "../widget/powermenu";
let powermenu: Gtk.Window | null = null;
export default function Handler(request: string) {
    if (powermenu) return powermenu.close();
    powermenu = Powermenu() as Gtk.Window;
    powermenu.connect("destroy", () => (powermenu = null));
}

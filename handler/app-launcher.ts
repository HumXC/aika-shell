import { Gtk } from "astal/gtk3";
import Launcher from "../widget/app-launcher";
let appLauncher: Gtk.Window | null = null;
export default function AppLauncher(request: string) {
    if (appLauncher) return appLauncher.close();
    appLauncher = Launcher() as Gtk.Window;
    appLauncher.connect("destroy", () => (appLauncher = null));
}

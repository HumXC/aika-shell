import ClipBoard from "../widget/clipboard";
import Hyprland from "gi://AstalHyprland";
export default function Handler(request: string) {
    const hypr = Hyprland.get_default();
    const [clip] = hypr.clients.filter((c) => c.title === "clipboard");
    if (clip) clip.kill();
    else ClipBoard();
}

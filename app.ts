// See: https://bbs.archlinux.org/viewtopic.php?id=299624
// Run: dconf write /org/gnome/desktop/interface/cursor-size number
import { App, Astal } from "astal/gtk4";
import style from "./style.scss";
import services from "./services";
import window from "./window";
// BUG: 使用 hyprctl dispatch dpms off 关闭显示器之后，窗口会消失
services.notifaction.start();
services.time.start();
App.start({
    css: style,
    icons: `${SRC}/assets/icons`,
    instanceName: "aika-shell",
    main() {
        App.get_monitors().map((m) => {
            const bar = new window.Bar(m);
            return bar.window;
        });
    },
});

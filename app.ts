// See: https://bbs.archlinux.org/viewtopic.php?id=299624
import { App } from "astal/gtk4";
import style from "./style.scss";
import Bar from "./widget/Bar";
import { Window } from "./widget/notification";
import Notifd from "gi://AstalNotifd";
const notify = Notifd.get_default();

App.start({
    css: style,
    instanceName: "aika-shell",
    main() {
        App.get_monitors().map(Bar);
        App.get_monitors().map((m) => {
            const { window, push } = Window(m);
            notify.connect("notified", (self, id) => {
                const n = notify.get_notification(id);
                push(n);
            });
            return window;
        });
    },
});

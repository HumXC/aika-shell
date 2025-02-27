import { App } from "astal/gtk4";
import window from "../window";
import Notifd from "gi://AstalNotifd";
class NotificationService implements Service {
    name = "notification";
    private notifd = Notifd.get_default();
    private notif: window.Notification | null = null;
    private connectID = 0;
    start = () => {
        if (this.connectID !== 0) return;
        this.connectID = this.notifd.connect("notified", (self, id) => {
            if (!this.notif) {
                // TODO: 发布到聚焦的屏幕
                this.notif = new window.Notification(App.get_monitors()[0]);
                this.notif.window.connect("close-request", () => {
                    this.notif = null;
                    return false;
                });
            }
            const n = this.notifd.get_notification(id);
            if (this.notif) this.notif.push(n);
        });
    };
    stop = () => {
        if (this.notif) {
            this.notif.window.destroy();
            this.notif = null;
        }
        if (this.connectID !== 0) {
            this.connectID = 0;
            this.notifd.disconnect(this.connectID);
        }
    };
}
export default NotificationService;

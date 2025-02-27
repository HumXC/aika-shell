import { AstalIO, GLib, GObject, interval, property, register, timeout, Variable } from "astal";
class TimeService implements Service {
    name = "time";
    HM = Variable("");
    HMS = Variable("");
    private timer: AstalIO.Time | null = null;
    private update() {
        const time = GLib.DateTime.new_now_local();
        this.HM.set(time.format("%H:%M") as string);
        this.HMS.set(time.format("%H:%M:%S") as string);
    }
    start = () => {
        if (this.timer) return;
        this.update();
        const time = GLib.DateTime.new_now_local();
        timeout(time.get_microsecond() / 1000, () => {
            this.timer = interval(1000, () => {
                this.update();
            });
        });
    };
    stop = () => {
        if (this.timer) {
            this.timer.cancel();
            this.timer = null;
        }
    };
}
export default TimeService;

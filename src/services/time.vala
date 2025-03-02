public class Services.Time : Object {
    private static Time? instance;

    public static unowned Time get_default() {
        if (instance == null)
            instance = new Time();

        return instance;
    }

    public GLib.DateTime time;
    public string HM;
    public string HMS;
    public Time() {
        _update();
        GLib.Timeout.add_seconds(1, () => {
            _update();
            return true;
        }, GLib.Priority.DEFAULT);
    }

    private void _update() {
        time = new GLib.DateTime.now_local();
        HM = this.time.format("%H:%M");
        HMS = this.time.format("%H:%M:%S");
        update(this);
    }

    public signal void update(Time time);
}
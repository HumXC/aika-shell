namespace Utils {
    public delegate void addHoverControllerCallback();

    public void addHoverController(Gtk.Widget widget, addHoverControllerCallback? enter, addHoverControllerCallback? leave) {
        var ctl = new Gtk.EventControllerMotion();
        ctl.enter.connect(() => {
            if (enter != null)enter();
        });
        ctl.leave.connect(() => {
            if (leave != null)leave();
        });
        widget.add_controller(ctl);
    }

    public enum ClickType {
        ON_PRESS,
        ON_RELEASE
    }
    public delegate bool addClickControllerCallback(uint gdk_button, double x, double y);

    public void addClickController(Gtk.Widget widget, ClickType type, addClickControllerCallback click) {
        var ctl = new Gtk.EventControllerLegacy();
        ctl.event.connect((event) => {
            if (event.get_event_type() == Gdk.EventType.BUTTON_PRESS && type == ClickType.ON_PRESS) {
                var e = (Gdk.ButtonEvent) event;
                double x, y;
                e.get_position(out x, out y);
                return click(e.get_button(), x, y);
            }
            if (event.get_event_type() == Gdk.EventType.BUTTON_RELEASE && type == ClickType.ON_RELEASE) {
                var e = (Gdk.ButtonEvent) event;
                double x, y;
                e.get_position(out x, out y);
                return click(e.get_button(), x, y);
            }
            return false;
        });
        widget.add_controller(ctl);
    }
}
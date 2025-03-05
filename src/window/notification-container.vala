[GtkTemplate(ui = "/com/github/humxc/aika-shell/ui/window/notification-container.ui")]
public class Window.NotificationContainer : Astal.Window {
    [GtkChild]
    private unowned Gtk.Box box;
    public void append(AstalNotifd.Notification n) {
        var popup = new Widget.NotificationPopup(n);
        box.prepend(popup);
        box.queue_draw();
        popup.destroy.connect(() => {
            if (box.observe_children().get_n_items() == 0) {
                this.close();
            }
        });
    }

    public NotificationContainer() {
        Object(
               anchor: Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT,
               css_name: "notification-container"
        );
    }
}
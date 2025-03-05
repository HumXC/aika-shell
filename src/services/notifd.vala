public class Services.Notifd : Object {
    private static Notifd? instance;

    public static unowned Notifd get_default () {
        if (instance == null)
            instance = new Notifd ();

        return instance;
    }

    public Window.NotificationContainer? container = null;
    private AstalNotifd.Notifd astal_notifd = AstalNotifd.get_default ();
    public Notifd () {
        astal_notifd.notified.connect ((id, replaced) => {
            if (container == null) {
                container = new Window.NotificationContainer ();
                container.close_request.connect (() => {
                    container = null;
                    return false;
                });
                container.present ();
            }
            container.append (astal_notifd.get_notification (id));
        });
    }
}
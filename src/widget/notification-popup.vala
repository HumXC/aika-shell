[GtkTemplate (ui = "/com/github/humxc/aika-shell/ui/widget/notification-popup.ui")]
public class Widget.NotificationPopup : Gtk.Box {
    public string summary { get; set; }
    public string appName { get; set; }
    public string body1 { get; set; }
    public string body2 { get; set; }
    public string iconName { get; set; }
    public bool isHovered { get; set; }
    public int maxBodyChars1 { get; set; default = 24; }
    public int maxBodyChars2 { get; set; default = 50; }
    private uint timer = 0;

    int MaxBodyLength = 200;
    int CloseTimeout = 5000;
    int ImageRoundedSizePersan = 24;
    int ImageSize = 54;
    private AstalNotifd.Notification notification;
    [GtkChild]
    private unowned Gtk.Image image;
    [GtkChild]
    private unowned Gtk.Box actionBox;
    public NotificationPopup (AstalNotifd.Notification n) {
        Object (css_name: "notification-popup");
        notification = n;
        summary = n.summary;
        appName = n.app_name;
        body1 = n.body;
        if (body1.split ("\n", -1).length > 1) {
            body1 = body1.split ("\n", -1)[0] + "...";
        }
        body2 = n.body;
        if (body2.length > MaxBodyLength) {
            body2 = n.body.substring (0, MaxBodyLength) + "...";
        }
        Utils.addHoverController
            (this,
            () => {
            isHovered = true;
            cancelTimeout ();
        },
            () => {
            isHovered = false;
            addTimeout (CloseTimeout);
        });
        Utils.addClickController (this, Utils.ClickType.ON_RELEASE, (gdk_button, x, y) => {
            on_click (gdk_button, x, y);
            return true;
        });
        makeActionButton ();
        unmap.connect (() => {
            cancelTimeout ();
        });
        addTimeout (CloseTimeout);
    }

    public void addTimeout (uint timeout) {
        timer = Timeout.add_once (timeout, () => {
            timer = 0;
            unparent ();
        });
    }

    public void cancelTimeout () {
        if (timer != 0) {
            GLib.Source.remove (timer);
            timer = 0;
        }
    }

    public void makeActionButton () {
        if (notification.actions.length () <= 1)return;
        notification.actions.foreach ((act) => {
            var button = new NotificationActionButton (act);
            actionBox.append (button);
            button.clicked.connect ((_button) => {
                var b = (NotificationActionButton) _button;
                notification.invoke (b.actionId);
                notification.dispose ();
                unparent ();
            });
        });
    }

    [GtkCallback]
    public void on_dispose_button_click () {
        notification.dispose ();
        unparent ();
    }

    public void on_click (uint gdk_button, double x, double y) {
        if (gdk_button == Gdk.BUTTON_PRIMARY) {
            notification.actions.foreach (a => {
                if (a.id == "default")
                    notification.invoke (a.id);
            });
            notification.dispose ();
        } else {
            notification.dismiss ();
        }
        unparent ();
    }

    public signal void remove_notification (Gtk.Box notificationPopup);

    [GtkCallback]
    public void on_map () {
        image.pixel_size = ImageSize;
        var theme = Gtk.IconTheme.get_for_display (Gdk.Display.get_default ());
        iconName = "applications-system-symbolic";
        if (theme.has_icon (notification.app_icon))iconName = notification.app_icon;
        var hasImage = false;

        Gdk.Texture? texture = null;
        try {
            if (notification.image != null)
                texture = Gdk.Texture.from_filename (notification.image);
        } catch (GLib.Error e) {}
        try {
            if (texture == null)
                texture = Gdk.Texture.from_filename (notification.app_icon);
        } catch (GLib.Error e) {}
        if (texture != null) {
            var renderer = get_root ().get_renderer ();
            var rect = Graphene.Rect ().init (0, 0, texture.width, texture.height);
            var RoundedSize = (float) Math.fmax (texture.width, texture.height) / 100 * ImageRoundedSizePersan;
            Gsk.RenderNode node = new Gsk.TextureScaleNode (texture, rect, Gsk.ScalingFilter.TRILINEAR);
            var roundedSize = Graphene.Size ().init (RoundedSize, RoundedSize);
            var clip = Gsk.RoundedRect ().init
                (
                 rect,
                 roundedSize,
                 roundedSize,
                 roundedSize,
                 roundedSize);
            node = new Gsk.RoundedClipNode (node, clip);
            image.set_from_paintable (renderer.render_texture (node, rect));
            hasImage = true;
        }

        if (!hasImage)image.set_from_icon_name (iconName);
    }
}
public class Widget.NotificationActionButton : Gtk.Button {
    public string actionId;
    public NotificationActionButton (AstalNotifd.Action action) {
        actionId = action.id;
        label = action.label;
        hexpand = true;
    }
}
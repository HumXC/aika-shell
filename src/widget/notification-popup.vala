[GtkTemplate (ui = "/com/github/humxc/aika-shell/ui/widget/notification-popup.ui")]
public class Widget.NotificationPopup : Gtk.Box {
    public string summary { get; set; }
    public string appName { get; set; }
    public string body { get; set; }
    public bool isHovered { get; set; }
    public int maxBodyChars1 { get; set; default = 24; }
    public int maxBodyChars2 { get; set; default = 50; }
    private AstalNotifd.Notification notification;
    [GtkChild]
    private unowned Gtk.Image image;
    [GtkChild]
    private unowned Gtk.Box actionBox;
    public NotificationPopup (AstalNotifd.Notification n) {
        Object (css_name: "notification-popup");
        set_size_request (20, -1);
        notification = n;
        summary = n.summary; // 处理换行
        appName = n.app_name;
        body = n.body;
        Utils.addHoverController
            (this,
            () => { isHovered = true; },
            () => { isHovered = false; });
        Utils.addClickController (this, Utils.ClickType.ON_RELEASE, (gdk_button, x, y) => {
            on_click (gdk_button, x, y);
            return true;
        });
    }

    public void on_click (uint gdk_button, double x, double y) {
        if (gdk_button == Gdk.BUTTON_PRIMARY) {
            notification.actions.foreach (a => {
                if (a.label == "default")
                    notification.invoke (a.id);
            });
        }
        unparent ();
    }

    public signal void remove_notification (Gtk.Box notificationPopup);

    [GtkCallback]
    public void on_image_map () {
        image.pixel_size = 48;
        var theme = Gtk.IconTheme.get_for_display (Gdk.Display.get_default ());
        var icon_name = "applications-system-symbolic";
        if (theme.has_icon (notification.app_icon))icon_name = notification.app_icon;
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
            var distRect = Graphene.Rect ().init (0, 0, 48, 48);
            Gsk.RenderNode node = new Gsk.TextureScaleNode (texture, distRect, Gsk.ScalingFilter.TRILINEAR);
            var clip = Gsk.RoundedRect ().init
                (
                 distRect,
                 Graphene.Size ().init (10, 10),
                 Graphene.Size ().init (10, 10),
                 Graphene.Size ().init (10, 10),
                 Graphene.Size ().init (10, 10));
            node = new Gsk.RoundedClipNode (node, clip);
            image.set_from_paintable (renderer.render_texture (node, distRect));
            hasImage = true;
        }

        if (!hasImage)image.set_from_icon_name (icon_name);
    }
}
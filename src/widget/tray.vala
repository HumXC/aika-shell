public class Widget.Tray : Gtk.Box {
    private AstalTray.Tray tray = AstalTray.get_default();
    public Tray() {
        Object(spacing: 4);
        tray.item_added.connect((id) => {
            addItem(id);
        });
    }

    public void addItem(string id) {
        var icon = new TrayIcon(tray.get_item(id));
        tray.item_removed.connect(() => {
            var hasID = false;
            tray.items.foreach((i) => {
                if (i.id == icon.item.id) {
                    hasID = true;
                    return;
                }
            });
            if (!hasID)icon.unparent();
        });
        append(icon);
    }
}
public class Widget.TrayIcon : Gtk.Box {
    private Gtk.Image icon = new Gtk.Image();
    private Gtk.PopoverMenu menu;
    public AstalTray.TrayItem item;
    public TrayIcon(AstalTray.TrayItem item, int iconSize = 22) {
        icon.pixel_size = iconSize;
        this.item = item;
        append(icon);
        update(item);
        Utils.addClickController(this, Utils.ClickType.ON_RELEASE, (gdkButton, x, y) => {
            if (gdkButton == Gdk.BUTTON_SECONDARY) {
                menu.popup();
            } else {
                this.item.activate((int) x, (int) y);
            }
            return true;
        });
        item.changed.connect((item) => {
            update(item);
        });
    }

    public void update(AstalTray.TrayItem item) {
        icon.set_from_gicon(item.gicon);
        if (menu != null)menu.unparent();
        menu = new Gtk.PopoverMenu.from_model(item.menu_model);
        menu.insert_action_group("dbusmenu", item.action_group);
        menu.set_has_arrow(false);
        var rect = Gdk.Rectangle();
        get_bounds(out rect.x, out rect.y, out rect.width, out rect.height);
        rect.height += 50; // TODO: 适配hyprland高度
        menu.set_pointing_to(rect);
        append(menu);
    }
}
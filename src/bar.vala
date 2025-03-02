enum AikaShell.BarPosition {
    TOP,
    RIGHT,
    BOTTOM,
    LEFT,
}

[GtkTemplate(ui = "/com/github/humxc/aika-shell/ui/bar.ui")]
public class AikaShell.Bar : Gtk.Window {
    [GtkChild]
    private unowned Gtk.Box areaCenter;
    [GtkChild]
    private unowned Gtk.Box areaStart;
    [GtkChild]
    private unowned Gtk.Box areaEnd;
    [GtkChild]
    private unowned Gtk.Box areaCenterStart;
    [GtkChild]
    private unowned Gtk.Box areaCenterEnd;
    public Bar() {
        GtkLayerShell.init_for_window(this);
        GtkLayerShell.set_layer(this, GtkLayerShell.Layer.TOP);
        GtkLayerShell.set_keyboard_mode(this, GtkLayerShell.KeyboardMode.NONE);
        GtkLayerShell.set_namespace(this, "aika-shell-bar");
        GtkLayerShell.auto_exclusive_zone_enable(this);
        this.SetPosition(AikaShell.BarPosition.TOP);
    }

    private void SetPosition(BarPosition position) {
        GtkLayerShell.Edge[] anchors = {
            GtkLayerShell.Edge.BOTTOM,
            GtkLayerShell.Edge.LEFT,
            GtkLayerShell.Edge.TOP,
            GtkLayerShell.Edge.RIGHT,
        };
        for (var i = 0; i < anchors.length; i++) {
            if (position == i)continue;
            GtkLayerShell.set_anchor(this, anchors[i], true);
        }
    }
}
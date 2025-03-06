

public enum Window.BarPosition {
    TOP,
    RIGHT,
    BOTTOM,
    LEFT,
}
[GtkTemplate (ui = "/com/github/humxc/aika-shell/ui/window/bar.ui")]
public class Window.Bar : Astal.Window {
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
    public Bar () {
        this.SetPosition (BarPosition.TOP);
        areaCenter.append (new Widget.Clock ());
        areaStart.append (new Widget.Tray ());
    }

    private void SetPosition (BarPosition position) {
        Astal.WindowAnchor[] anchors = {
            Astal.WindowAnchor.TOP | Astal.WindowAnchor.LEFT | Astal.WindowAnchor.RIGHT,
            Astal.WindowAnchor.RIGHT | Astal.WindowAnchor.TOP | Astal.WindowAnchor.BOTTOM,
            Astal.WindowAnchor.BOTTOM | Astal.WindowAnchor.LEFT | Astal.WindowAnchor.RIGHT,
            Astal.WindowAnchor.TOP | Astal.WindowAnchor.LEFT | Astal.WindowAnchor.BOTTOM,
        };
        anchor = anchors[position];
    }
}
[GtkTemplate (ui = "/com/github/humxc/aika-shell/ui/widget/clock.ui")]
public class Widget.Clock : Gtk.Box {
    private Services.Time time_service = Services.Time.get_default ();
    public string time { get; set; }
    public Clock () {
        time = time_service.HM;
        time_service.update.connect ((t) => {
            time = t.HM;
        });
    }
}
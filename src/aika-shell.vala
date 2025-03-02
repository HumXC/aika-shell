
public class AikaShell.App : Gtk.Application {
    public App () {
        Object (application_id: "com.github.humxc.aika-shell");
    }

    public override void activate () {
        base.activate ();
        Gtk.CssProvider provider = new Gtk.CssProvider ();
        provider.load_from_resource ("/com/github/humxc/aika-shell/style.css");
        Gtk.StyleContext.add_provider_for_display (
                                                   Gdk.Display.get_default (), provider,
                                                   Gtk.STYLE_PROVIDER_PRIORITY_USER);
        var bar = new Window.Bar ();
        bar.present ();
        this.hold ();
    }
}
int main (string[] args) {
    ensure_types ();
    var app = new AikaShell.App ();
    return app.run (args);
}
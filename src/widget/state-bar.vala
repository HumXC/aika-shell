public class Widget.StateBar : Gtk.Box {
    public StateBar () {
        Object (css_name: "state-bar");
        append (new StateBarWpIcon ());
        append (new StateBarNetworkIcon ());
        DDCUtil.get_default ().ready.connect (() => {
            DDCUtil.get_default ().brightness.foreach ((s) => {
                print ("Brightness: %d", s);
            });
        });
    }
}

public class Widget.StateBarWpIcon : Gtk.Box {
    private Gtk.Image icon = new Gtk.Image ();
    private AstalWp.Wp wp = AstalWp.get_default ();
    public StateBarWpIcon () {
        append (icon);
        wp.default_speaker.notify["volume-icon"].connect (() => {
            icon.set_from_icon_name (wp.default_speaker.volume_icon);
        });
        icon.set_from_icon_name (wp.default_speaker.volume_icon);
        Utils.addScrollController (this, (dy) => {
            wp.default_speaker.volume += dy * -0.05;
            return true;
        });
    }
}
public class Widget.StateBarNetworkIcon : Gtk.Box {
    private Gtk.Image icon = new Gtk.Image ();
    private AstalNetwork.Network nt = AstalNetwork.get_default ();
    public StateBarNetworkIcon () {
        append (icon);
        nt.notify.connect (() => {
            updateIcon ();
        });
        updateIcon ();
    }

    private void updateIcon () {
        switch (nt.primary) {
        case AstalNetwork.Primary.UNKNOWN:
            break;
        case AstalNetwork.Primary.WIFI:
            icon.set_from_icon_name (nt.wifi.icon_name);
            break;
        case AstalNetwork.Primary.WIRED:
            icon.set_from_icon_name (nt.wired.icon_name);
            break;
        }
    }
}
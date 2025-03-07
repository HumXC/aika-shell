public struct EDID {
    string mfg_id;
    string model;
}

public struct  Display {
    EDID edid;
    string i2c_bus;
    string drm_connector;
}

private List<Display?> parseDisplay(string detect_string) {
    var lines = detect_string.split("\n");
    List<Display?> displays = new List<Display?> ();
    Display? display = null;
    for (int i = 0; i < lines.length; i++) {
        var line = lines[i];
        var stripped_line = line.strip();
        var deep = (int) (line.length - stripped_line.length) / 3;
        if (deep == 0 && line.has_prefix("Display ")) {
            if (display != null) {
                displays.append(display);
            }
            display = Display();
            display.edid = EDID();
            continue;
        }
        if (deep == 0 && stripped_line.has_prefix("I2C bus:")) {
            display.i2c_bus = stripped_line.split(":")[1].strip();
            continue;
        }
        if (deep == 1 && stripped_line.has_prefix("DRM connector:")) {
            display.drm_connector = stripped_line.split(":")[1].strip();
            continue;
        }
        if (deep == 2 && stripped_line.has_prefix("Mfg id:")) {
            display.edid.mfg_id = stripped_line.split(":")[1].strip();
            continue;
        }
        if (deep == 2 && stripped_line.has_prefix("Model:")) {
            display.edid.model = stripped_line.split(":")[1].strip();
            continue;
        }
    }
    return displays;
}

private void fetchLight(string i2cBus, out int value, out int max) throws GLib.Error {
    var output = AstalIO.Process.execv({ "ddcutil", "getvcp", "10", "-b", i2cBus.split("-")[i2cBus.split("-").length - 1] });
    var regex = new GLib.Regex("current value\\s*=\\s*(\\d+)\\s*,\\s*max value\\s*=\\s*(\\d+)");
    GLib.MatchInfo match;
    regex.match(output, 0, out match);
    if (match != null) {
        value = int.parse(match.fetch(1));
        max = int.parse(match.fetch(2));
    } else {
        value = 0;
        max = 0;
    }
}

public class DDCUtil : Object {
    private static DDCUtil? instance;
    private List<Display?> _displays;
    public List<weak Display?> display { owned get { return _displays.copy(); } }
    private List<int> _brightness = new List<int> ();
    public List<int> brightness { owned get { return _brightness.copy(); } }
    public static unowned DDCUtil get_default() {
        if (instance == null)
            instance = new DDCUtil();

        return instance;
    }

    public DDCUtil() {
        detectDisplaysAsync.begin();
    }

    public signal void ready();

    private async void detectDisplaysAsync() {
        try {
            var output = yield AstalIO.Process.exec_asyncv({ "ddcutil", "detect" });

            _displays = parseDisplay(output);
        } catch (GLib.Error e) {
            message("Failed to detect displays: %s", e.message);
            return;
        }

        _brightness = new List<int> ();
        _displays.foreach((d) => {
            int value, max;
            try {
                fetchLight(d.i2c_bus, out value, out max);
                _brightness.append(value);
            } catch (GLib.Error e) {
                message("Failed to detect displays: %s", e.message);
                return;
            }
        });
        ready();
    }
}
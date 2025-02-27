import { App, Astal, Gtk, Gdk } from "astal/gtk4";
import services from "../services";
import component from "../component";

class Bar {
    window: Gtk.Window;
    areaLeft: Gtk.Box;
    areaRight: Gtk.Box;
    areaCenter: Gtk.Box;
    areaCenterLeft: Gtk.Box;
    areaCenterRight: Gtk.Box;
    constructor(gdkmonitor: Gdk.Monitor) {
        const { window, areaLeft, areaRight, areaCenter, areaCenterLeft, areaCenterRight } =
            Window(gdkmonitor);
        this.window = window;
        this.areaLeft = areaLeft;
        this.areaRight = areaRight;
        this.areaCenter = areaCenter;
        this.areaCenterLeft = areaCenterLeft;
        this.areaCenterRight = areaCenterRight;

        const time = <label label={services.time.HM()} />;
        this.areaCenter.append(time);
        this.areaLeft.append(component.Tray());
    }
}
export default Bar;
function Window(gdkmonitor: Gdk.Monitor) {
    const { TOP, LEFT, RIGHT } = Astal.WindowAnchor;

    let areaLeft: Gtk.Box = null as any;
    let areaRight: Gtk.Box = null as any;
    let areaCenter: Gtk.Box = null as any;
    let areaCenterLeft: Gtk.Box = null as any;
    let areaCenterRight: Gtk.Box = null as any;
    const window = (
        <window
            visible
            cssClasses={["Bar"]}
            gdkmonitor={gdkmonitor}
            exclusivity={Astal.Exclusivity.EXCLUSIVE}
            anchor={TOP | LEFT | RIGHT}
            application={App}
        >
            <centerbox cssName="centerbox">
                <overlay
                    setup={(overlay) => {
                        overlay.add_overlay(
                            <box halign={Gtk.Align.END} setup={(box) => (areaCenterLeft = box)}>
                                {/* 中间区域左侧 */}
                            </box>
                        );
                    }}
                    hexpand={true}
                    child={
                        <box halign={Gtk.Align.START} setup={(box) => (areaLeft = box)}>
                            {/* 左侧区域 */}
                        </box>
                    }
                />

                <box halign={Gtk.Align.CENTER} setup={(box) => (areaCenter = box)}>
                    {/* 中间区域 */}
                </box>
                <overlay
                    setup={(overlay) => {
                        overlay.add_overlay(
                            <box
                                halign={Gtk.Align.START}
                                hexpand={true}
                                setup={(box) => (areaCenterRight = box)}
                            >
                                {/* 中间区域右侧 */}
                            </box>
                        );
                    }}
                    child={
                        <box halign={Gtk.Align.END} setup={(box) => (areaRight = box)}>
                            {/* 右侧区域 */}
                        </box>
                    }
                />
            </centerbox>
        </window>
    );
    return {
        window: window as Gtk.Window,
        areaLeft,
        areaRight,
        areaCenter,
        areaCenterLeft,
        areaCenterRight,
    };
}

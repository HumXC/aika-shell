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

        const clock = <label cssName="clock" label={services.time.HM()} />;
        this.areaCenter.append(clock);
        this.areaLeft.append(component.Tray());
        this.areaRight.append(component.StateBar());
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
            cssName="bar"
            gdkmonitor={gdkmonitor}
            exclusivity={Astal.Exclusivity.EXCLUSIVE}
            anchor={TOP | LEFT | RIGHT}
            application={App}
        >
            <centerbox
                cssName="contents"
                marginTop={8}
                marginEnd={8}
                marginStart={8}
                // marginBottom={8}
            >
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

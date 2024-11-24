import { Astal, Gdk, Gtk, Widget } from "astal/gtk3";
import { RegularWindow } from "./base";

export default function PopupWindow(trigger: Gtk.Widget) {
    return (
        <window
            setup={(self) => {
                print(self.is_floating());
                self.move(100, 100);
                self.set;
            }}
            decorated={false}
            resizable={true}
            heightRequest={200}
            widthRequest={200}
            title="FloatingMenu"
            keymode={Astal.Keymode.ON_DEMAND}
            anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.LEFT}
            className={"FloatingMenu"}
            onKeyPressEvent={(self, e) => {
                if (e.get_keyval()[1] === Gdk.KEY_Escape) {
                    self.close();
                }
            }}
        ></window>
    );
}

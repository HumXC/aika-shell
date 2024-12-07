import { AstalIO, bind, timeout, Variable } from "astal";
import { Astal, Gdk, Gtk, Widget } from "astal/gtk3";

export function SetupTooltip(
    self: Widget.EventBox,
    popupWindow: (props: any) => Astal.Window,
    popupName: string,
    forward: "bottom" | "top" | "left" | "right",
    currentPopup?: Variable<string> | null
) {
    let popup: Astal.Window | null = null;
    let closeTimer: AstalIO.Time | null = null;
    let onHover = false;
    const closePopup = () => {
        if (popup === null) return;
        if (closeTimer) closeTimer.cancel();
        closeTimer = timeout(500, () => {
            if (onHover) return;
            popup?.close();
            popup = null;
            if (currentPopup?.get() === popupName) currentPopup.set("");
        });
    };
    const makePopup = (t: Gtk.Widget) => {
        if (currentPopup) currentPopup.set(popupName);
        return popupWindow({
            forward: forward,
            trigger: t,
            onHover: () => (onHover = true),
            onHoverLost: () => {
                onHover = false;
                closePopup();
            },
            onDestroy: () => currentPopup?.set(""),
        });
    };
    self.connect("hover", () => {
        if (currentPopup?.get().endsWith("-popup")) return;
        onHover = true;
        if (!popup) popup = makePopup(self);
    });
    self.connect("hover-lost", () => {
        onHover = false;
        closePopup();
    });
    if (currentPopup) {
        self.hook(bind(currentPopup), () => {
            popup?.close();
            popup = null;
        });
    }
}
export function SetupPopup(
    self: Widget.EventBox,
    popupWindow: (props: any) => Astal.Window,
    popupName: string,
    forward: "bottom" | "top" | "left" | "right",
    currentPopup?: Variable<string> | null
) {
    let popup: Astal.Window | null = null;
    let closeTimer: AstalIO.Time | null = null;
    let isOpen = false;
    const closePopup = () => {
        if (popup === null) return;
        if (closeTimer) closeTimer.cancel();
        closeTimer = timeout(500, () => {
            if (isOpen) return;
            popup?.close();
            popup = null;
            if (currentPopup?.get() === popupName) currentPopup.set("");
        });
    };
    const makePopup = (t: Gtk.Widget) => {
        if (currentPopup) currentPopup.set(popupName);
        return popupWindow({
            forward: forward,
            trigger: t,
            onHover: () => (isOpen = true),
            onHoverLost: () => {
                isOpen = false;
                closePopup();
            },
            onDestroy: () => currentPopup?.set(""),
        });
    };
    self.connect("button-press-event", (_, e: Gdk.Event) => {
        if (e.get_button()[1] !== Gdk.BUTTON_SECONDARY) return;
        isOpen = !isOpen;
        if (!popup) popup = makePopup(self);
        else currentPopup?.set("");
    });
    if (currentPopup) {
        self.hook(bind(currentPopup), () => {
            popup?.close();
            popup = null;
        });
    }
}

import { Binding, timeout } from "astal";
import { Gtk } from "astal/gtk3";
import { BindableChild } from "astal/gtk3/astalify";

export default function TransitionInOut({
    duration,
    isShow,
    child,
    transitionIn = Gtk.RevealerTransitionType.SLIDE_UP,
    transitionOut = Gtk.RevealerTransitionType.SLIDE_DOWN,
}: {
    duration: number;
    isShow: Binding<boolean>;
    transitionIn?: Gtk.RevealerTransitionType;
    transitionOut?: Gtk.RevealerTransitionType;
    child?: BindableChild;
}) {
    return (
        <revealer
            revealChild={false}
            transitionType={transitionOut}
            setup={(self) => {
                self.hook(isShow, (_, isShow) => {
                    const child = self.get_child() as Gtk.Revealer;
                    if (isShow) {
                        self.transitionDuration = 0;
                        self.revealChild = true;
                        child.transitionDuration = duration;
                        child.revealChild = true;
                        return;
                    }
                    self.transitionDuration = duration;
                    self.revealChild = false;

                    timeout(duration, () => {
                        child.transitionDuration = 0;
                        child.revealChild = false;
                    });
                });
            }}
        >
            <revealer revealChild={false} transitionType={transitionIn}>
                {child}
            </revealer>
        </revealer>
    );
}

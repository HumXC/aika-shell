import { Binding } from "astal";
import { Gtk } from "astal/gtk3";
import { BindableChild } from "astal/gtk3/astalify";
import { sleep } from "../../utils";

export default function TransitionInOut({
    duration,
    isShow,
    child,
    transitionIn = Gtk.RevealerTransitionType.SLIDE_UP,
    transitionOut = Gtk.RevealerTransitionType.SLIDE_DOWN,
    onTransitionEnd = () => {},
    onTransitionStart = () => {},
}: {
    duration: number;
    isShow: Binding<boolean>;
    transitionIn?: Gtk.RevealerTransitionType;
    transitionOut?: Gtk.RevealerTransitionType;
    child?: BindableChild;
    onTransitionEnd?: () => void | Promise<void>;
    onTransitionStart?: () => void | Promise<void>;
}) {
    return (
        <revealer
            revealChild={false}
            transitionType={transitionOut}
            setup={(self) => {
                self.hook(isShow, async (_, isShow) => {
                    const child = self.get_child() as Gtk.Revealer;
                    if (isShow) {
                        await onTransitionStart();
                        self.transitionDuration = 0;
                        self.revealChild = true;
                        child.transitionDuration = duration;
                        child.revealChild = true;
                        await sleep(duration);
                        await onTransitionEnd();
                        return;
                    }
                    await onTransitionStart();
                    self.transitionDuration = duration;
                    self.revealChild = false;
                    await sleep(duration);
                    child.transitionDuration = 0;
                    child.revealChild = false;
                    await onTransitionEnd();
                });
            }}
        >
            <revealer revealChild={false} transitionType={transitionIn}>
                {child}
            </revealer>
        </revealer>
    );
}

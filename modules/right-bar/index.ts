import { IsShow as NotifyIsShow } from "../notifications/index";
const MarginTop = 55;
const MarginRight = 7;
const MarginBottom = 7;
const Top = () =>
    Widget.Box({
        class_name: "top",
        vpack: "start",
        children: [
            Widget.Button({
                label: "关闭",
                class_name: "close",
            }),
        ],
    });
const Center = () =>
    Widget.Box({
        class_name: "center",
        width_request: 400,
        vexpand: true,
        children: [
            Widget.Button({
                label: "关闭",
                class_name: "close",
            }),
        ],
    });
const Bottom = () =>
    Widget.Box({
        class_name: "bottom",
        vpack: "end",
        children: [
            Widget.Button({
                label: "关闭",
                class_name: "close",
            }),
        ],
    });

function RightBar() {
    const is_show = Variable(false);
    const InnerAnimationTime = 100;
    const OuterAnimationTime = 300;
    const box = Widget.Box({
        class_name: "right-bar",
        vertical: true,
        children: [Top(), Center(), Bottom()],
    });
    const inner = Widget.Revealer({
        transition: "slide_right",
        transition_duration: InnerAnimationTime,
        reveal_child: false,
        vexpand: true,
        child: box,
    });
    const outer = Widget.Revealer({
        transition: "crossfade",
        transition_duration: OuterAnimationTime,
        reveal_child: false,
        vexpand: true,
        child: inner,
    });
    const show = () => {
        NotifyIsShow.setValue(false);
        outer.transition_duration = 0;
        outer.reveal_child = true;
        inner.transition_duration = InnerAnimationTime;
        inner.reveal_child = true;
    };
    const close = () => {
        NotifyIsShow.setValue(true);
        outer.transition_duration = OuterAnimationTime;
        outer.reveal_child = false;
        Utils.timeout(OuterAnimationTime, () => {
            inner.transition_duration = 0;
            inner.reveal_child = false;
        });
    };
    Utils.watch(null, is_show, () => {
        if (is_show.value) {
            show();
        } else {
            close();
        }
    });
    const w = Widget.Window({
        name: `right-bar`,
        anchor: ["right", "top", "bottom"],
        exclusivity: "ignore",
        layer: "overlay",
        css: "background-color: transparent;",
        height_request: 1,
        width_request: 1,
        margins: [MarginTop, MarginRight, MarginBottom, 0],
        child: Widget.Box({
            hpack: "fill",
            class_name: "notifications",
            child: outer,
        }),
    });

    return Object.assign(w, {
        is_show: is_show,
    });
}
export { RightBar };

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
    const reveal = Variable(false);
    const r = Widget.Revealer({
        transition: "slide_right",
        transition_duration: 100,
        reveal_child: reveal.bind(),
        vexpand: true,
        vpack: "baseline",
        child: Widget.Box({
            class_name: "right-bar",
            vertical: true,
            children: [Top(), Center(), Bottom()],
        }),
    });
    const w = Widget.Window({
        name: `right-bar`,
        anchor: ["right", "top", "bottom"],
        exclusivity: "normal",
        layer: "overlay",
        css: "background-color: transparent;",
        child: Widget.Box({
            hpack: "fill",
            class_name: "notifications",
            child: r,
        }),
    });
    Object.assign(w, {
        reveal: reveal,
    });

    return w;
}
export { RightBar };

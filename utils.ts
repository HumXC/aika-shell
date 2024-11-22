import { EventBox } from "astal/gtk3/widget";

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function setHoverClassName(className: string, widget: EventBox) {
    widget.className = className;
    widget.connect("hover", () => (widget.className = className + "-hover"));
    widget.connect("hover-lost", () => (widget.className = className));
}
export { sleep, setHoverClassName };

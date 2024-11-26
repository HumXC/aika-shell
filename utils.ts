import { EventBox } from "astal/gtk3/widget";

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function setHoverClassName(widget: EventBox, className: string = "") {
    if (className === "") className = widget.className;
    widget.className = className;
    widget.connect("hover", () => (widget.className = className + "-hover"));
    widget.connect("hover-lost", () => (widget.className = className));
}

function formatBytes(bytes: number): string {
    function formatValue(value: number): string {
        // 判断是否需要保留小数位
        return value % 1 === 0 ? `${value}` : `${value.toFixed(2)}`;
    }

    if (bytes >= 800 * 1024 * 1024) {
        // 超过 800 MB，显示为 GB
        return `${formatValue(bytes / 1e9)} GB`;
    } else if (bytes >= 800 * 1024) {
        // 超过 800 KB，但未达到 800 MB，显示为 MB
        return `${formatValue(bytes / 1e6)} MB`;
    } else {
        // 小于 800 KB，显示为 KB
        return `${formatValue(bytes / 1024)} KB`;
    }
}
function formatDuration(seconds: number) {
    if (typeof seconds !== "number" || seconds < 0) {
        throw new Error("Input must be a non-negative number.");
    }

    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    seconds %= 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds.toFixed(0)}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds.toFixed(0)}s`;
    } else {
        return `${seconds.toFixed(2)}s`;
    }
}

export { sleep, setHoverClassName, formatBytes, formatDuration };

import { is_show as right_bar_is_show } from "modules/right-bar/index";
import { is_show as clipboard_is_show } from "modules/clipboard/index";
globalThis.toggle_right_bar = () => right_bar_is_show.setValue(!right_bar_is_show.value);
globalThis.toggle_clipboard = () => clipboard_is_show.setValue(!clipboard_is_show.value);
export default function setup() {}

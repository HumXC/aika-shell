import { is_show } from "modules/right-bar/index";
globalThis.toggle_right_bar = () => is_show.setValue(!is_show.value);
export default function setup() {}

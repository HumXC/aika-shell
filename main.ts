import { TopBar } from "./modules/top-bar/index.js";
import { RightBar } from "./modules/right-bar/index.js";
import { Notifications as SetupNotifications } from "./modules/notifications/index.js";
import { Clipboard } from "modules/clipboard/index.js";
import setup from "vars";
setup();
const css = `/tmp/ags-style.css`;
const right_bar = RightBar();
Clipboard();
App.config({
    style: css,
    windows: [SetupNotifications(), TopBar(0, right_bar), right_bar],
});

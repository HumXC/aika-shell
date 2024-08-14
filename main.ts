import { TopBar } from "./modules/top-bar/index.js";
import { RightBar } from "./modules/right-bar/index.js";
import { Notifications as SetupNotifications } from "./modules/notifications/index.js";
const css = `/tmp/ags-style.css`;

const right_bar = RightBar();
App.config({
    style: css,
    windows: [SetupNotifications(), TopBar(0, right_bar), right_bar],
});

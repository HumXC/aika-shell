#!/usr/bin/gjs -m
import { App } from "astal/gtk3";
import style from "./style.scss";
import TopBar from "./widget/top-bar";
import { Handle, Register } from "./request-handler";
import Screenshot from "./handler/screenshot";
import Recorder from "./handler/wf-recorder";
import Clipboard from "./handler/clipboard";
import _ from "./configs";
Register("screenshot", Screenshot);
Register("recorder", Recorder);
Register("clipboard", Clipboard);
App.start({
    requestHandler: (request, res) => Handle(request, res),
    css: style,
    icons: `${SRC}/icons`,
    main() {
        App.get_monitors().map(TopBar);
    },
});

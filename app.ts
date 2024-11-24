import { App } from "astal/gtk3";
import style from "./style.scss";
import TopBar from "./widget/top-bar";
import { Handle, Register } from "./request-handler";
import Screenshot from "./handler/Screenshot";
Register("screenshot", Screenshot);
App.start({
    requestHandler: (request, res) => Handle(request, res),
    css: style,
    icons: `${SRC}/icons`,
    main() {
        App.get_monitors().map(TopBar);
    },
});

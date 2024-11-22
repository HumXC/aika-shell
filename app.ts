import { App } from "astal/gtk3";
import style from "./style.scss";
import Bar from "./widget/Bar";
import { Handle, Register } from "./RequestHandler";
import Screenshot from "./handler/Screenshot";
Register("screenshot", Screenshot);
App.start({
    requestHandler: (request, res) => Handle(request, res),
    css: style,
    icons: `${SRC}/icons`,
    main() {
        App.get_monitors().map(Bar);
    },
});

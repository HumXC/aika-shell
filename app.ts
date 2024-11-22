import { App } from "astal/gtk3";
import style from "./style.scss";
import Bar from "./widget/Bar";
import { Handle, Register } from "./RequestHandler";
import { Handler } from "./widget/ScreenMask";
Register("screenmask", Handler);
App.start({
    requestHandler: (request, res) => Handle(request, res),
    css: style,
    icons: `${SRC}/icons`,
    main() {
        App.get_monitors().map(Bar);
    },
});

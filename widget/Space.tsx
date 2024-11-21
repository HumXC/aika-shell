// width 宽度
// 垂直方向 0 竖直 1 水平

export default function Space({
    space,
    useVertical = false,
}: {
    space: number;
    useVertical?: boolean;
}) {
    return (
        <box
            setup={(self) => {
                if (useVertical) self.heightRequest = space;
                else self.widthRequest = space;
            }}
        />
    );
}

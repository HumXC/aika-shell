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

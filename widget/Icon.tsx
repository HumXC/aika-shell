export default function Icon({
    name,
    size,
    className = "Icon",
}: {
    name: string;
    size: number;
    className?: string;
}) {
    const margin = size / 8;
    print(margin);
    return (
        <box className={className} heightRequest={size} widthRequest={size}>
            <icon
                icon={name}
                css={`
                    font-size: ${size - margin * 2}px;
                    margin: ${margin}px;
                `}
            />
        </box>
    );
}

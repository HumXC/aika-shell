sources += [
    'aika-shell.vala',
    'ensure-types.vala',
    'services/time.vala',
    'window/bar.vala',
    'widget/clock.vala',
]

deps = [
    dependency('gtk4'),
    dependency('gtk4-layer-shell-0'),
    dependency('astal-4-4.0'),
    dependency('astal-io-0.1'),
    dependency('astal-tray-0.1'),
    meson.get_compiler('vala').find_library('posix'),
]
executable(
    'aika-shell',
    sources,
    dependencies: deps,
    link_args: ['-lm'],
    install: true,
)
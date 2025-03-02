sources += [
    'aika-shell.vala',
    'ensure-types.vala',
    'bar.vala',
]

deps = [
    dependency('gtk4'),
    dependency('gtk4-layer-shell-0'),
    dependency('astal-4-4.0'),
    dependency('astal-io-0.1'),
    meson.get_compiler('vala').find_library('posix'),
]
executable(
    'aika-shell',
    sources,
    dependencies: deps,
    link_args: ['-lm'],
    install: true,
)
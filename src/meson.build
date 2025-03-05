src = [
    'aika-shell.vala',
    'utils.vala',
    'services/time.vala',
    'services/notifd.vala',
    'window/bar.vala',
    'window/notification-container.vala',
    'widget/clock.vala',
    'widget/notification-popup.vala',
]
sources += src
types_tgt = custom_target(
    'types',
    command: [find_program('awk'), '-f', files('gen_ensure_type.awk'), '@INPUT@'],
    input: src,
    output: 'ensure_types.vala',
    capture: true,
)

sources += [types_tgt]

deps = [
    dependency('gtk4'),
    dependency('gio-unix-2.0'),
    dependency('libnm'),
    dependency('gtk4-layer-shell-0'),
    dependency('astal-4-4.0'),
    dependency('astal-io-0.1'),
    dependency('astal-tray-0.1'),
    dependency('astal-hyprland-0.1'),
    dependency('astal-network-0.1'),
    dependency('astal-notifd-0.1'),
    dependency('astal-apps-0.1'),
    dependency('astal-wireplumber-0.1'),
    dependency('astal-mpris-0.1'),
    meson.get_compiler('vala').find_library('posix'),
]
executable(
    'aika-shell',
    sources,
    dependencies: deps,
    link_args: ['-lm'],
    install: true,
)
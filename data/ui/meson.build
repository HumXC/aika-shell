blueprints = custom_target(
    'compile-blueprints',
    input: files(
        'widget/clock.blp',
        'widget/notification-popup.blp',
        'window/bar.blp',
        'window/notification-container.blp',
    ),
    output: '.',
    command: [
        find_program('blueprint-compiler'),
        'batch-compile',
        '@OUTPUT@',
        '@CURRENT_SOURCE_DIR@',
        '@INPUT@',
    ],
)
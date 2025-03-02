blueprints = custom_target(
    'compile-blueprints',
    input: files(
        'widget/clock.blp',
        'window/bar.blp',
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
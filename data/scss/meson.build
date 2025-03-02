sass = find_program('sass')

scss_deps = files(
    '_public-colors.scss',
    'main.scss',
)

scss = custom_target(
    'generate-css',
    input: scss_deps,
    output: 'style.css',
    command: [
        sass,
        '@INPUT@',
        '@OUTPUT@',
    ],
    depend_files: scss_deps,
)
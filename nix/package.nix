{
  stdenv,
  lib,
  makeWrapper,
  # Build-Tools
  pkg-config,
  vala,
  meson,
  ninja,
  blueprint-compiler,
  sass,
  # Dependencies
  gtk4,
  gtk4-layer-shell,
  astal,
  librsvg,
}:
stdenv.mkDerivation {
  depsBuildBuild = [
    pkg-config
  ];
  nativeBuildInputs = [
    makeWrapper
    vala
    meson
    ninja
    blueprint-compiler
    sass
  ];
  buildInputs =
    [
      gtk4
      gtk4-layer-shell
    ]
    ++ (with astal; [
      astal4
      apps
      cava
      hyprland
      mpris
      network
      notifd
      powerprofiles
      tray
      wireplumber
    ]);
  installPhase = ''
    runHook preInstall
    unset GDK_PIXBUF_MODULE_FILE
    findGdkPixbufLoaders "${librsvg}"

    mkdir -p $out/bin
    cp src/aika-shell $out/bin/.aika-shell-unwrapped
    echo $GDK_PIXBUF_MODULE_FILE
    makeWrapper $out/bin/.aika-shell-unwrapped $out/bin/aika-shell \
      --set GDK_PIXBUF_MODULE_FILE "$GDK_PIXBUF_MODULE_FILE"

    runHook postInstall
  '';
  name = "aika-shell";
  src = ./..;
  meta = with lib; {
    homepage = "https://github.com/HumXC/aika-shell";
    description = "";
    license = licenses.gpl3;
  };
}

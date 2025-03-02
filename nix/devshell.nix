{
  pkgs,
  astal,
  ...
}: {
  default = pkgs.mkShell {
    buildInputs =
      (with pkgs; [
        # Build-Tools
        lldb
        pkg-config
        vala
        vala-lint
        meson
        mesonlsp
        ninja
        vala-language-server
        uncrustify
        blueprint-compiler
        sass
        # Dependencies
        gtk4
        gtk4-layer-shell
        librsvg
      ])
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
    shellHook = ''
      echo "${pkgs.lldb}/bin/lldb-dap"
    '';
  };
}

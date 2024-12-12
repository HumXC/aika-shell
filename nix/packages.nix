{ pkgs, agsPkgs, inputs, ... }:
let
  aika-shell-pkgs = with agsPkgs; [
    astal3
    astal4
    io
    gjs
    tray
    network
    hyprland
    wireplumber
    bluetooth
    notifd
    auth
    apps
    pkgs.gtk-session-lock
    pkgs.imagemagick
    pkgs.wtype
    pkgs.slurp
    pkgs.grim
    pkgs.wf-recorder
  ];
  aika-greet-pkgs = with agsPkgs; [
    greet
    pkgs.imagemagick
  ];
  ags = agsPkgs.default.override {
    extraPackages = aika-shell-pkgs ++ aika-greet-pkgs;
  };
  aika-shell = inputs.ags.lib.bundle {
    inherit pkgs;
    src = ../.;
    name = "aika-shell";
    entry = "app.ts";
    extraPackages = aika-shell-pkgs;
  };
  aika-greet = inputs.ags.lib.bundle {
    inherit pkgs;
    src = ../.;
    name = "aika-greet";
    entry = "greet.tsx";
    extraPackages = aika-greet-pkgs;
  };
  hyprConf = pkgs.writeText "greeter-hyprland-conf" ''
    exec-once = ${aika-greet}/bin/aika-greet; ${pkgs.hyprland}/bin/hyprctl dispatch exit
  '';
  aika-greet-hyprland = pkgs.writeScript "aika-greet-hyprland" ''
    ${pkgs.hyprland}/bin/Hyprland --config ${hyprConf}
  '';
in
rec {
  inherit
    ags
    aika-shell
    aika-greet
    aika-greet-hyprland;
  default = aika-shell;
  astal = agsPkgs.io;
}

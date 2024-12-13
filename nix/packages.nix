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

  aika-greet-hyprland = (args: import ./aika-greet-hyprland.nix
    {
      inherit pkgs aika-greet;
      # Example:
      # defaultUser = "Aika";
      # defaultSession = "Hyprland";
      # wallpaperDir = "/home/greeter/Pictures/wallpapers";
      # defaultMonitor = 0;
      # sessionDirs = [ "/var/share/wayland-sessions/" ];
      # env = {
      #   TEST = "test";
      #   A = "b";
      # };
      # hyprConf = ''
      #   input = {
      #     follow_mouse = 1;
      #     float_switch_override_focus = 2;
      #     touchpad = {
      #       natural_scroll = "yes";
      #     };
      #     sensitivity = 0.04;
      # '';
    } // args);
in
rec {
  inherit
    ags
    aika-shell
    aika-greet
    aika-greet-hyprland;
  default = aika-shell;
  astal = agsPkgs.io;
  aika-greet-hyprland-default = aika-greet-hyprland { };
}

{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    ags.url = "github:aylur/ags";
  };

  outputs = { self, flake-utils, nixpkgs, ... }@inputs:
    flake-utils.lib.eachSystem [ "x86_64-linux" ] (system:
      let
        pkgs = import nixpkgs {
          inherit system;
        };
        extraPackages = with inputs.ags.packages.${pkgs.system};
          [
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
          ];
        ags = inputs.ags.packages.${system}.default.override {
          extraPackages = extraPackages;
        };
      in
      {
        packages.${system}.default = inputs.ags.lib.bundle {
          inherit pkgs;
          src = ./.;
          name = "my-shell"; # name of executable
          entry = "app.ts";
          extraPackages = extraPackages ++ [ pkgs.gjs ];
        };
        devShells.default = pkgs.mkShell {
          buildInputs = [
            ags
          ];
        };
      }
    );
}

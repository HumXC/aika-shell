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
        agsPkgs = inputs.ags.packages.${pkgs.system};
        ags = inputs.ags.packages.${system}.default.override {
          extraPackages = with agsPkgs;  [
            astal3
            astal4
            io
            gjs
            tray
            network
          ];
        };
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = [
            ags
          ];
        };
      }
    );
}

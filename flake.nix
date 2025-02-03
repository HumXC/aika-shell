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
        agsPkgs = inputs.ags.packages.${system};
      in
      rec{
        packages = import ./nix/packages.nix {
          inherit agsPkgs pkgs inputs;
        };
        devShells.default = pkgs.mkShell {
          buildInputs = [ packages.ags ];
        };
      }
    );
}

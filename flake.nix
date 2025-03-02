{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.11";
    flake-utils.url = "github:numtide/flake-utils";
    astal.url = "github:aylur/astal";
  };

  outputs = {
    self,
    flake-utils,
    nixpkgs,
    ...
  } @ inputs:
    flake-utils.lib.eachSystem ["x86_64-linux" "aarch64-linux"] (
      system: let
        pkgs = import nixpkgs {inherit system;};
        astal = inputs.astal.packages.${system};
      in {
        packages = {
          aika-shell = pkgs.callPackage ./nix/package.nix {
            inherit astal;
          };
        };
        devShells = import ./nix/devshell.nix {
          inherit pkgs astal;
        };
      }
    );
}

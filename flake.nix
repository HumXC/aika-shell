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

        tsconfig = ''
          {
              "\$schema": "https://json.schemastore.org/tsconfig",
              "compilerOptions": {
                  "experimentalDecorators": true,
                  "strict": true,
                  "target": "ES2022",
                  "module": "ES2022",
                  "moduleResolution": "Bundler",
                  "jsx": "react-jsx",
                  "jsxImportSource": "${agsPkgs.gjs}/share/astal/gjs/gtk3",
                  "paths": {
                      "astal": [
                          "${agsPkgs.gjs}/share/astal/gjs"
                      ],
                      "astal/*": [
                          "${agsPkgs.gjs}/share/astal/gjs/*"
                      ]
                  },
              }
          }
        '';

      in
      rec{
        packages = import ./nix/packages.nix {
          inherit agsPkgs pkgs inputs;
        };
        devShells.default = pkgs.mkShell {
          buildInputs = [ packages.ags ];
          shellHook = ''
            rm tsconfig.json
            cat << EOF > tsconfig.json
            ${tsconfig}
            EOF
          '';
        };

      }
    );
}

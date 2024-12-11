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
        ];
        aika-greet-pkgs = with agsPkgs; [
          greet
          pkgs.imagemagick
        ];
        ags = inputs.ags.packages.${system}.default.override {
          extraPackages = aika-shell-pkgs ++ aika-greet-pkgs;
        };
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
      {
        packages.${system} =
          rec {
            default = aika-shell;
            aika-shell = inputs.ags.lib.bundle {
              inherit pkgs;
              src = ./.;
              name = "aika-shell";
              entry = "app.ts";
              extraPackages = aika-shell-pkgs;
            };
            aika-greet = inputs.ags.lib.bundle {
              inherit pkgs;
              src = ./.;
              name = "aika-greeter";
              entry = "greet.tsx";
              extraPackages = aika-greet-pkgs;
            };
          };
        devShells.default = pkgs.mkShell {
          buildInputs = [ ags ];
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

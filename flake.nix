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
        gjs = inputs.ags.packages.${pkgs.system}.gjs;
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
            auth
            apps
            pkgs.gtk-session-lock
            pkgs.imagemagick
            pkgs.wtype
          ];
        ags = inputs.ags.packages.${system}.default.override {
          extraPackages = extraPackages;
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
                  "jsxImportSource": "${gjs}/share/astal/gjs/gtk3",
                  "paths": {
                      "astal": [
                          "${gjs}/share/astal/gjs"
                      ],
                      "astal/*": [
                          "${gjs}/share/astal/gjs/*"
                      ]
                  },
              }
          }
        '';
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

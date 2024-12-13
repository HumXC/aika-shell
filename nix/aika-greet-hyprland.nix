{ pkgs
, aika-greet
, hyprConf ? ""
, defaultUser ? ""
, defaultSession ? ""
, defaultMonitor ? 0
, wallpaperDir ? ""
, test ? false
, sessionDirs ? [ ]
, env ? { }
}:
let
  argv = with pkgs.lib;
    (optionalString (defaultUser != "") "-u ${defaultUser} ") +
    (optionalString (defaultSession != "") "-s ${defaultSession} " +
    (optionalString (defaultMonitor != 0) "-m ${toString defaultMonitor} ") +
    (optionalString (wallpaperDir != "") "-w ${wallpaperDir} ") +
    (optionalString (test != false) "-t ") +
    (concatMapStrings (sessionDir: "-d ${sessionDir} ") sessionDirs) +
    (concatMapStrings (e: " - e " + e + " ") (
      attrsets.mapAttrsToList (k: v: k + "= " + (toString v)) env))
    )
  ;
  hyprConfFinal = pkgs.writeText "aika-greet-hyprland-conf" ''
    exec-once = ${aika-greet}/bin/aika-greet ${argv} > /home/greeter/aika-greet.log 2>&1; ${pkgs.hyprland}/bin/hyprctl dispatch exit
    ${hyprConf}
  '';
in
pkgs.writeScript "aika-greet-hyprland" ''
  ${pkgs.hyprland}/bin/Hyprland --config ${hyprConfFinal} 
''


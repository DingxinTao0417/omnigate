# Brand assets

`omnigate-source.png` is the master Omnigate mark (1254×1254, opaque white
background). It is the design source and is not shipped or referenced at
runtime.

The following assets are derived from it. All of them have the white
background removed, transparent margins trimmed, and a 4% padding added back:

| Derived asset | Size | Used for |
| --- | --- | --- |
| `web/public/logo.png` | 512×512 | In-app logo, default `DEFAULT_LOGO` |
| `web/public/favicon.ico` | 16–256 (6 sizes) | Browser tab icon |
| `web/public/apple-touch-icon.png` | 180×180 | iOS "Add to Home Screen" |
| `electron/icon.png` | 1024×1024 | Desktop app icon |

When regenerating, two details matter: only the white region connected to the
canvas border may be cleared, so enclosed light areas inside the mark survive;
and fully transparent pixels must take the colour of the nearest opaque pixel,
otherwise downscaling bleeds white halos along the edges.

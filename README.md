English | [繁體中文](README.zh-TW.md)

# YouTube Video Rotate

A userscript that adds a "rotate clockwise" button to the YouTube player. Each click turns the video by 90 degrees (0 -> 90 -> 180 -> 270 -> 0 ...) and automatically scales and centers it so a rotated portrait video is not cropped or pushed outside the player.

Works on regular watch pages, theater mode, fullscreen, Shorts, and embedded players. The on-screen text (button tooltip and the "rotated" toast) is currently in Traditional Chinese.

## Requirements

A userscript manager such as [Tampermonkey](https://www.tampermonkey.net/) or [Violentmonkey](https://violentmonkey.github.io/).

On Chrome, the extensions page may require **Developer mode** (and, for some versions, "Allow user scripts") to be turned on; otherwise the script installs but never runs.

## Install

1. Install a userscript manager (see above).
2. Open the raw script and confirm the install prompt:
   [youtube-video-rotate.user.js](https://raw.githubusercontent.com/shaoen901109/youtube-video-rotate/main/youtube-video-rotate.user.js)
3. Reload any open YouTube tab (F5).

Alternatively, create a new script in your manager and paste in the contents of `youtube-video-rotate.user.js`.

## Usage

- **Button**: in the player's control bar (bottom right, next to the settings gear; move the mouse over the video if the bar is hidden). Left click rotates 90 degrees clockwise. The current angle is shown as a small badge on the button.
- **Right click** the button: rotate 90 degrees counter-clockwise. **Middle click**: reset to 0.
- **Keyboard shortcuts**: `Alt+R` rotate clockwise, `Alt+Shift+R` rotate counter-clockwise, `Alt+0` reset. Shortcuts are ignored while typing in an input field.

By default the rotation resets when you move to another video.

## Settings

Edit the `CONFIG` block at the top of the script:

```js
const CONFIG = {
    keepRotationOnNavigate: false, // true: keep the angle when switching videos
    showToast: true,               // false: hide the on-screen angle message
    showButton: true,              // false: do not add the control-bar button
};
```

## Troubleshooting

Open the browser console on a YouTube page and run `__ytRotate.status()`. If the object does not exist, the script is not running (check Developer mode and that the script is enabled).

## Credits

| Purpose | Component | License |
|---|---|---|
| Userscript manager (runs the script) | [Tampermonkey](https://www.tampermonkey.net/) | see upstream |
| Userscript manager (alternative) | [Violentmonkey](https://violentmonkey.github.io/) | MIT |

Developed with the help of [Claude Code](https://claude.com/claude-code) (Anthropic).

## Author

- Website: https://shaoenstudio.com
- Email: shaoenstudio@gmail.com
- GitHub: [@shaoen901109](https://github.com/shaoen901109)

## License

[MIT](LICENSE)

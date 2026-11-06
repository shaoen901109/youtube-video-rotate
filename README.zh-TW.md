[English](README.md) | 繁體中文

> 📖 **圖文教學：** https://shao-en.com/blog/youtube-video-rotate-guide.html ——如果你不知道該如何操作，請把這篇文章交給你的 Claude 或 ChatGPT。

# YouTube 影片旋轉腳本

在 YouTube 播放器控制列加入「順時針旋轉」按鈕的使用者腳本（userscript）。每點一下轉 90°（0° → 90° → 180° → 270° → 0° ...），並自動縮放置中，避免直式（手機直拍）影片轉向後被裁切或超出播放器。

支援一般影片頁、劇院模式、全螢幕、Shorts 與嵌入影片。目前按鈕提示與畫面提示文字為繁體中文。

## 需求

需要使用者腳本管理擴充功能，例如 [Tampermonkey](https://www.tampermonkey.net/) 或 [Violentmonkey](https://violentmonkey.github.io/)。

Chrome 需要在 `chrome://extensions` 開啟「開發人員模式」（部分版本還要開啟「允許使用者腳本」），否則腳本會「安裝成功但不執行」。

## 安裝

1. 先安裝上述其中一種腳本管理擴充功能。
2. 開啟下列連結，在跳出的安裝頁按「安裝」：
   [youtube-video-rotate.user.js](https://raw.githubusercontent.com/shaoen901109/youtube-video-rotate/main/youtube-video-rotate.user.js)
3. 回到 YouTube 按 F5 重新整理一次即可生效。

也可以在管理擴充功能裡新增腳本，把 `youtube-video-rotate.user.js` 的內容整份貼進去，按 `Ctrl + S` 儲存。

## 使用方式

- **按鈕**：在播放器控制列（右下角、設定齒輪左邊；控制列自動隱藏時，滑鼠移到影片上就會出現）。左鍵點一下順時針轉 90°，旋轉中按鈕角落會顯示目前角度。
- **右鍵**點按鈕：逆時針轉 90°。**中鍵**（滾輪）點按鈕：還原 0°。
- **快捷鍵**：`Alt + R` 順時針、`Alt + Shift + R` 逆時針、`Alt + 0` 還原。在輸入框打字時不會觸發。

預設換到下一支影片時，角度會自動歸零。

## 可調整的設定

用管理擴充功能的編輯器打開腳本，最上方的 `CONFIG` 區塊：

```js
const CONFIG = {
    keepRotationOnNavigate: false, // 改成 true：換影片時保留旋轉角度
    showToast: true,               // 改成 false：不顯示畫面中央的角度提示
    showButton: true,              // 改成 false：不在控制列加入按鈕
};
```

## 疑難排解

- 看不到按鈕：滑鼠要移到影片上控制列才會出現。
- 完全沒反應：確認「開發人員模式」已開啟、腳本為啟用狀態，並重新整理 YouTube 分頁。
- 在 YouTube 頁面按 F12 開 Console，輸入 `__ytRotate.status()` 看診斷結果；若沒有這個物件，代表腳本沒在執行。
- 快捷鍵沒作用：先用滑鼠點一下影片畫面，讓焦點離開搜尋框，再按快捷鍵。

## 技術來源與致謝

| 用途 | 元件 | 授權 |
|---|---|---|
| 使用者腳本管理器（執行本腳本） | [Tampermonkey](https://www.tampermonkey.net/) | 見原專案 |
| 使用者腳本管理器（替代） | [Violentmonkey](https://violentmonkey.github.io/) | MIT |

開發過程使用 [Claude Code](https://claude.com/claude-code)（Anthropic）協助。

## 作者

- 網站：https://shaoenstudio.com
- 聯絡信箱：shaoenstudio@gmail.com
- GitHub：[@shaoen901109](https://github.com/shaoen901109)

## 授權

[MIT](LICENSE)

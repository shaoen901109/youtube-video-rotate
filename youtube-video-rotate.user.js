// ==UserScript==
// @name         YouTube 影片旋轉 (90 / 180 / 270)
// @name:en      YouTube Video Rotate (90/180/270)
// @namespace    https://github.com/shaoen901109/youtube-video-rotate
// @version      1.1.0
// @description  在 YouTube 播放器控制列加入「順時針旋轉」按鈕，點一下轉 90 度，並自動縮放置中以符合播放器大小。支援快捷鍵、劇院模式、全螢幕與嵌入影片。
// @author       shaoen901109
// @license      MIT
// @homepageURL  https://github.com/shaoen901109/youtube-video-rotate
// @supportURL   https://github.com/shaoen901109/youtube-video-rotate/issues
// @updateURL    https://raw.githubusercontent.com/shaoen901109/youtube-video-rotate/main/youtube-video-rotate.user.js
// @downloadURL  https://raw.githubusercontent.com/shaoen901109/youtube-video-rotate/main/youtube-video-rotate.user.js
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @match        https://music.youtube.com/*
// @match        https://www.youtube-nocookie.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @run-at       document-idle
// @grant        none
// ==/UserScript==

/* ============================================================================
 * 使用方式（主要就這一個）
 *   播放器右下角的「順時針旋轉」按鈕：點一下轉 90 度，連續點就一直轉
 *   0° → 90° → 180° → 270° → 0° → ... 循環
 *
 * 進階捷徑（用不到可忽略）
 *   Alt + R / Alt + Shift + R / Alt + 0   順時針 / 逆時針 / 還原
 *   按鈕右鍵 = 逆時針、中鍵 = 還原
 *
 * 除錯：在 YouTube 頁面按 F12 開 Console，輸入 __ytRotate.status()
 * ========================================================================== */

(function () {
    'use strict';

    // ---------------------------------------------------------------- 設定 --
    const CONFIG = {
        // 切換到下一支影片時是否保留旋轉角度（false = 每支影片都從 0 度開始）
        keepRotationOnNavigate: false,
        // 是否在畫面中央顯示「已旋轉 XX°」提示
        showToast: true,
        // 是否在播放器控制列加入旋轉按鈕
        showButton: true,
    };

    const LOG = '[YT-Rotate]';

    // ------------------------------------------------------------ 內部狀態 --
    let rotation = 0;          // 目前角度：0 / 90 / 180 / 270
    let rafId = 0;             // requestAnimationFrame 節流用
    let boundPlayer = null;    // 目前已綁定 ResizeObserver 的播放器
    let boundVideo = null;     // 目前已綁定事件的 video 元素
    let toastTimer = 0;

    const styleObserver = new MutationObserver(schedule);
    const resizeObserver = ('ResizeObserver' in window)
        ? new ResizeObserver(schedule)
        : null;

    // ------------------------------------------------------------ 元素查找 --
    function findVideo() {
        return document.querySelector('#movie_player video.html5-main-video')
            || document.querySelector('#shorts-player video.html5-main-video')
            || document.querySelector('video.html5-main-video')
            || document.querySelector('.html5-video-player video')
            || document.querySelector('video');
    }

    function findPlayer(video) {
        if (!video) return null;
        return video.closest('.html5-video-player')
            || video.closest('#movie_player')
            || video.parentElement;
    }

    // ------------------------------------------------------------ 旋轉計算 --
    /**
     * YouTube 會自行以 inline style 設定 video 的 width / height / left / top，
     * 所以這裡只加上 transform，並依播放器可視範圍重新縮放置中，
     * 這樣 90/270 度時影片才不會被裁掉或超出邊界。
     */
    function buildTransform(video, player, deg) {
        if (deg === 0) return '';

        const vw = video.clientWidth || parseFloat(video.style.width) || 0;
        const vh = video.clientHeight || parseFloat(video.style.height) || 0;
        const pw = player.clientWidth;
        const ph = player.clientHeight;
        if (!vw || !vh || !pw || !ph) return '';

        // 先把影片中心移到播放器中心（YouTube 有時會用 left/top 做置中）
        const left = parseFloat(video.style.left) || video.offsetLeft || 0;
        const top = parseFloat(video.style.top) || video.offsetTop || 0;
        const dx = pw / 2 - (left + vw / 2);
        const dy = ph / 2 - (top + vh / 2);

        // 90 / 270 度時長寬互換，需要縮放才塞得進播放器
        const quarter = (deg === 90 || deg === 270);
        const scale = quarter ? Math.min(pw / vh, ph / vw) : 1;

        return `translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px) `
            + `rotate(${deg}deg) scale(${scale.toFixed(4)})`;
    }

    function applyRotation() {
        const video = findVideo();
        const player = findPlayer(video);
        if (!video || !player) return;

        bindTargets(video, player);

        const deg = ((rotation % 360) + 360) % 360;
        const transform = buildTransform(video, player, deg);

        // 寫入期間先停掉 observer，避免自己觸發自己造成無限迴圈
        styleObserver.disconnect();
        if (transform) {
            video.style.setProperty('transform', transform, 'important');
            video.style.setProperty('transform-origin', 'center center', 'important');
        } else {
            video.style.removeProperty('transform');
            video.style.removeProperty('transform-origin');
        }
        styleObserver.observe(video, { attributes: true, attributeFilter: ['style'] });

        // 按鈕若出問題，絕不能連帶讓旋轉功能掛掉
        if (CONFIG.showButton) {
            try {
                updateButton(player, deg);
            } catch (err) {
                console.warn(LOG, '建立控制列按鈕失敗：', err);
            }
        }
    }

    function schedule() {
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
            rafId = 0;
            applyRotation();
        });
    }

    // --------------------------------------------------------- 事件的綁定 --
    function bindTargets(video, player) {
        if (boundVideo !== video) {
            boundVideo = video;
            video.addEventListener('loadedmetadata', schedule);
            video.addEventListener('resize', schedule);      // 影片解析度改變
            video.addEventListener('playing', schedule);
        }
        if (boundPlayer !== player) {
            if (resizeObserver) {
                if (boundPlayer) resizeObserver.unobserve(boundPlayer);
                resizeObserver.observe(player);
            }
            boundPlayer = player;
        }
    }

    // ------------------------------------------------------------ 旋轉操作 --
    function rotate(delta) {
        rotation = (((rotation + delta) % 360) + 360) % 360;
        applyRotation();
        toast(rotation === 0 ? '已還原' : `已旋轉 ${rotation}°`);
        return rotation;
    }

    function reset() {
        rotation = 0;
        applyRotation();
        toast('已還原');
        return rotation;
    }

    // -------------------------------------------------------------- 快捷鍵 --
    function isTyping(el) {
        if (!el) return false;
        const tag = el.tagName;
        return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
            || el.isContentEditable === true;
    }

    document.addEventListener('keydown', (e) => {
        if (!e.altKey || e.ctrlKey || e.metaKey) return;
        if (isTyping(document.activeElement)) return;

        const key = (e.key || '').toLowerCase();
        if (key === 'r') {
            e.preventDefault();
            e.stopPropagation();
            rotate(e.shiftKey ? -90 : 90);
        } else if (key === '0' || e.code === 'Digit0' || e.code === 'Numpad0') {
            e.preventDefault();
            e.stopPropagation();
            reset();
        }
    }, true);

    // -------------------------------------------------------- 控制列按鈕 --
    /*
     * 注意：YouTube 啟用了 Trusted Types (CSP)，在頁面環境中對 innerHTML 賦值
     * 會直接拋出 TypeError。以下一律使用 createElement / createElementNS 建構。
     */
    const SVG_NS = 'http://www.w3.org/2000/svg';

    function makeIcon() {
        // 標準「順時針旋轉」符號（Material rotate_right），置中於 36x36
        const svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('viewBox', '0 0 36 36');
        svg.setAttribute('fill', '#fff');
        svg.setAttribute('focusable', 'false');

        const g = document.createElementNS(SVG_NS, 'g');
        g.setAttribute('transform', 'translate(6,6)');

        const path = document.createElementNS(SVG_NS, 'path');
        path.setAttribute('d',
            'M15.55 5.55L11 1v3.07C7.06 4.56 4 7.92 4 12s3.05 7.44 7 7.93v-2.02'
            + 'c-2.84-.48-5-2.94-5-5.91s2.16-5.43 5-5.91V10l4.55-4.45zM19.93 11'
            + 'c-.17-1.39-.72-2.73-1.62-3.89l-1.42 1.42c.54.75.88 1.6 1.02 2.47h2.02z'
            + 'M13 17.9v2.02c1.39-.17 2.74-.71 3.9-1.61l-1.44-1.44'
            + 'c-.75.54-1.59.89-2.46 1.03zm3.89-2.42l1.42 1.41'
            + 'c.9-1.16 1.45-2.5 1.62-3.89h-2.02c-.14.87-.48 1.72-1.02 2.48z');

        g.appendChild(path);
        svg.appendChild(g);
        return svg;
    }

    /**
     * 新版播放器（ytp-delhi-modern）把按鈕分裝在 .ytp-right-controls-left /
     * -right 兩個子容器裡，直接塞進 .ytp-right-controls 會被 YouTube 的
     * `display:none` 規則藏起來，所以優先放進子容器。
     */
    function findControlBar(player) {
        return player.querySelector('.ytp-right-controls-left')
            || player.querySelector('.ytp-right-controls')
            || player.querySelector('.ytp-chrome-controls .ytp-right-controls');
    }

    function updateButton(player, deg) {
        const bar = findControlBar(player);
        if (!bar) return;

        let btn = player.querySelector('.ytr-rotate-button');

        // 控制列被 YouTube 重建時，按鈕會脫離 DOM，需要重新插入
        if (btn && !bar.contains(btn)) {
            btn.remove();
            btn = null;
        }

        if (!btn) {
            btn = document.createElement('button');
            btn.className = 'ytp-button ytr-rotate-button';
            btn.type = 'button';
            btn.setAttribute('aria-label', '順時針旋轉影片 90 度');
            btn.title = '順時針旋轉 90°（可連續點擊）\n右鍵：逆時針．中鍵：還原';

            const icon = document.createElement('span');
            icon.className = 'ytr-rotate-icon';
            icon.appendChild(makeIcon());

            const badge = document.createElement('span');
            badge.className = 'ytr-rotate-badge';

            btn.appendChild(icon);
            btn.appendChild(badge);

            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                rotate(90);
            });
            btn.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                rotate(-90);
            });
            btn.addEventListener('auxclick', (e) => {
                if (e.button === 1) {
                    e.preventDefault();
                    e.stopPropagation();
                    reset();
                }
            });

            bar.insertBefore(btn, bar.firstChild);
        }

        const badge = btn.querySelector('.ytr-rotate-badge');
        if (badge) badge.textContent = deg ? `${deg}°` : '';
        btn.classList.toggle('ytr-active', deg !== 0);
    }

    // ---------------------------------------------------------------- 提示 --
    function toast(text) {
        if (!CONFIG.showToast) return;
        const player = findPlayer(findVideo());
        if (!player) return;

        let el = player.querySelector('.ytr-toast');
        if (!el) {
            el = document.createElement('div');
            el.className = 'ytr-toast';
            player.appendChild(el);
        }
        el.textContent = text;
        el.classList.add('ytr-toast-show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.remove('ytr-toast-show'), 900);
    }

    // ---------------------------------------------------------------- 樣式 --
    function injectStyle() {
        if (document.getElementById('ytr-style')) return;
        const css = document.createElement('style');
        css.id = 'ytr-style';
        // textContent 不受 Trusted Types 限制，可安全使用
        css.textContent = `
            /* YouTube 會用 .ytp-right-controls .ytp-button { display:none } 藏掉
               沒有特定 class 的按鈕，這裡用 !important 強制顯示 */
            .html5-video-player .ytr-rotate-button {
                display: inline-block !important;
                position: relative !important;
                width: 40px !important;
                height: 100% !important;
                min-width: 40px !important;
                padding: 0 !important;
                border: none !important;
                background: transparent !important;
                opacity: .9;
                cursor: pointer;
                vertical-align: top;
            }
            .html5-video-player .ytr-rotate-button:hover { opacity: 1; }
            .html5-video-player .ytr-rotate-icon {
                display: flex !important;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
            }
            .html5-video-player .ytr-rotate-icon svg {
                width: 24px; height: 24px; display: block;
            }
            .html5-video-player .ytr-rotate-badge {
                position: absolute; right: 1px; bottom: 5px;
                font-size: 9px; line-height: 1; font-weight: 700;
                color: #3ea6ff; pointer-events: none; text-shadow: 0 0 2px #000;
            }
            .ytr-toast {
                position: absolute; left: 50%; top: 50%;
                transform: translate(-50%, -50%);
                padding: 10px 18px; border-radius: 4px;
                background: rgba(0,0,0,.75); color: #fff;
                font-size: 18px; font-family: "Roboto", Arial, sans-serif;
                pointer-events: none; opacity: 0;
                transition: opacity .2s ease; z-index: 2147483000;
            }
            .ytr-toast.ytr-toast-show { opacity: 1; }
        `;
        (document.head || document.documentElement).appendChild(css);
    }

    // -------------------------------------------------------- 換頁 / 初始化 --
    function onNavigate() {
        if (!CONFIG.keepRotationOnNavigate) rotation = 0;
        // YouTube 是 SPA，換頁後 player 會重建，稍等再套用
        setTimeout(applyRotation, 100);
        setTimeout(applyRotation, 600);
        setTimeout(applyRotation, 1500);
    }

    window.addEventListener('yt-navigate-finish', onNavigate, true);
    window.addEventListener('yt-page-data-updated', onNavigate, true);
    document.addEventListener('yt-player-updated', schedule, true);

    window.addEventListener('resize', schedule);
    ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange'].forEach((ev) => {
        document.addEventListener(ev, () => {
            schedule();
            setTimeout(applyRotation, 150);
        });
    });

    injectStyle();
    applyRotation();

    // 保底：定期確認按鈕還在、旋轉沒有被 YouTube 覆蓋掉
    setInterval(() => {
        if (rotation !== 0 || CONFIG.showButton) applyRotation();
    }, 1000);

    // 除錯用：Console 輸入 __ytRotate.status()
    window.__ytRotate = {
        rotate,
        reset,
        status() {
            const video = findVideo();
            const player = findPlayer(video);
            return {
                rotation,
                videoFound: !!video,
                playerFound: !!player,
                controlBar: player ? !!findControlBar(player) : false,
                buttonInDom: !!document.querySelector('.ytr-rotate-button'),
                buttonSize: (() => {
                    const b = document.querySelector('.ytr-rotate-button');
                    if (!b) return null;
                    const r = b.getBoundingClientRect();
                    return { w: Math.round(r.width), h: Math.round(r.height) };
                })(),
            };
        },
    };

    console.log(LOG, 'v1.1.0 已載入。除錯請用 __ytRotate.status()');
})();

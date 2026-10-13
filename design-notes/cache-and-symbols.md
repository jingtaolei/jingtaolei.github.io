# 静态版本一致性与手机符号

参考用户提供的《浏览器缓存问题分析》对话，采用内容指纹资源，辅以轻量的入口版本检测。当前网站是直接发布的静态 HTML，方案不依赖 React/Vite，也不需要改换 GitHub Pages。

## 发布流程

修改根目录的 `styles.css`、`surfaces.css`、JS 或原始图片，页面内容直接修改 `index.html` / `privacy.html`。发布之前在网站目录运行：

```sh
python3 tools/prepare_assets.py
python3 tools/prepare_assets.py --check
```

本次已生成，可以直接预览。生成器把页面引用换成 `assets/versioned/名称.内容摘要.扩展名`，同时处理 CSS 内图片引用。图片变化也会改变使用它的 CSS 地址。原始可编辑文件保留，已生成的历史资源不自动删除：这样，仍缓存旧 HTML 的浏览器也能加载同一版的样式和脚本。部署时需要包含 `assets/versioned/`、`asset-manifest.json` 和 `site-version.json`。

每个页面带一个发布标记。`version-check.js` 以不缓存的请求读取同源版本清单，检测到变化后仅重新打开一次带新版本参数的当前页面，保留原有参数和章节锚点。正常打开新页面时清理这个临时参数。请求失败或离线时保留已有页面；不会清除用户缓存、存储、Cookie，也不会注册 Service Worker。每次进入页面一次检查，浏览器历史恢复时再检查，无持续轮询。

不能强制让**此前尚未包含版本检测脚本的旧 HTML**立即更新：这类页面要等原有缓存重新验证。内容指纹避免后续发布中混用新旧资源。首次发布该机制后，不应马上移除原始资源。

如果以后使用可控制响应头的主机，应给 HTML 和版本清单配置 `Cache-Control: no-cache`，给指纹资源配置长期缓存。GitHub Pages 不会因为仓库出现 `_headers` 或 HTML meta 就应用这些 HTTP 响应头，所以本次没有添加伪配置。机制依据：[MDN HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching)。

## 符号一致性

所有界面箭头、八射线星号和展开加号都改为内嵌 SVG 路径，继承现有墨绿颜色与按钮变形反馈。不存在字体或系统 emoji 替换的问题。顶栏 ∀ 和正文数学记号保持原样。矢量符号设为装饰，不重复朗读链接名称。

## 验证

`tools/test_assets.py` 覆盖重复生成、图片改变后 CSS 级联换版本、旧文件保留、过时入口重建和仅文字改变后的版本更新。`tools/test_version_check.cjs` 覆盖锚点及原参数保留、防止重复刷新、成功后清理参数、离线与无效清单回退。还检查本地页面的实际资源加载和移动宽度布局。没有使用实体 iPhone 验证。

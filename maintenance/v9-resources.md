# 第九版：资源整理与保守压缩

不修改页面布局、字体、颜色、透明度、模糊、图片或动效参数。第八版完整备份在项目上层的 `ui-backups/v8-menu-and-analytics-2026-10-14/`。

## 发布文件与源文件

原网站目录约 7.89 MB（排除 Finder / Python 缓存）；精简发布目录约 1.25 MB，包含目前所有页面和兼容旧缓存所需的指纹，按这两个目录比较约减少 84%。这是发布目录体积，不代表访客原本每次会下载全部目录。

设计记录、对照截图、参考作品和未使用的艺术大图归档至项目上层 `website-archive/v8-design-materials-2026-10-14/`。当前页面使用的 Monet / Sisley JPEG、CV 和图标字节保持原样。开发工具、Worker 源码、素材源文件和维护文档留在源码仓库，但通过 `_config.yml` 排除在 GitHub Pages 发布之外；`dist/` 只含实际发布文件。Node 依赖仅在构建时使用，不上传到线上。诊断页 `analytics-check.html` 保留，它只在主动打开时加载，首页不会请求它。

当前实际加载的 CSS/JS 由 64,899 bytes 减至 53,949 bytes，约减少 17%。使用锁定版本的 esbuild，仅压缩空白，保留变量名和原语法；不做颜色、选择器、动画或图片的激进优化。已有离屏动画暂停、隐藏标签页暂停与减少动态偏好继续保留，没有添加运行时循环、定时轮询或持续帧回调。

## 缓存与旧指纹

`tools/published-releases.json` 只记录真正发布过的版本，本次核对了 GitHub 的三个发布提交，包含统计配置的新版本。当前构建始终保留；最新线上版本即使很久不发布也始终保留；其他实际发布版本在后续发布后保留至少 30 天。构建失败会明确报出缺失资源，不能静默跳过。图片等相同指纹由多个版本共用，不重复复制。

未发布过、当前也没有引用的 `styles.b94b32bb1975.css` 已移到 `website-archive/unused-fingerprints/`。近期线上旧版本还在兼容期，保留它们避免旧 HTML 找不到 CSS/JS；这些旧文件不会被新页面下载。

发布后确认 Pages 成功，再执行：

```sh
python3 tools/build_site.py --record-published <真实提交SHA>
```

这会更新发布历史并为刚被替换的线上版本重新开始 30 天兼容期。需要清理过期或未发布指纹时执行：

```sh
python3 tools/build_site.py --archive-unused
```

清理只移动未受保护的指纹，不永久删除；随后重新生成精简发布目录。不会把每次本地测试误当成发布，也不会清除访客浏览器缓存。

## 构建和验证

```sh
npm ci
npm run build
npm run check
npm test
```

本地原预览仍可从网站根目录访问；也可以用 `http://127.0.0.1:4173/dist/index.html` 检查完全独立的发布包。GitHub Pages 继续使用现有 main 根目录构建，只需下次提交 `_config.yml`，不需要改变 hosting 设置或新增自动发布流程。

验证覆盖资源引用、重复构建、旧版本保留与过期归档、发布文件白名单、缺失资源拒绝、版本检测防循环与离线回退。浏览器对照检查了 461 个元素的排版、字体、颜色、背景、模糊和动画/过渡参数，优化前后一致。实际页面正文、SVG、图片、图标与 CV 对照备份一致。没有宣称测得 CPU/内存百分比，也没有实体手机功耗测试。

依据：[esbuild 压缩选项](https://esbuild.github.io/api/#minify)、[Jekyll 发布排除配置](https://jekyllrb.com/docs/configuration/options/)、[MDN 内容指纹与缓存](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching)。

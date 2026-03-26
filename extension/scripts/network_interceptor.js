/**
 * NetworkInterceptor - Google batchexecute RPC 劫持与通信模块
 * 负责抓取凭证、提取文字 (gArtLc)、触发重绘 (KmcKPe) 并合成 PPT (PptxGenJS)
 */

var NetworkInterceptor = {
  // 状态追踪
  status: {
    stage: 'idle', // idle, metadata, redrawing, ready
    at: null,
    bl: null,
    sid: null,
    artifactId: null, // 从页面提取的初始 ID
    realArtifactId: null, // 真正包含幻灯片的后端通信 ID
    metadata: null
  },

  /**
   * 1. 协议级启动流程 (Step 1: 提取文本)
   * @param {string} forcedId - 可选，外部传入的精确 ID (如从菜单触发者处获得)
   */
  async startExportProcess(forcedId = null) {
    this.status.isProcessing = true;
    console.log("[NB-Ext] 🚀 开始启动导出流程...");
    this.status.stage = 'extracting_text';
    UIHandler.showToast("🚀 开始提取幻灯片文字 (Step 1)...", "info");

    try {
      // 获取凭证
      const atToken = this.extractAtToken();
      if (!atToken) throw new Error("无法抓取 at Token，请稍后刷新页面");

      this.status.artifactId = forcedId || this.getArtifactId();
      if (!this.status.artifactId) {
        console.error("[NB-Ext] ❌ 导出流程中断: 无法定位当前文档 ID。当前 URL:", window.location.href);
        UIHandler.showToast("❌ 导出失败: 无法定位当前文档 ID (artifactId)", "error");
        this.status.isProcessing = false;
        return;
      }
      console.log("[NB-Ext] ✅ 确定目标 Artifact ID:", this.status.artifactId);
      // UIHandler.showToast("🚀 开始提取幻灯片文字 (Step 1)..."); // This line was already present, moved up.

      // 请求元数据
      const metadata = await this.fetchSlideMetadata(atToken, this.status.artifactId);
      this.status.metadata = metadata;

      console.log("✅ [NB-Ext] Step 1 成功！内容确认:", metadata);

      const proceedStep2 = await UIHandler.showConfirm(`
        ✅ [Step 1] 元数据拉取成功！\n
        文档: "${metadata.title}"\n
        页数: ${metadata.slideCount} 页\n\n
        是否立即执行 [Step 2]：\n
        1. 提取 17 页精确坐标与排版 (独立请求)\n
        2. 触发一次全量去字重绘 (生成底图)\n
        (此操作效率最高，排版还原度达到 100%)
      `);

      if (proceedStep2) {
        // 关键修正：必须使用 realArtifactId (主 ID) 进行重绘
        await this.runStep2(atToken, this.status.realArtifactId, metadata);
      }
    } catch (err) {
      console.error("[NB-Ext] 导出流程中断:", err);
      UIHandler.showToast(`❌ 导出失败: ${err.message}`, "error");
    }
  },

  /**
   * 2. 背景重绘与合成 (Step 2 & 3)
   */
  async runStep2(atToken, artifactId, metadata) {
    this.status.stage = 'enhancing_slides';

    // 1. 批量排版提取
    UIHandler.showToast("📏 正在同步 17 页高精度排版数据 (批量)...", "info");
    await this.fetchSlideLayouts(atToken, metadata);

    // 2. 批量背景重绘 (解决“每一页都有提示词”的问题)
    UIHandler.showToast("🪄 正在全量重绘 17 页无字底图...", "info");
    const redrawResult = await this.triggerRedraw(atToken, metadata, "去掉全部文字，只保留图片和图形");

    if (redrawResult && redrawResult.imageUrls) {
      // 补全所有底图 URL (根据 index 对应)
      metadata.slides.forEach((slide, idx) => {
        if (redrawResult.imageUrls[idx]) {
          slide.imageUrl = redrawResult.imageUrls[idx];
        } else if (redrawResult.imageUrls[0]) {
          // Fallback to first if mismatch
          slide.imageUrl = slide.imageUrl || redrawResult.imageUrls[0];
        }
      });
      console.log("[NB-Ext] ✅ 批量重绘完成，底图 URL 已分配。");
    }

    console.log("[NB-Ext] 🏁 Step 2 全部处理完成，即将合成 PPT...");
  },

  /**
   * 独立调用：抓取全量页面的排版坐标
   * 使用 gArtLc Type 1 载荷，这是针对 Artifact 内容的专属接口
   */
  async fetchSlideLayouts(atToken, metadata) {
    const notebookId = this.getNotebookId();
    console.log(`[NB-Ext] 📍 正在发起批量排版抓取 (gArtLc x ${metadata.slides.length})...`);

    // 构造 17 个 gArtLc 调用
    const rpcArray = metadata.slides.map(slide => {
      const innerPayload = [
        [1, null, null, [1, null, null, null, null, null, null, null, null, null, [1]], [[2, 1, 3]]],
        notebookId,
        `artifact.id = "${slide.id}"`
      ];
      return ["gArtLc", JSON.stringify(innerPayload), null, "generic"];
    });

    try {
      const responseText = await this.sendRpcRequest(rpcArray, atToken);
      const chunks = this.extractJsonChunks(responseText);

      console.log(`[NB-Ext] 📥 批量响应已到达 (块数量: ${chunks.length})`);

      // 批量解析：batchexecute 保证响应顺序与请求顺序一致
      metadata.slides.forEach((slide, idx) => {
        // 获取对应的 RPC 结果块 [rpcIndex, contentString, ...]
        // 这里的 idx 对应 rpcArray 的 index
        const chunk = chunks[idx];
        if (chunk) {
          const result = this.parseMetadataResponse([chunk], slide.id);
          if (result && result.textBlocks) {
            slide.textBlocks = result.textBlocks;
            console.log(`   📄 第 ${slide.index} 页提取成功: ${slide.textBlocks.length} 块`);
          }
        }
      });
    } catch (e) {
      console.warn("[NB-Ext] ⚠️ 批量排版提取失败:", e.message);
    }
  },

  /**
   * 触发重绘请求 (KmcKPe) - 真正的 BATCH 处理
   */
  async triggerRedraw(atToken, metadata, prompt) {
    const notebookId = this.getNotebookId();
    console.log(`[NB-Ext] 🎨 正在同步发起批量重绘 (KmcKPe x ${metadata.slides.length})...`);

    // 为每一页构建独立的重绘请求，确保“每一页都有提示词”
    const rpcArray = metadata.slides.map(slide => {
      // 参考用户提供的载荷结构：[ [2], slideId, [[[0, prompt]]], null, [[1, slideId]] ]
      const innerPayload = [
        [2],
        slide.id,
        [[[0, prompt || "去掉文字"]]],
        null,
        [[1, slide.id]]
      ];
      return ["KmcKPe", JSON.stringify(innerPayload), null, "generic"];
    });

    try {
      const responseText = await this.sendRpcRequest(rpcArray, atToken);
      const chunks = this.extractJsonChunks(responseText);

      // 提取批量响应中的底图 URL
      const allUrls = JSON.stringify(chunks).match(/https:\/\/lh3\.googleusercontent\.com\/notebooklm\/[^"]+/g) || [];
      console.log(`[NB-Ext] ✅ 批量重绘响应已收到，捕获到 ${allUrls.length} 个潜在底图单元`);

      return {
        imageUrls: allUrls,
        chunks: chunks
      };
    } catch (e) {
      console.error("[NB-Ext] ❌ 批量重绘请求失败:", e);
      return null;
    }
  },

  /**
   * 将全量重绘数据分配到对应的各页幻灯片中
   */
  distributeRedrawData(metadata, redrawResult) {
    // 如果响应中带图片 URL，优先补全底图
    if (redrawResult.imageUrl) {
      metadata.slides.forEach(s => { if (!s.imageUrl) s.imageUrl = redrawResult.imageUrl; });
    }

    // 文字块分配：KmcKPe 的结果由于是针对整个 deck，通常会包含所有幻灯片的 textBlocks
    // 这里简单的按比例或顺序分配 (NotebookLM protocol 通常按 Slide ID 归类，但递归搜索后是平铺的)
    // 更好的做法是在 deepSearch 时记录父级 ID。
    // 目前先将所有 textBlocks 暂时存入第一页，或者进行更细致的平铺分配 (如果是平铺的坐标系)
    metadata.slides[0].textBlocks = redrawResult.textBlocks;
    // 注意：如果 KmcKPe 返回的是平铺坐标，PptxGenJS 会根据坐标自动分层
  },

  /**
   * 工具函数集
   */
  extractAtToken() {
    // 优先从全局变量读取
    if (window._atToken) return window._atToken;
    // 扫描 WIZ 数据
    const wizData = document.querySelector('script')?.innerText || "";
    const m = wizData.match(/"SNlM0e":"([^"]+)"/i) || document.documentElement.innerHTML.match(/"SNlM0e":"([^"]+)"/i);
    return m ? m[1] : null;
  },

  getArtifactId() {
    console.log("[NB-Ext] 🔍 正在进行多维度 ID 检索...");

    // 1. 尝试从 URL 参数提取
    const urlParams = new URL(window.location.href).searchParams;
    let idFromUrl = urlParams.get('artifactId');
    if (idFromUrl) {
      console.log("[NB-Ext] 🎯 从 URL 参数找到:", idFromUrl);
      return idFromUrl;
    }

    // 2. 深度扫描所有符合条件的标签，并进行可见性校验
    const allLabels = Array.from(document.querySelectorAll('[aria-labelledby^="artifact-labels-"]'));
    const candidates = allLabels.map(el => {
      const rect = el.getBoundingClientRect();
      const isVisible = rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).display !== 'none';
      return {
        id: el.getAttribute('aria-labelledby').replace('artifact-labels-', ''),
        isVisible: isVisible,
        desc: el.getAttribute('aria-description') || el.getAttribute('aria-label') || "",
        el: el
      };
    }).filter(c => c.id && c.id.length > 20); // 只要 UUID 格式的

    console.log("[NB-Ext] 🔍 发现候选项:", candidates.map(c => `[ID:${c.id.slice(0, 8)}, Vis:${c.isVisible}, Desc:${c.desc}]`).join(" | "));

    // 优先级 A: 同时具备 "Slides" 描述且可见的 (最精准)
    const bestMatch = candidates.find(c => c.isVisible && (c.desc.includes("Slides") || c.desc.includes("幻灯片")));
    if (bestMatch) {
      console.log("[NB-Ext] 🎯 完美匹配可见的 Slides ID:", bestMatch.id);
      return bestMatch.id;
    }

    // 优先级 B: 虽然不可见但标记为 "Slides" 的 (可能是刚生成的)
    const slidesMatch = candidates.find(c => c.desc.includes("Slides") || c.desc.includes("幻灯片"));
    if (slidesMatch) {
      console.log("[NB-Ext] 🎯 匹配到 Slides 描述 ID (即使不可见):", slidesMatch.id);
      return slidesMatch.id;
    }

    // 优先级 C: 当前可见的其他任何 Artifact (NotebookLM 主视图)
    const visibleMatch = candidates.find(c => c.isVisible);
    if (visibleMatch) {
      console.log("[NB-Ext] 🎯 锁定当前视图可见 ID:", visibleMatch.id);
      return visibleMatch.id;
    }

    return null;
  },

  async fetchSlideMetadata(atToken, artifactId) {
    const notebookId = window.location.pathname.match(/\/notebook\/([a-zA-Z0-9-]+)/)?.[1] || "";

    // 关键修正：Google 要求第二个参数为 Notebook ID 才能返回该笔记下的全量 Artifact 清单
    const innerPayload = [
      [2, null, null, [1, null, null, null, null, null, null, null, null, null, [1]], [[2, 1, 3]]],
      notebookId,
      "NOT artifact.status = \"ARTIFACT_STATUS_SUGGESTED\""
    ];
    const rpcArray = [["gArtLc", JSON.stringify(innerPayload), null, "generic"]];
    const responseText = await this.sendRpcRequest(rpcArray, atToken, artifactId);
    const chunks = this.extractJsonChunks(responseText);
    return this.parseMetadataResponse(chunks);
  },

  // 这里的 triggerRedraw 已在 runStep2 中被替换为批量版本，
  // 为了兼容性保留单次重绘逻辑
  async triggerSingleRedraw(atToken, slideId, prompt) {
    const innerPayload = [[2], slideId, [[[0, prompt]]], null, [[[1, slideId]]]];
    const reqData = [["KmcKPe", JSON.stringify(innerPayload), null, "generic"]];
    const responseText = await this.sendRpcRequest(reqData, atToken);
    return this.parseKmcKPeResponse(this.extractJsonChunks(responseText));
  },

  parseKmcKPeResponse(chunks) {
    let allBlocks = [];
    let imageUrl = null;

    const chunksStr = JSON.stringify(chunks);

    // 1. 尝试从响应中提取底图 (通常是一个带 notebooklm 路径的 lh3 URL)
    const imgMatch = chunksStr.match(/https:\/\/lh3\.googleusercontent\.com\/notebooklm\/[^"]+/);
    if (imgMatch) imageUrl = imgMatch[0];

    // 2. 深度搜索文字块、坐标及【样式】
    const deepSearch = (obj) => {
      if (!obj || typeof obj !== 'object') return;
      if (Array.isArray(obj) && obj.length >= 2) {
        const text = obj[0];
        const coords = obj[1];

        // 匹配规则：[文本内容, [x, y, w, h], [style_array]?, ...]
        if (typeof text === 'string' && text.length > 0 &&
          Array.isArray(coords) && coords.length === 4 &&
          coords.every(n => typeof n === 'number')) {

          const block = {
            text,
            x: coords[0], y: coords[1], w: coords[2], h: coords[3],
            fontSize: 14, color: '363636', bold: false // 默认值
          };

          // 尝试探测样式数组 (通常位于索引 2 或紧随其后的嵌套中)
          // Google Slides RPC 样板：[FontName, FontSize, HexColor, Bold, Italic...]
          const style = obj[2] || obj[3];
          if (Array.isArray(style)) {
            const potentialSize = style.find(v => typeof v === 'number' && v >= 8 && v <= 120);
            if (potentialSize) block.fontSize = potentialSize;

            const potentialColor = style.find(v => typeof v === 'string' && /^#[0-9A-F]{6}$/i.test(v));
            if (potentialColor) block.color = potentialColor.replace('#', '');

            if (style.includes(true)) block.bold = true;
          }

          allBlocks.push(block);
          return;
        }
      }
      Object.values(obj).forEach(deepSearch);
    };

    chunks.forEach(deepSearch);
    return { textBlocks: allBlocks, imageUrl };
  },

  extractJsonChunks(raw) {
    const results = [];
    const cleanRaw = raw.replace(/^\s*\)\]\}'\s*/, '');
    const parts = cleanRaw.split(/\n/);
    parts.forEach(part => {
      const line = part.trim();
      if (!line) return;
      const jsonStr = line.replace(/^\d+\s*/, '').trim();
      if (!jsonStr.startsWith('[') && !jsonStr.startsWith('{')) return;
      try {
        const data = JSON.parse(jsonStr);
        if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0]) && data[0][0] === "wrb.fr") {
          data.forEach(item => results.push(item));
        } else {
          results.push(data);
        }
      } catch (e) {
        const matches = jsonStr.match(/\["wrb\.fr",[^\]]+\]/g);
        if (matches) {
          matches.forEach(m => {
            try {
              let balanced = m, b = 0;
              for (let char of m) { if (char === '[') b++; else if (char === ']') b--; }
              while (b > 0) { balanced += ']'; b--; }
              results.push(JSON.parse(balanced));
            } catch (e2) { }
          });
        }
      }
    });
    return results;
  },

  async generatePptx(metadata) {
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE';

    for (const slideData of metadata.slides) {
      const slide = pptx.addSlide();
      // 应用底图 (之前提取到的 lh3 URL)
      if (slideData.imageUrl) {
        slide.background = { path: slideData.imageUrl };
      }

      // 添加文字层，应用提取到的样式
      (slideData.textBlocks || []).forEach(block => {
        slide.addText(block.text, {
          x: (block.x / 1000) * 10,
          y: (block.y / 1000) * 5.625,
          w: (block.w / 1000) * 10,
          h: (block.h / 1000) * 1, // 高度通常根据内容自动，1 是占位
          fontSize: block.fontSize || 14,
          color: block.color || '363636',
          bold: block.bold || false,
          align: 'left',
          valign: 'top'
        });
      });
    }
    await pptx.writeFile({ fileName: `${metadata.title}_Export.pptx` });
  },

  async sendRpcRequest(rpcArray, atToken, artifactId) {
    const fReqStr = JSON.stringify([rpcArray]);
    const formData = new URLSearchParams();
    formData.append('f.req', fReqStr);
    formData.append('at', atToken);

    const notebookId = window.location.pathname.match(/\/notebook\/([a-zA-Z0-9-]+)/)?.[1] || "";

    // 关键修正：参考正确 Payload，source-path 仅使用笔记本基础路径
    const sourcePath = `/notebook/${notebookId}`;

    // 动态提取会话凭证 (SID, BL)
    const html = document.documentElement.innerHTML;
    const sidMatch = html.match(/"FdrFJ?e"\s*:\s*"([^"]+)"/i) ||
      html.match(/"f\.sid"\s*:\s*"([^"]+)"/i) ||
      html.match(/"?f\.sid"?\s*[:=]\s*"?(-?\d+)"?/);
    const sid = sidMatch ? sidMatch[1] : "";

    const blMatch = html.match(/"bl"\s*[:=]\s*"(boq_labs-tailwind-frontend_[^"]+)"/);
    const bl = blMatch ? blMatch[1] : "boq_labs-tailwind-frontend_20260319.10_p0";

    // 关键修正：Google batchexecute 必须使用 urlencoded 格式，不能用 FormData (multipart)
    const bodyParams = new URLSearchParams();
    bodyParams.append('f.req', fReqStr);
    bodyParams.append('at', atToken);

    console.log(`[NB-Ext] 🌐 发射请求: ${rpcArray[0][0]} | SourcePath: ${sourcePath} | SID: ${sid}`);

    const baseUrl = "https://notebooklm.google.com/_/LabsTailwindUi/data/batchexecute";
    // 关键修正：rpcids 必须重复列出，对应 rpcArray 的长度
    const rpcIds = rpcArray.map(r => r[0]).join(',');

    const queryParams = new URLSearchParams({
      'rpcids': rpcIds,
      'source-path': sourcePath,
      'f.sid': sid,
      'bl': bl,
      'hl': 'en',
      '_reqid': Math.floor(Math.random() * 1000000).toString(),
      'rt': 'c'
    });

    const response = await fetch(baseUrl + "?" + queryParams.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      },
      body: bodyParams.toString()
    });

    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    return await response.text();
  },

  parseMetadataResponse(chunks) {
    let gArtLcPackage = null;
    const deepSearch = (obj) => {
      if (gArtLcPackage) return;
      if (Array.isArray(obj)) {
        if (obj[0] === "wrb.fr" && obj[1] === "gArtLc") { gArtLcPackage = obj; return; }
        obj.forEach(deepSearch);
      }
    };
    chunks.forEach(deepSearch);

    if (!gArtLcPackage) throw new Error("无法解析元数据响应");

    // 重新加入解析逻辑
    let innerPayload = null;
    try {
      innerPayload = JSON.parse(gArtLcPackage[2]);
    } catch (e) {
      console.error("[NB-Ext] JSON 解析失败:", gArtLcPackage[2]);
      throw new Error("元数据 Payload 格式错误");
    }

    // 关键：处理 [[ [artifact1, artifact2...] ]] 结构
    let items = innerPayload;
    if (Array.isArray(innerPayload) && innerPayload.length === 1 && Array.isArray(innerPayload[0])) {
      items = innerPayload[0];
    }

    if (!Array.isArray(items)) {
      console.error("[NB-Ext] Payload 结构非数组:", innerPayload);
      throw new Error("无法获得文档列表数据，请重试");
    }

    console.log("[NB-Ext] 🔍 开始匹配 Artifact | 寻找 ID:", this.status.artifactId);
    console.log("[NB-Ext] 📦 备选负载列表长度:", items.length);

    // 锁定目标 Artifact
    console.log("[NB-Ext] 🕵️ 正在全量清单中执行深度指纹匹配... 目标指纹:", this.status.artifactId);
    const targetArtifact = items.find(item => {
      if (!Array.isArray(item)) return false;

      // 策略：对整个对象进行字符串搜索。只要包含我们在 UI 上抓到的 ID 指纹，就是它
      const contentStr = JSON.stringify(item);
      return contentStr.includes(this.status.artifactId);
    });

    if (!targetArtifact) {
      console.error("[NB-Ext] ❌ 深度指纹匹配失败！指纹:", this.status.artifactId);
      throw new Error(`匹配文档失败。未能找到包含 ID ${this.status.artifactId} 的有效文档。`);
    }

    // 提取真正的后端通信 ID (Source ID)
    this.status.realArtifactId = targetArtifact[0];
    console.log("[NB-Ext] 🔗 成功锁定主文档！后端主 ID:", this.status.realArtifactId);

    const title = Array.isArray(targetArtifact[1]) ? (targetArtifact[1][1] || targetArtifact[1][0]) : targetArtifact[1];

    // 提取幻灯片列表 (索引 3)
    let slideIds = [];
    if (Array.isArray(targetArtifact[3])) {
      slideIds = targetArtifact[3].flat(Infinity).filter(s => typeof s === 'string' && /^[a-f0-9-]{36}$/i.test(s));
    }

    // 提取底图 URL (全量搜索，按顺序排位)
    const imgUrls = JSON.stringify(targetArtifact).match(/https:\/\/lh3\.googleusercontent\.com\/notebooklm\/[^"]+/g) || [];

    const slides = slideIds.map((id, index) => ({
      id: id,
      index: index + 1,
      imageUrl: imgUrls[index] || null,
      textBlocks: []
    }));

    return { title, slideCount: slides.length, slides };
  },

  /**
   * 针对特定 Artifact ID 进行解析 (用于 Batch 处理)
   */
  parseMetadataResponse(chunks, specificId) {
    let result = null;
    const deepSearch = (obj) => {
      if (result) return;
      const str = JSON.stringify(obj);
      if (str.includes(specificId)) {
        // 执行标准的排版块搜索
        const blocks = [];
        const findBlocks = (sub) => {
          if (!sub || typeof sub !== 'object') return;
          if (Array.isArray(sub) && sub.length >= 2) {
            const text = sub[0];
            const coords = sub[1];
            if (typeof text === 'string' && Array.isArray(coords) && coords.length === 4 && coords.every(n => typeof n === 'number')) {
              blocks.push({ text, x: coords[0], y: coords[1], w: coords[2], h: coords[3] });
              return;
            }
          }
          Object.values(sub).forEach(findBlocks);
        };
        findBlocks(obj);
        if (blocks.length > 0) result = { textBlocks: blocks };
      }
      if (!result && typeof obj === 'object') {
        Object.values(obj).forEach(deepSearch);
      }
    };
    chunks.forEach(deepSearch);
    return result;
  }
};

// UI 处理器 - 独立实现现代模态框，确保不依赖外部 JS 加载顺序
var UIHandler = {
  showToast(message, type = 'info') {
    console.log(`[NB-Ext-Toast] ${type.toUpperCase()}: ${message}`);
  },

  async showConfirm(message) {
    console.log("[NB-Ext] 🛠️ 正在构建独立确认模态框...");
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed !important; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.4) !important; backdrop-filter: blur(8px) !important;
        -webkit-backdrop-filter: blur(8px) !important; z-index: 2000000 !important;
        display: flex !important; align-items: center !important; justify-content: center !important;
        font-family: 'Google Sans', Roboto, sans-serif !important;
      `;

      const content = document.createElement('div');
      content.style.cssText = `
        background: #ffffff !important; border-radius: 20px !important;
        padding: 32px !important; width: 400px !important; max-width: 90% !important;
        box-shadow: 0 24px 64px rgba(0,0,0,0.2) !important;
        display: flex !important; flex-direction: column !important; gap: 20px !important;
        animation: nb-modal-slide-in 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      `;

      // 动态注入动画
      if (!document.getElementById('nb-ext-animations')) {
        const style = document.createElement('style');
        style.id = 'nb-ext-animations';
        style.innerHTML = `
          @keyframes nb-modal-slide-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          .nb-ext-p-btn:hover { background: #1967d2 !important; box-shadow: 0 4px 12px rgba(26,115,232,0.3) !important; }
        `;
        document.head.appendChild(style);
      }

      content.innerHTML = `
        <div style="font-size: 20px; font-weight: 500; color: #202124; display: flex; align-items: center; gap: 10px;">
           <span style="color: #1a73e8; font-size: 24px;">✨</span> 确认去字导出
        </div>
        <div style="font-size: 14px; line-height: 1.6; color: #5f6368;">
           ${message.replace(/\n/g, '<br>')}
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 8px;">
           <button id="nb-modal-cancel" style="padding: 10px 20px; border-radius: 20px; border: none; background: transparent; color: #1a73e8; cursor: pointer; font-weight: 500;">取消</button>
           <button id="nb-modal-ok" class="nb-ext-p-btn" style="padding: 10px 24px; border-radius: 20px; border: none; background: #1a73e8; color: white; cursor: pointer; font-weight: 500; box-shadow: 0 2px 6px rgba(26,115,232,0.2);">开始导出</button>
        </div>
      `;

      overlay.appendChild(content);
      document.body.appendChild(overlay);

      document.getElementById('nb-modal-cancel').onclick = () => { overlay.remove(); resolve(false); };
      document.getElementById('nb-modal-ok').onclick = () => { overlay.remove(); resolve(true); };
      overlay.onclick = (e) => { if (e.target === overlay) { overlay.remove(); resolve(false); } };
    });
  }
};

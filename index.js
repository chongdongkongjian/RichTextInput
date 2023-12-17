const editor = document.querySelector(".editor");
const fileDom = document.querySelector(".file");

fileDom.addEventListener("click", () => {
  // 光标聚焦到输入框
  editor.focus();
  const input = document.createElement("input");
  input.setAttribute("type", "file");
  input.setAttribute("multiple", "true");
  input.addEventListener("change", () => {
    const files = input.files;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      fileTypeCheck(file);
    }
  });
  input.click();
});

/**
 *  将指定节点插入到光标位置
 * @param {DOM} fileDom dom节点
 */
function insertNode(dom) {
  // 获取光标
  const selection = window.getSelection();
  // 获取选中的内容
  const range = selection.getRangeAt(0);
  // 删除选中的内容
  range.deleteContents();
  // 将节点插入范围最前面添加节点
  range.insertNode(dom);
  // 将光标移到选中范围的最后面
  selection.collapseToEnd();
}

/**
 * 处理粘贴图片
 * @param {File} imageFile 图片文件
 */
function handleImage(imageFile) {
  // 创建文件读取器
  const reader = new FileReader();
  // 读取完成
  reader.onload = (e) => {
    // 创建img标签
    const img = new Image();
    img.src = e.target.result;
    img.className = "image";
    insertNode(img);
  };
  reader.readAsDataURL(imageFile);
}

editor.onclick = (e) => {
  if (e.target.nodeName !== "IMG") return;
  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  range.setEndAfter(e.target);
  selection.collapseToEnd();
};

/**
 * 返回文件卡片的DOM
 * @param {File} file 文件
 * @returns 返回dom结构
 */
function createFileDom(file) {
  const size = file.size / 1024;
  let extension = "未知文件";
  if (file.name.indexOf(".") >= 0) {
    const fileName = file.name.split(".");
    extension = fileName.pop();
  }
  const templte = `
  <rect
    x="2"
    y="0"
    width="405"
    height="75"
    fill="none"
    stroke="rgb(208,208,208)"
  />
  <polygon
    points="15 13,36 13,50 30,50 60,15 60"
    fill="rgb(156,193,233)"
    stroke="rgb(0,105,255)"
    stroke-width="2"
  />
  <polygon points="36 13,36 30,50 30" fill="rgb(0,105,255)" />
  <text
    x="32"
    y="50"
    font-size="10"
    text-anchor="middle"
    fill="rgb(0,105,255)"
  >
   ${extension}
  </text>
  <text x="63" y="30" font-size="16">${file.name || "未命名文件"}</text>
  <text x="63" y="52" font-size="14">${size.toFixed(1)}K</text>
`;
  const dom = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  dom.setAttribute("width", "409");
  dom.setAttribute("height", "77");
  dom.innerHTML = templte;
  const svg = new XMLSerializer().serializeToString(dom);
  const blob = new Blob([svg], {
    type: "image/svg+xml;charset=utf-8",
  });
  const imageUrl = URL.createObjectURL(blob);
  const img = new Image();
  img.src = imageUrl;
  return img;
}

/**
 * 处理粘贴文件
 * @param {File} file 文件
 */
function handleFile(file) {
  insertNode(createFileDom(file));
}

/**
 * 判断文件类型，区分渲染方式
 * @param {File} file 文件
 * @returns
 */
function fileTypeCheck(file) {
  if (file.type.indexOf("image") === 0) {
    // 粘贴的文件为图片
    handleImage(file);
    return;
  }
  // 粘贴内容是普通的文件
  handleFile(file);
}

// 添加paste事件
editor.addEventListener("paste", (e) => {
  const files = e.clipboardData.files;
  const filesLen = files.length;
  // 粘贴内用是否存在文件
  if (filesLen > 0) {
    // 禁止默认事件
    e.preventDefault();
    for (let i = 0; i < filesLen; i++) {
      const file = files[i];
      fileTypeCheck(file);
    }
  }
});

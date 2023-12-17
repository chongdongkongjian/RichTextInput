# 实现一个微信 PC 端富文本输入框

微信 PC 端输入框支持图片、文件、文字、Emoji 四种消息类型，本篇文章就这四种类型的消息输入进行实现。我们选用 HTML5 新增标签属性`contenteditable`来实现。

![image-20231126224805823](C:\Users\15506\Desktop\文章\assets\image-20231126224805823.png)

## `contenteditable`属性

`contenteditable`是一个全局属性，表示当前元素可编辑。

该属性拥有一下三个属性值：

- true 或空字符串: 表示元素可编辑
- false: 表示元素不可编辑
- plaintext-only: 表示只有原始文本可编辑，禁用富文本编辑

给 div 元素添加`contenteditable`, 将元素变为可编辑的状态

```html
<div contenteditable></div>
```

![image-20231126233101180](C:\Users\15506\Desktop\文章\assets\image-20231126233101180.png)

## 文字输入

当鼠标聚焦在输入框内时，会有`outline`展示，所以要去掉该样式

```html
<!-- index.html -->
<div contenteditable class="editor"></div>
```

```css
.editor:focus {
  outline: none;
}
```

![image-20231126233743470](C:\Users\15506\Desktop\文章\assets\image-20231126233743470.png)

此时文本就可以正常输入了

## 图片输入

图片输入分为两部分

- 截图粘贴
- 图片文件复制粘贴

有的浏览器是直接支持截图图片的粘贴的，不过图片文件的复制粘贴就不是我们想要的效果(会把图片粘贴成一个文件的图标俺不是展示图片)。

我们这里要自己做一个图片的粘贴展示，以兼容所有的浏览器。

这里我们使用浏览器提供的粘贴事件`paste`来实现

`paste`事件函数中存在`e.clipboardData.files` 属性，该属性是一个数组，当该数组大于 0 时，就证明用户粘贴的是文件；通过判断 `file` 的 `type` 属性是否为`image/...` 来确定粘贴的内容是否为图片。

```js
const editor = document.querySelector(".editor");

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
    editor.appendChild(img);
  };

  reader.readAsDataURL(imageFile);
}

// 添加paste事件
editor.addEventListener("paste", (e) => {
  const files = e.clipboardData.files;
  const filesLen = files.length;
  console.log("files", files);
  // 粘贴内用是否存在文件
  if (filesLen > 0) {
    //禁止默认事件
    e.preventDefault();
    for (let i = 0; i < filesLen; i++) {
      const file = files[i];
      if (file.type.indexOf("image") === 0) {
        // 粘贴的文件为图片
        handleImage(file);
        continue;
      }
      // 粘贴内容是普通文件
    }
  }
});
```

![image-20231127005155571](C:\Users\15506\Desktop\文章\assets\image-20231127005155571.png)

现在就可以粘贴图片了，无论是截图的图片还是复制的文件图片都可以粘贴到文本框内了。

现在存在的问题就是，图片尺寸太大，会按原尺寸展示图片。微信输入框展示的尺寸为最大宽高`150x150`

```css
.image {
  max-width: 150px;
  max-height: 150px;
}
```

现在图片的粘贴展示部分就是解释正常的了

![image-20231127005730501](C:\Users\15506\Desktop\文章\assets\image-20231127005730501.png)

> 细心的同学注意到了，粘贴图片后光标不会向后移动，这是因为我们禁用了粘贴的默认事件，这里需要我们手动处理光标；因为我们使用了`appendChild` 将图片插入到了输入框的最后面，就会出现无论光标在哪里，粘贴的图片都是出现在输入框的最后面，我们希望的是在光标所在的地方粘贴内容，接下来我们处理一下光标。

## 光标处理

处理光标主要以来两个`WebAPI` , `Selection`和 `Range`

- Selection：`Selection` 对象表示用户选择的文本范围或插入符号的当前位置。它代表页面中的文本选区，可能横跨多个元素。通过`window.getSelection()` 获取 `Selection` 对象。 [具体可查阅 MDN-Selection](https://developer.mozilla.org/zh-CN/docs/Web/API/Selection)

- Range：`Range` 接口表示一个包含节点与文本节点的一部分的文档片段。可以使用 `Document.createRange` 方法创建 Range。也可以用 `Selection`对象的 `getRangeAt()`方法或者 `Document`对象的`caretRangeFromPoint()` 方法获取 Range 对象。[具体可查阅 MDN-Range](https://developer.mozilla.org/zh-CN/docs/Web/API/range)

我们使用`window.getSelection`获取当前位置，通过 `getRangeAt()`获取当前选中的范围，将选中的内容删除，再把我们自己的内容插入到当前的 `Range` 中，就实现了文件的输入。在这时插入的文件是选中状态的，所以要将选择范围折叠到结束位置，即在粘贴文本的后面显示光标。

```js
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
```

```diff
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
-   editor.appendChild(img);
+   insertNode(img);
  };
  reader.readAsDataURL(imageFile);
}
```

> 到这里粘贴到光标位置就正常了

![演示1](C:\Users\15506\Desktop\文章\assets\演示1.gif)

## 文件输入

文件输入分为两部分粘贴文件和选择文件

- 粘贴文件

![image-20231126234519901](C:\Users\15506\Desktop\文章\assets\image-20231126234519901.png)

- 选择文件

![image-20231128231736630](C:\Users\15506\Desktop\文章\assets\image-20231128231736630.png)

### 粘贴文件

微信是以卡片的方式展示的文件，所以我们先要准备一个类似的 dom 结构。

```js
/**
 * 返回文件卡片的DOM
 * @param {File} file 文件
 * @returns 返回dom结构
 */
function createFileDom(file) {
  const size = file.size / 1024;
  const templte = `
          <div class="file-container">
            <img src="./assets/PDF.png" class="image" />
            <div class="title">
              <span>${file.name || "未命名文件"}</span>
              <span>${size.toFixed(1)}K</span>
            </div>
          </div>`;
  const dom = document.createElement("span");
  dom.style = "display:flex;";
  dom.innerHTML = templte;
  return dom;
}
```

```css
.file-container {
  height: 75px;
  width: 405px;
  box-sizing: border-box;
  border: 1px solid rgb(208, 208, 208);
  padding: 13px;
  display: flex;
  justify-content: start;
  gap: 13px;
  background-color: #ffffff;
}
.file-container .image {
  height: 100%;
  object-fit: scale-down;
}
.file-container .title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
```

按照微信样式卡片准备 DOM 的生成函数，如上。

将生成后的 DOM 加入到光标位置

```js
/**
 * 处理粘贴文件
 * @param {File} file 文件
 */
function handleFile(file) {
  insertNode(createFileDom(file));
}
```

在页面上就可以看到效果啦

![image-20231129220051724](C:\Users\15506\Desktop\文章\assets\image-20231129220051724.png)

> 可以看到以上的卡片还是存在问题的，
>
> - 光标位置不在卡片的最后面
> - `Backspace` 不会将整个卡片都删除掉

### 卡片的删除

因为我们的卡片是 DOM，其父元素也就是输入框，开启了`contenteditable` ，因此它的该属性也继承了父元素的值，所以本身也是可以编辑的。分析到这里，就会涌现出一个方案——将卡片最外层 `div` 的`contenteditable` 属性值设为 `false` 。

![th](C:\Users\15506\Desktop\文章\assets\th.jpg)

但是，设置了 `contenteditable="false"` 后就变成了不可编辑元素，光标在他周围就不显示了 🥹🥹🥹

再接着考虑，思绪一下又回到了图片身上，我们能不能做一个一样的图片呢？答案是肯定的。

说到做图片我们又会有两种方案：

- svg
- canvas

这里就考虑使用 SVG 制作卡片。

SVG 在这里就不多介绍了，直接开始

```html
<svg width="409" height="77" nsxml="http://www.w3.org/2000/svg">
  <!-- 矩形边框 -->
  <rect
    x="2"
    y="0"
    width="405"
    height="75"
    fill="none"
    stroke="rgb(208,208,208)"
  />
  <!-- 右侧文件图标 -->
  <polygon
    points="15 13,36 13,50 30,50 60,15 60"
    fill="rgb(156,193,233)"
    stroke="rgb(0,105,255)"
    stroke-width="2"
  />
  <!-- 图标折叠三角部分 -->
  <polygon points="36 13,36 30,50 30" fill="rgb(0,105,255)" />
  <!-- 文件类型 -->
  <text x="32" y="50" font-size="10" text-anchor="middle" fill="rgb(0,105,255)">
    xmind
  </text>
  <!-- 文件名称 -->
  <text x="63" y="30" font-size="16">JavaScript.xmind</text>
  <!-- 文件大小 -->
  <text x="63" y="52" font-size="14">206.6K</text>
</svg>
```

然后就得到了一个卡片

![image-20231209191730273](C:\Users\15506\Desktop\文章\assets\image-20231209191730273.png)

现在我们只要将该卡片使用 JS 封装，在上传文件的时候调用生成图片就好了。

封装如下：

```js
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
```

到这里我们的文件粘贴就完成了，来展示

![演示](C:\Users\15506\Desktop\文章\assets\演示.gif)

### 上传文件

上传文件又包含两部分：图片和普通文件

我们需要在这里做一个判断，如果是图片需要将其内容渲染出来，文件用卡片显示。

```html
<div class="controls">
  <img src="./assets/emoji.png" alt="表情" title="表情" />
  <img src="./assets/file.png" alt="发送文件" title="发送文件" class="file" />
</div>
```

```js
const fileDom = document.querySelector(".file");

fileDom.addEventListener("click", () => {
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
```

以上代码，在输入框上方添加了一个文件的`icon` , 给这个`icon` 添加点击事件，选择文件并展示。

![演示6](C:\Users\15506\Desktop\文章\assets\演示6.gif)

到这里文件上传就做好了，但是还是存在问题的。

输入框的光标，在鼠标点击页面其他地方的时候会从输入框移出，如果在这时选择文件不会添加到输入框中。

所以，我们在点击文件上传的时候需要叫光标聚焦到输入框。

```diff
const fileDom = document.querySelector(".file");

fileDom.addEventListener("click", () => {
+  // 光标聚焦到输入框
+  editor.focus();
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
```

到这里文件上传就完美了。

## 总结

以上的源码已经上传到了 Github， 想要源码的小伙伴自己去拉。代码读取文件那部分可以使用`Promise` 进行优化。最后，欢迎大佬批评指正。

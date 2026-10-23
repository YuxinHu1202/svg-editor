# SVG Editor CLI

基于 TypeScript、Command 和 Composite 模式实现的命令行 SVG 编辑器。

## 使用

```bash
npm install
npm run cli
```

启动后输入 `help` 查看命令。示例：

```text
svg> init 400 200
svg> create rect r1 30 70 120 60 #4a90d9
svg> create text title 50 105 "Hello SVG"
svg> tree
svg> save demo.svg
```

## 验证

```bash
npm run typecheck
npm test
```

完整架构、过程记录和质量说明见 [`doc/README.md`](doc/README.md)。

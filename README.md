# skin-effect-lab

《从磁扩散方程到交流电阻：集肤效应、涡流与邻近效应的一维可视化》

在线访问地址：

https://chenby-thu.github.io/skin-effect-lab/

## 项目简介

本项目是一个《电磁场》课程可视化微作品。它用 Vite + React + TypeScript 实现一维有限厚导体板模型，展示交流电流在导体内的集肤效应、外加交变磁场诱发的涡流，以及外磁场扰动下的一维邻近效应近似。

页面不使用后端和服务器 API，所有计算均在浏览器本地完成。

## 本地运行方式

```bash
npm install
npm run dev
npm run build
npm run preview
```

## GitHub Pages 部署方式

本项目已配置 `vite.config.ts`：

```ts
base: "/skin-effect-lab/"
```

并提供 `.github/workflows/deploy.yml`。推送到 `main` 分支后，GitHub Actions 会自动执行：

```bash
npm ci
npm run build
```

随后上传 `dist` 并部署到 GitHub Pages。

在 GitHub 仓库 `Settings -> Pages` 中，将 `Build and deployment` 的 `Source` 选择为 `GitHub Actions`。部署成功后的访问地址为：

https://chenby-thu.github.io/skin-effect-lab/

## 物理模型

研究一个有限厚导体板：

- 厚度方向：`x ∈ [-a, a]`
- 导体宽度：`b`
- 电流沿 `z` 方向
- 磁场为 `Hy(x)`
- 电流密度为 `Jz(x)`
- 材料线性、均匀、各向同性
- 磁准静态近似，忽略位移电流
- 正弦稳态相量使用 RMS 值

从

```text
∇×H = J
∇×E = -∂B/∂t
J = σE
B = μH
```

可得磁扩散方程：

```text
∇²H = μσ ∂H/∂t
```

在一维正弦稳态下：

```text
d²Hy/dx² - Γ²Hy = 0
```

## 主要公式

```text
ω = 2πf
μ = μ0 μr
δ = sqrt(2/(ωμσ))
Γ = sqrt(jωμσ) = (1+j)/δ
Jz = dHy/dx
q''' = |Jrms|²/σ
Pac' = b/σ ∫ |Jrms|² dx
Rac' = Pac'/Irms²
Rdc' = 1/(σ·2ab)
```

统一边界条件：

```text
Hy(-a) = HL
Hy(a) = HR
```

通解：

```text
Hy(x) =
HL sinh(Γ(a-x))/sinh(2Γa)
+ HR sinh(Γ(x+a))/sinh(2Γa)
```

电流密度：

```text
Jz(x) =
[-Γ HL cosh(Γ(a-x)) + Γ HR cosh(Γ(x+a))]/sinh(2Γa)
```

## 操作说明

左侧参数面板可调：

- 材料：铜、铝、简化钢、自定义
- 电导率 `σ`
- 相对磁导率 `μr`
- 频率 `f`
- 导体半厚度 `a`
- 导体宽度 `b`
- 注入电流 `Irms`
- 外加磁场 `H0,rms`
- 模式 A/B/C
- 采样点数 `N`
- 动画相位 `t/T`
- 是否显示归一化结果
- 是否显示理论极限提示

三种模式：

- 模式 A：端子注入交流电流，`HL=-I/(2b), HR=I/(2b)`
- 模式 B：外加交变磁场涡流，`HL=H0, HR=H0`
- 模式 C：注入电流 + 外加磁场，`HL=H0-I/(2b), HR=H0+I/(2b)`

## 验证方法

页面底部“模型校验”区域显示：

- 模式 A：`abs(Inet - I)/max(I,tiny) < 1e-3`
- 模式 B：`abs(Inet)` 远小于典型表面电流尺度
- 低频极限：当 `a/δ < 0.1` 时，`Rac/Rdc` 接近 1
- 损耗非负：`Pac >= 0`
- 对称性：模式 A 在 `H0=0` 时 `|J(x)|` 关于 `x=0` 对称

## 已知限制

- 一维平板近似
- 忽略边缘效应
- 忽略位移电流
- 假设 `μ`、`σ` 常数
- 简化钢模型仅用于定性演示
- 铁磁材料真实 `μ` 可能非线性且频率相关
- 未考虑真实多导体邻近效应的二维或三维耦合

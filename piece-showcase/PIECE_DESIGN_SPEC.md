# Phantasm Chess — 棋子设计与特效技术规格文档

**版本：** v1.0  
**日期：** 2026-05-11  
**用途：** 交付模型优化负责人，作为正式模型制作与特效实现的技术参考基准

---

## 一、项目背景与目标

Phantasm Chess 是一款赛博朋克风格的 3D 国际象棋游戏，运行于 Web 端（Three.js / React Three Fiber）。当前阶段已完成以下原型验证：

- **棋子人形化设计**（基于 Box/Cylinder geometry 搭建，验证各棋子的体型比例与角色定位）
- **逐棋子攻击动画**（GSAP timeline 驱动，验证动作节奏与体感反馈）
- **逐棋子攻击特效**（粒子爆炸 / 冲击波环 / 光柱，验证视觉风格与技术可行性）

本文档描述原型的完整设计意图与参数细节，供模型优化阶段参考，最终目标是以正式 3D 模型（GLB/GLTF）替代当前几何体拼接方案，并保持所有动画与特效接口不变。

---

## 二、技术栈

| 层级 | 技术 |
|------|------|
| 渲染引擎 | Three.js `^0.184` |
| React 渲染层 | `@react-three/fiber ^9.6` |
| 辅助组件库 | `@react-three/drei ^10.7` |
| 后期处理 | `@react-three/postprocessing ^3.0` |
| 补间动画 | `GSAP ^3.15`（直接操作 Three.js Group 属性） |
| 溶解特效 | 自定义 GLSL Shader（`DissolveMaterial`） |
| 棋局逻辑 | `chess.js ^1.4` |
| 构建工具 | Vite + TypeScript |

---

## 三、视觉风格定义

### 3.1 整体氛围

- **白方**：赛博青蓝（Cyber Cyan），冷光、科技感
- **黑方**：深红暗紫（Crimson + Obsidian），暗能量、压迫感
- 场景背景：`#020912`（近纯黑深蓝）
- 全局雾效：从距离 20 至 40 单位渐入背景色

### 3.2 配色系统（shader uniform）

每个棋子的材质通过 `DissolveMaterial` 渲染，支持运行时溶解动画。

| 属性 | 白方值 | 黑方值 | 说明 |
|------|--------|--------|------|
| `primary`（主色） | `#00d2ff` | `#ff0055` | 护甲、肩甲、关键部位 |
| `secondary`（次色） | `#c8d8e8` | `#2a1a2e` | 躯干、四肢本体 |
| `accent`（点缀色） | `#ffcc00` | `#8e2de2` | 武器、装饰、王冠 |
| `dark`（暗色） | `#0a2540` | `#1a0510` | 靴子底部、披风背面 |
| `glow`（发光色） | `#00f2ff` | `#ff0055` | 宝球、Shader 边缘辉光 |

---

## 四、棋子人形比例规范

### 4.1 通用人形骨架（坐标系：Y 轴向上，单位：Three.js unit）

```
Y = 1.55  顶端（头顶 / 装饰物最高点）
Y = 1.27  头盔/王冠基部
Y = 1.11  头部中心
Y = 0.95  颈部
Y = 0.85  肩膀
Y = 0.71  躯干中心
Y = 0.67  上臂中心
Y = 0.49  髋部
Y = 0.47  前臂中心
Y = 0.34  手部
Y = 0.29  大腿中心
Y = 0.06  脚掌
Y = 0.00  地面基准
```

手臂横向偏移：左臂 `x = -0.27`，右臂 `x = +0.27`  
双腿横向偏移：左腿 `x = -0.09`，右腿 `x = +0.09`

### 4.2 各棋子角色定位与设计描述

---

#### PAWN — 步兵（Infantry Soldier）

**角色定位：** 轻装前线士兵，机动性强，持矛持盾。

**体型特征：**
- 标准人形比例，无特殊夸张
- 全脸遮蔽头盔（盔檐 + 前方竖直面窗）
- 前胸装甲板（主色）
- 腰带扣（点缀色）

**装备：**
- 左手：竖向矩形盾牌（位于 `x=-0.36, z=+0.10`，点缀色，尺寸约 `0.04×0.34×0.28`）
- 右手：长矛（竖直细杆 + 矛尖，点缀色，矛杆高约 0.65 unit）

**制作优先级注意：** 正式模型中盾牌和矛应为独立子骨骼，以便攻击时分别驱动。

---

#### KING — 国王（Armored Monarch）

**角色定位：** 全甲重装君主，威严高大，持权杖。

**体型特征：**
- 躯干略宽（`w=0.42`，其他棋子为 0.38）
- 背部宽幅披风（`0.54×0.70`，暗色）
- 前胸大型甲板（主色，`0.30×0.30`）
- 腰带（点缀色）
- 双肩大型护肩（横条形，主色）

**头部装饰：**
- 王冠底环（圆柱形，点缀色，半径约 0.16）
- 三枚冠刺（两侧 + 正中，矩形柱，点缀色）
- 正中十字标志（竖杆 + 横杆，点缀色）

**装备：**
- 右手：权杖（细杆 + 顶端发光宝珠，glow 色）

---

#### QUEEN — 王后（Sovereign）

**角色定位：** 最强棋子，优雅与能量并存，持能量宝球。

**体型特征：**
- 下半身为流线形长裙（非双腿），裙摆从腰部向下展开（底部半径约 0.44）
- 腰部紧收（腰径约 0.18），形成明显曲线
- 胸前垂直装饰带（点缀色）

**头部装饰：**
- 七尖王冠（7 个等角冠刺，环绕排列，点缀色）
- 冠基为短圆柱

**装备：**
- 左手：悬浮能量宝球（`sphereGeometry`，发光色，半径 0.075）
- 右手：空（掌心朝前，蓄能姿态）

---

#### BISHOP — 主教（Cleric / Robe Figure）

**角色定位：** 神职者，法术系角色，持圣杖。

**体型特征：**
- 下半身为法袍（圆柱锥体，非双腿），裙摆略外扩
- 腰部有收束腰带
- 法衣前面有垂直十字图案（竖杆 + 横杆，点缀色）
- 袖子略宽于普通手臂

**头部装饰：**
- 主教冠（Mitre）：冠基圆柱 + 向上收窄的高锥体，配纵向装饰带（点缀色）

**装备：**
- 右手：圣杖（细长杆，顶端呈"L形"弯钩，点缀色）

---

#### ROOK — 城堡巨像（Fortress Golem）

**角色定位：** 重甲巨人，坚不可摧，以身为城。

**体型特征：**
- 全身比例大幅夸张：躯干宽 0.52，双腿宽 0.20，双臂宽 0.18
- 肩膀顶部有宽型垛口装甲（横条，主色）
- 前胸有大型装甲纹路（主色面板）
- 拳头明显更大（`0.20×0.16×0.20`，点缀色）

**头部：**
- 宽型方形头盔（`0.32×0.28×0.28`）
- 头顶三条城垛（间距均匀，主色）

**装备：** 无持握武器，以双拳为武器。

---

#### KNIGHT — 骑士（Mounted Cavalry）

**角色定位：** 唯一非纯人形棋子，骑士骑于战马之上，持长矛冲锋。

**马匹部分：**
- 马身（长方体，次色，约 `0.30×0.36×0.70`）
- 四条马腿（各两前两后，次色，各 `0.12×0.26×0.12`，下方有蹄子暗色块）
- 马颈（斜向前倾约 0.55 rad，次色）
- 马头（方形，次色）
- 两只马耳（小矩形柱，主色）
- 马嘴/鼻（前突方块，次色）

**骑士（rider）部分：**
- 鞍（扁平横块，点缀色，骑于马背中央）
- 骑士躯干（主色，位于马背以上）
- 双臂（次色）
- 骑士头部 + 头盔（主色盔檐 + 点缀色面窗）

**装备：**
- 右手：长矛（约 0.72 unit 斜向前伸，角度约 0.52 rad，顶端矛尖）

---

## 五、攻击动画规范

### 5.1 系统架构

- 动画由 **GSAP timeline** 驱动，直接操作 Three.js `Group` 的 `position` 与 `rotation` 属性
- 每次攻击触发前执行 `gsap.killTweensOf()` 清除旧动画，防止叠加
- 动画结束时强制重置 position 和 rotation 到初始值（`{x:0, y:0, z:0}`）
- 整体动画作用于**棋子根 Group**，正式实现时可扩展至骨骼动画（分别控制手臂、头部等子骨骼）

### 5.2 各棋子动画时序

---

#### PAWN — 刺矛

| 阶段 | 属性变化 | 时长 | 缓动 |
|------|---------|------|------|
| ① 蓄力后仰 | `rotation.x → -0.28 rad` | 0.11s | `power2.in` |
| ② 向前刺出（同步前移） | `rotation.x → +0.48 rad` + `position.z → +0.60` | 0.10s | `power4.in` |
| ③ **[特效触发点]** | — | — | — |
| ④ 后坐回位 | `position.z → 0` + `rotation.x → 0` | 0.30 / 0.28s | `power2.out` |

**视觉意图：** 快速刺击，矛尖到位后立即弹回，有明显后坐感。

---

#### KNIGHT — 骑马冲锋

| 阶段 | 属性变化 | 时长 | 缓动 |
|------|---------|------|------|
| ① 扬蹄蓄力 | `rotation.x → -0.22 rad` | 0.14s | `power2.out` |
| ② 全速冲锋 + 前倾 | `position.z → +1.10` + `rotation.x → +0.18` | 0.19s | `power4.in` |
| ③ **[特效触发点]** | — | — | — |
| ④ 减速回位 | `position.z → 0` + `rotation.x → 0` | 0.42 / 0.28s | `power2.out` |

**视觉意图：** 冲程最长（1.1 unit），冲击感最强，代表马匹的惯性。

---

#### BISHOP — 法杖光束

| 阶段 | 属性变化 | 时长 | 缓动 |
|------|---------|------|------|
| ① 法杖侧举蓄能 | `rotation.z → -0.22 rad` | 0.20s | `power1.in` |
| ② 能量释放 | `rotation.z → +0.08 rad` | 0.09s | `power4.in` |
| ③ **[特效触发点]** | — | — | — |
| ④ 回正 | `rotation.z → 0` | 0.35s | `power2.out` |

**视觉意图：** 以侧倾动作暗示法杖举起蓄能，释放瞬间有明显弹振感。

---

#### ROOK — 重拳砸地

| 阶段 | 属性变化 | 时长 | 缓动 |
|------|---------|------|------|
| ① 跳起 | `position.y → +0.45` | 0.20s | `power2.out` |
| ② 砸落 | `position.y → 0` | 0.11s | `power4.in` |
| ③ **[特效触发点]** | — | — | — |
| ④ 震颤回正 | `rotation.x` 短暂弹跳 → 0 | 0.30s | `elastic.out(1.2, 0.4)` |

**视觉意图：** 跳起砸落是车棋"势大力沉"的体现，落地后弹性震颤增加质感。

---

#### QUEEN — 能量爆发

| 阶段 | 属性变化 | 时长 | 缓动 |
|------|---------|------|------|
| ① 旋转蓄能 | `rotation.y → +0.32 rad` | 0.16s | `power1.in` |
| ② 爆发释放 | `rotation.y → -0.12` + `rotation.z → +0.18` | 0.11s | `power4.in` |
| ③ **[特效触发点]** | — | — | — |
| ④ 归位 | `rotation.y / z → 0` | 0.38s | `power2.out` |

**视觉意图：** 旋转蓄力 + 多轴向释放，表现最强棋子的全方位能量爆发。

---

#### KING — 权杖横扫

| 阶段 | 属性变化 | 时长 | 缓动 |
|------|---------|------|------|
| ① 抬杖蓄力 | `rotation.z → +0.28 rad` | 0.20s | `power1.in` |
| ② 大幅横扫 | `rotation.z → -0.38` + `rotation.y → +0.22` | 0.16s | `power3.in` |
| ③ **[特效触发点]** | — | — | — |
| ④ 稳定归位 | `rotation.z / y → 0` | 0.38s | `power2.out` |

**视觉意图：** 双轴旋转模拟权杖弧形横扫，角度最大（z轴 0.66 rad 总振幅），代表君主的威严一击。

---

## 六、攻击特效规范

### 6.1 特效组件系统

特效渲染于攻击目标位置（当前原型中为棋子正前方 Z+2.0 处），各组件独立运行生命周期，父容器在 1.15 秒后统一回收。

#### 组件一：ExpandingRing（扩散冲击波环）

| 参数 | 说明 |
|------|------|
| `color` | 环颜色 |
| `y` | 垂直偏移（地面效果设为 `-1.4`，空中效果设为 `0`） |
| `delay` | 延迟启动秒数（实现多层错开效果） |
| `maxR` | 最大扩散半径（单位：Three.js unit） |
| `speed` | 扩散速度（unit/s） |
| `thick` | 环厚度比（ringGeometry innerRadius 偏移） |

几何体：`RingGeometry`（平铺于 XZ 平面），从 `scale=0.001` 线性扩散至 `maxR`，同步透明度从 1 降至 0。

#### 组件二：FlashSphere（冲击闪光球）

| 参数 | 说明 |
|------|------|
| `color` | 球颜色 |
| `r` | 初始半径 |
| `dur` | 持续时间 |

行为：scale 从 1 扩大至 3.5x，opacity 同步从 1 降至 0。用于模拟爆炸中心白光。

#### 组件三：LightPillar（圣光柱）

| 参数 | 说明 |
|------|------|
| `color` | 柱颜色 |
| `h` | 柱高（默认 4.5 unit） |
| `dur` | 完整生命周期时长 |

行为：opacity 以 `sin(progress × π)` 函数变化（先出现后消失），XZ 方向 scale 同步脉动（呼吸感）。几何体：`CylinderGeometry`，底部宽、顶部窄（0.35 → 0.12）。

#### 组件四：ParticleBurst（粒子爆炸）

| 参数 | 说明 |
|------|------|
| `color` | 粒子颜色 |
| `count` | 粒子数量 |
| `speed` | 初始射出速度 |
| `mode` | 扩散方向：`sphere`（球形）/ `forward`（前向锥）/ `radial`（水平放射）/ `up`（向上锥） |
| `dur` | 淡出时长 |
| `size` | 粒子点大小 |
| `grav` | 重力系数（随时间加速下落） |

实现：`THREE.BufferGeometry` + `THREE.Points`，每帧在 `useFrame` 中更新粒子位置，使用 `DynamicDrawUsage` 优化 GPU 上传。

---

### 6.2 各棋子特效配置

#### PAWN — 前向矛击

| 层次 | 类型 | 关键参数 |
|------|------|---------|
| 1 | FlashSphere | `glow色, r=0.22, dur=0.22` |
| 2 | ParticleBurst | `acc色, 38粒, forward, speed=3.2, grav=4.5` |
| 3 | ParticleBurst | `白色, 14粒, forward, speed=2.0, grav=3.0` |
| 4 | FlashSphere | `acc色, r=0.14, dur=0.18` |

**设计意图：** 矛头刺入产生前向锥形火花，白色为金属碰撞迸射，点缀色为能量残留。

---

#### KNIGHT — 冲锋重击

| 层次 | 类型 | 关键参数 |
|------|------|---------|
| 1 | FlashSphere | `glow色, r=0.22` |
| 2 | ParticleBurst | `glow色, 48粒, radial, speed=3.8, grav=5.5` |
| 3 | ExpandingRing | `glow色, y=-1.4, maxR=2.8, speed=4.2, delay=0` |
| 4 | ExpandingRing | `acc色, y=-1.4, maxR=1.8, speed=3.2, delay=0.1` |
| 5 | FlashSphere | `acc色, r=0.32` |

**设计意图：** 马匹冲击地面产生双层地震波环（主从错开），碎石尘土径向喷发，冲击感最强。

---

#### BISHOP — 圣光降临

| 层次 | 类型 | 关键参数 |
|------|------|---------|
| 1 | FlashSphere | `glow色, r=0.22` |
| 2 | LightPillar | `acc色, h=4.5, dur=0.65` |
| 3 | ParticleBurst | `acc色, 30粒, up, speed=2.0, grav=1.5` |
| 4 | ExpandingRing | `acc色, maxR=1.6, speed=2.8` |
| 5 | FlashSphere | `白色, r=0.28` |

**设计意图：** 神圣光柱从天而降（sin曲线淡出），向上喷射的粒子模拟圣光散射，环形光波从柱底蔓延。

---

#### ROOK — 地震砸击

| 层次 | 类型 | 关键参数 |
|------|------|---------|
| 1 | FlashSphere | `glow色, r=0.22` |
| 2 | ExpandingRing | `glow色, y=-1.4, maxR=3.3, speed=4.8, thick=0.07, delay=0` |
| 3 | ExpandingRing | `acc色, y=-1.4, maxR=2.2, speed=3.6, thick=0.05, delay=0.1` |
| 4 | ExpandingRing | `glow色, y=-1.4, maxR=1.2, speed=2.6, thick=0.04, delay=0.22` |
| 5 | ParticleBurst | `acc色, 34粒, radial, speed=2.8, grav=6.5` |
| 6 | FlashSphere | `白色, r=0.42` |

**设计意图：** 三层错时地震波（外大内小，间隔 0.1s）模拟真实冲击波传播，最大闪光球强调重量感。

---

#### QUEEN — 能量爆发

| 层次 | 类型 | 关键参数 |
|------|------|---------|
| 1 | FlashSphere | `glow色, r=0.22` |
| 2 | ExpandingRing | `glow色, maxR=3.0, speed=3.5, delay=0` |
| 3 | ExpandingRing | `acc色, maxR=2.1, speed=2.8, delay=0.08` |
| 4 | ExpandingRing | `glow色, maxR=1.3, speed=2.2, delay=0.16` |
| 5 | ParticleBurst | `glow色, 55粒, sphere, speed=3.2, grav=0.8` |
| 6 | FlashSphere | `glow色, r=0.50` |

**设计意图：** 特效规模最大，三重等差间隔同心环展示最强棋子，球形粒子爆炸体现全向能量释放，重力系数最低（粒子飘散而非坠落）。

---

#### KING — 权杖金色横扫

| 层次 | 类型 | 关键参数 |
|------|------|---------|
| 1 | FlashSphere | `glow色, r=0.22` |
| 2 | ExpandingRing | `acc色, maxR=2.6, speed=3.2, thick=0.055, delay=0` |
| 3 | ExpandingRing | `glow色, maxR=1.7, speed=2.6, thick=0.04, delay=0.12` |
| 4 | ParticleBurst | `acc色, 44粒, radial, speed=2.8, grav=3.5` |
| 5 | FlashSphere | `acc色, r=0.55` |

**设计意图：** 全程以点缀色（金色）为主，双环搭配大闪光球体现君主一击的权威感，粒子水平扩散模拟权杖扫过的能量残影。

---

## 七、模型优化建议

### 7.1 推荐替代方案

当前原型使用 box/cylinder 几何体拼接（共约 15–30 个 mesh/棋子），正式实现推荐以下方案：

**方案 A（推荐）：压缩 GLB 模型 + 骨骼蒙皮动画**

- 为每种棋子制作独立 `.glb` 文件，使用 Draco 压缩
- 目标面数：每棋子 800–2000 tri（保持低面数风格与游戏氛围匹配）
- 骨骼绑定：至少包含 `root / torso / head / arm_L / arm_R / weapon` 骨骼
- 动画嵌入 GLB 内或通过 GSAP 驱动骨骼节点 Object3D
- 加载方式：`@react-three/drei` 的 `useGLTF` + Draco decoder

**方案 B：LatheGeometry 程序化生成（适用于旋转对称棋子）**

- 适用于 Pawn / Bishop / Rook / Queen / King 的底座和主体
- Knight 的马身和骑士体形不规则，仍需 GLB 或手动几何体
- 优点：零外部资源，运行时生成，内存占用极低

### 7.2 材质接口保持不变

无论选用哪种模型方案，以下接口必须保持兼容：

```typescript
// 棋子组件 Props 接口（不变）
interface PieceModelProps {
  type: string;        // 'k' | 'q' | 'r' | 'b' | 'n' | 'p'
  color: 'w' | 'b';
  dissolve?: number;   // 0.0–1.0，驱动 DissolveMaterial
  attackTrigger?: number; // 每次递增触发一次攻击动画
  onImpact?: () => void;  // 攻击动画到达冲击帧时回调
}
```

`DissolveMaterial` 的 uniform 接口（`uTime`, `uDissolve`, `uBaseColor`, `uColor`）在替换为 GLB 模型后，需通过 `mesh.traverse` 将 GLTF 原始材质替换为 `DissolveMaterial` 实例。

### 7.3 性能目标

| 指标 | 目标值 |
|------|--------|
| 单棋子 GLB 体积（压缩后） | ≤ 80 KB |
| 32 个棋子同屏总 drawcall | ≤ 80（建议合并 instancing） |
| 特效粒子数上限（单次攻击） | ≤ 60 粒 |
| 帧率目标（中端设备） | 60 FPS |

---

## 八、文件结构参考

```
piece-showcase/
├── index.html              # 独立展示入口
├── main.tsx                # React 挂载
├── PieceShowcase.tsx       # 主展示场景（含点击逻辑、特效状态管理）
├── HumanoidPiece.tsx       # 人形棋子原型（当前几何体实现）
├── AttackEffect.tsx        # 攻击特效系统（粒子/环/光柱/闪光）
├── attackAnimations.ts     # GSAP 动画时序定义（各棋子独立 timeline）
└── PIECE_DESIGN_SPEC.md    # 本文档

src/components/3d/
├── Shaders.ts              # DissolveMaterial 自定义 GLSL Shader
├── VoxelPiece.tsx          # 旧版几何体拼接棋子（主游戏仍在使用）
├── PieceManager.tsx        # 主游戏棋子管理
└── Board.tsx               # 棋盘渲染
```

---

## 九、展示预览说明

运行展示页：`npm run dev` → 访问 `http://localhost:3000/piece-showcase/`

| 操作 | 效果 |
|------|------|
| 点击任意棋子 | 触发该棋子攻击动画 + 对应特效 |
| VOXEL / HUMANOID 切换 | 在原版几何拼接与新人形设计间切换 |
| DISSOLVE 滑块 | 0%–100% 预览溶解消失动画 |
| AUTO ROTATE 按钮 | 开启镜头自动环绕旋转 |
| 鼠标拖拽 / 滚轮 | 自由旋转视角 / 缩放 |

---

*本文档由 Phantasm Chess 开发团队生成，基于 piece-showcase 原型（commit: main branch）。*

# NODE/42 · ROS 2 Learning Lab

一个零依赖的 ROS 2 交互学习系统 Demo。课程结构参考
[Henki Robotics / Robotics & ROS 2 Essentials](https://github.com/henki-robotics/robotics_essentials_ros2)，
围绕真实机器人任务组织学习内容。

## 本地运行

直接打开 `index.html`，或在当前目录启动静态服务器：

```bash
python3 -m http.server 4173
```

然后访问 <http://127.0.0.1:4173>。

## 页面结构

```text
.
├── index.html             # 课程首页与网站新会话入口
├── assets/
│   ├── css/               # 全站基础样式与首页样式
│   └── js/                # 首页逻辑、入口守卫与页面转场
├── modules/
│   ├── 00/                # 环境部署：页面、内容逻辑与模块样式
│   ├── 01/                # ROS 2 通信基础
│   ├── 02/                # SLAM 与自主导航
│   ├── 03/                # 创建 ROS 2 功能包
│   └── 04/                # 轮式里程计
├── legacy/                # 早期独立实验页，仅作实现档案
└── tests/                 # 浏览器端课程回归测试
```

每个正式模块都在 `modules/<编号>/` 内统一管理；主学习路线始终从课程首页进入。

## 当前课程结构

- 环境部署：Docker、Gazebo 与工作空间
- ROS 2 通信：节点、Topic、消息接口与 TF
- SLAM 与导航：Slam Toolbox、Nav2 与 AMCL
- 创建功能包：Python、colcon 与 rclpy
- 轮式里程计：运动学、Odometry 与 JointState
- 路径规划：Costmap、Planner 与 Behavior Tree

### 00 · 环境部署

- 00.01 认识实验环境与系统分层
- 00.02 获取仓库、镜像与 Docker 容器
- 00.03 ROS 2 工作空间与目录挂载
- 00.04 启动 Gazebo、RViz 与 Andino
- 00.05 使用 Node、Topic、TF 完成环境验收

### 01 · ROS 2 通信基础

- 01.01 ROS 2、DDS、Package 与 Node 的整体模型
- 01.02 节点发现、节点详情与计算图
- 01.03 Topic、消息类型与发布订阅
- 01.04 Twist、TF、QoS 与底盘控制实验
- 01.05 RViz 传感器可视化实验
- 01.06 TF、时间戳与坐标变换调试
- 01.07 Service 请求、响应与客户端
- 01.08 通信、TF、控制与诊断综合验收

### 02 · SLAM 与自主导航

- 02.01 SLAM、OccupancyGrid 与闭环检测
- 02.02 启动 Andino、slam_toolbox、/map 与 map→odom
- 02.03 使用低速运动完成覆盖与闭环质量检查
- 02.04 保存 YAML/PNG 并验证宿主机持久化
- 02.05 切换到已知地图并使用 AMCL 完成初始定位
- 02.06 观察 NavigateToPose、Costmap、Planner、Controller 与 /cmd_vel
- 02.07 按传感器、定位、规划、控制和执行分层排错
- 02.08 从干净状态完成自主导航综合验收

### 03 · 创建 ROS 2 功能包

- 03.01 Workspace、Package、Node 与可执行入口的完整关系
- 03.02 使用 Turtle Nest 创建 `ros2_exercises` 与 `odometry_publisher`
- 03.03 读懂 `package.xml`、`setup.py`、resource 与 Python 目录
- 03.04 理解并修改 `rclpy` Node 的 init、spin 与 shutdown 生命周期
- 03.05 使用 `colcon build --symlink-install` 构建并 source Overlay
- 03.06 使用 `ros2 run` 启动节点并从独立终端观察 ROS Graph
- 03.07 从干净 Shell 完成功能包综合交付与常见错误恢复

### 04 · 轮式里程计

- 04.01 建立航位推算、轮式里程计、输入输出与累计误差模型
- 04.02 从 `/joint_states` 按名称稳健读取左右轮速度
- 04.03 使用轮半径 `0.033 m`、轮距 `0.137 m` 计算机体 `v / ω`
- 04.04 使用仿真时间计算 `dt` 并积分 `x / y / theta`
- 04.05 发布独立的 `/robot_odometry` Odometry 消息
- 04.06 把 `theta` 转为 Quaternion，并区分消息 frame 与 TF 广播
- 04.07 使用 matplotlib 绘制轨迹并识别轮滑、参数误差与累计漂移
- 04.08 从干净终端完成输入、运动学、积分、消息和运动行为五层验收

## 浏览器回归

项目包含 `tests/course-smoke.cjs`，覆盖首页直达、目录化路由、00–04 URL/激活状态、Module 03/04 全小节初始界面、交互解锁、多行代码转义、跨模块跳转和 390px 横向溢出。运行前需要 Playwright Chromium：

```bash
NODE_PATH=/path/to/node_modules node tests/course-smoke.cjs
```

## 学习引导

- 页面顶部持续提示“当前学什么、现在做什么、什么算成功”
- 每个实验步骤包含明确的学习目标、操作任务与验收标志
- 任务完成后生成能力清单，并提供课后独立挑战
- 搜索框支持直接跳转到命令、概念与对应实验
- 学习进度和任务复盘会自动保存在浏览器本地

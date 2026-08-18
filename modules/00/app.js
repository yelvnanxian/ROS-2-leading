const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
const toast = $('#envToast');
const storageKey = 'axisEnvironmentProgress';
const stageOrder = ['learn', 'practice', 'review'];

const tasks = {
  requirements: {
    code:'TASK 00.01', category:'SUPPORTED BASELINE', title:'先确认课程基线，再启动实验室。', time:'12', output:'兼容性检查表',
    intro:'参考仓库的直接支持环境是 Ubuntu 22.04 + x86_64。Apple Silicon 需要先通过仓库提供的 UTM 路线准备 Ubuntu，不能直接把 ARM64 Docker Desktop 当成等价环境。Gazebo/Ignition 负责计算仿真，RViz 负责显示 ROS 2 数据，两者都依赖宿主机图形显示入口。',
    contentCode:'00.01 / REQUIREMENTS', contentTitle:'你的电脑是否满足参考课程要求？', lead:'本页严格对齐 Henki Robotics 仓库：宿主机负责 Docker、X11 图形显示与源码目录；容器内固定 ROS 2 Humble、Ignition Fortress 和 Andino 依赖。先把 Gazebo（仿真）与 RViz（可视化）的分工弄清楚，后面看到窗口或命令失败时才知道该查哪一层。',
    guide:['宿主机、Docker、ROS 2、Gazebo 与 RViz 的职责和版本边界','确认 Ubuntu 架构、Docker、Git、X11 显示入口，并提前创建宿主机工作空间','得到一份可以继续部署的前置条件清单，以及安装失败后的恢复路线'],
    concepts:[['01','官方基线优先','参考课程要求 Ubuntu 22.04 与 Intel/AMD x64；其他平台必须走单独兼容路径。版本不符合时先停下来，不要硬装。'],['02','Gazebo 与 RViz 分工','Gazebo/Ignition 计算物理、机器人运动和传感器；RViz 订阅 ROS 2 Topic/TF，把结果画出来。RViz 能打开不等于仿真在运行。'],['03','宿主机目录与显示入口','宿主机的 $HOME/exercises_ws/src 保存源码；DISPLAY 与 /tmp/.X11-unix 让容器里的 Gazebo/RViz 有机会显示窗口。'],['04','安装失败先分类','先记录最后一条错误，再按平台 → 权限/服务 → 网络/镜像 → 图形显示排查。不要反复重装，也不要删除 dpkg 锁文件。']],
    steps:[
      {location:'HOST · UBUNTU TERMINAL', command:'uname -m && lsb_release -ds', action:'确认 CPU 架构与 Ubuntu 版本', expected:'直接支持基线应包含 x86_64 与 Ubuntu 22.04。Apple Silicon 请先按仓库 UTM 教程准备环境。'},
      {location:'HOST · UBUNTU TERMINAL', command:'docker --version && docker compose version', action:'确认 Docker Engine 与 Compose 插件', expected:'两条命令都应返回版本号，而不是 command not found。'},
      {location:'HOST · UBUNTU TERMINAL', command:'git --version', action:'确认 Git 已安装', expected:'应返回 git version ...。'},
      {location:'HOST · UBUNTU TERMINAL', command:'mkdir -p $HOME/exercises_ws/src && ls -ld $HOME/exercises_ws/src', action:'创建将被挂载的宿主机工作空间', expected:'应显示 $HOME/exercises_ws/src 目录，且当前用户可写。'},
      {location:'HOST · UBUNTU TERMINAL', command:'echo "DISPLAY=$DISPLAY" && test -d /tmp/.X11-unix && echo "X11 socket directory exists"', action:'确认 Gazebo / RViz 的图形显示入口', expected:'DISPLAY 不应为空，并应看到 X11 socket directory exists；这只是显示前置条件，不代表窗口已经启动。'}
    ],
    checks:[['Q1','为什么不能直接假设 macOS ARM64 可用？','参考容器面向 x86_64 Ubuntu，Apple Silicon 需要单独的 UTM 兼容路线。'],['Q2','Gazebo 与 RViz 的区别？','Gazebo/Ignition 计算物理和传感器，RViz 订阅 Topic/TF 并显示结果；RViz 有画面不代表仿真时间在走。'],['Q3','为什么先创建 exercises_ws/src？','Compose 会把这个宿主机目录挂载到容器；目录决定源码是否持久化。'],['Q4','Docker 或图形环境安装失败后怎么办？','先保留最后一条 ERROR，判断平台、权限/服务、网络/镜像还是 X11 问题；只修当前层，再重新执行本节检查。']],
    troubleTitle:'安装失败时，按这条顺序恢复',
    troubleLead:'先记录最后一条错误，再判断失败发生在哪一层。修复后重新执行本节 5 个检查命令，证据齐全才进入 00.02；不要同时重装 Docker、ROS 2 和图形驱动。',
    trouble:[['平台不兼容','看到 aarch64 / arm64：停止，不要继续构建；先打开仓库的 Apple Silicon UTM 教程。'],['Docker 未安装','看到 docker: command not found：按 Ubuntu Docker Engine 与 Compose 插件说明安装；安装后重新登录，再运行 docker --version。'],['Docker 服务未启动','看到 Cannot connect to the Docker daemon：运行 sudo systemctl enable --now docker，再用 docker info 验证。'],['权限或 apt 锁','看到 permission denied / dpkg lock：不要删除锁文件；等待系统更新结束，确认当前用户权限后再重试。'],['网络或镜像构建失败','保留最后一条 ERROR，检查 DNS、代理、磁盘空间；只重试失败命令，不要重复启动多个 Compose。'],['Gazebo / RViz 不显示','容器能运行但窗口不见：检查 DISPLAY、/tmp/.X11-unix、xhost +；窗口出现后还要到 00.04 点击 Gazebo 的 Play。'],['修复后的验收','重新执行本节 5 个检查命令并保存真实输出；任何一项不匹配，都先停在本节。']],
    after:['保存兼容性与恢复记录','记录 Ubuntu、CPU 架构、Docker、Compose、DISPLAY 检查结果；如果失败过，再记下错误层级与修复动作，作为后续排错基线。'], next:'00.02 · 获取仓库与启动容器', layers:['host']
  },
  docker: {
    code:'TASK 00.02', category:'CONTAINER PROVISIONING', title:'按仓库顺序，启动课程容器。', time:'20', output:'运行中的课程容器',
    intro:'这一节严格使用仓库中的 docker/docker-compose.yaml。Compose 命令必须在 docker 目录执行，并需要先允许容器访问宿主机 X11 显示。',
    contentCode:'00.02 / DOCKER', contentTitle:'从仓库到容器，目录不能错', lead:'仓库根目录没有 Compose 文件；进入 robotics_essentials_ros2/docker 后再启动，才能找到正确配置、Dockerfile 和挂载规则。',
    guide:['Repository、Image、Container 与 Compose 的真实关系','先完成 00.01 的兼容性检查，再 Clone → 进入 docker 目录 → 配置显示 → Compose Up → Exec','进入名为 robotics_essentials_ros2 的容器终端，并知道启动失败该回到哪一层排查'],
    concepts:[['01','Compose 依赖当前目录','docker compose 默认从当前目录寻找 compose 文件，本课程文件位于 docker/。'],['02','镜像和容器不是一回事','镜像是只读模板，容器是正在运行的实例；首次构建慢不等于失败，先看最后一条日志。'],['03','X11 权限影响 GUI','Gazebo 和 RViz 窗口依赖宿主机显示权限；课程 README 要求重启后重新配置。'],['04','失败先定位再重试','先区分目录、权限、Docker 服务、网络/镜像和 X11 问题；不要在错误目录里反复执行 Compose。']],
    steps:[
      {location:'HOST · UBUNTU TERMINAL', command:'cd ~ && git clone https://github.com/henki-robotics/robotics_essentials_ros2.git', action:'从固定位置克隆参考课程仓库', expected:'主目录出现 ~/robotics_essentials_ros2 文件夹；如果已存在，不要重复 clone，直接进入下一步。'},
      {location:'HOST · SAME TERMINAL', command:'cd ~/robotics_essentials_ros2/docker && pwd', action:'进入 Compose 文件所在目录', expected:'pwd 结尾应为 /robotics_essentials_ros2/docker。'},
      {location:'HOST · SAME TERMINAL', command:'xhost +', action:'按参考课程开放 X11 显示权限', expected:'输出 access control disabled...。完成课程后可运行 xhost - 恢复访问控制。'},
      {location:'HOST · SAME TERMINAL', command:'docker compose up -d', action:'构建并后台启动课程容器', expected:'首次会构建镜像；完成后 robotics_essentials_ros2 容器状态应为 Started/Running。'},
      {location:'HOST · NEW TERMINAL', command:'docker exec -it robotics_essentials_ros2 bash', action:'进入课程容器', expected:'提示符切换到容器用户，当前目录通常是 /home/user/exercises_ws。'}
    ],
    checks:[['Q1','为什么必须先 cd 到 docker 目录？','Compose 文件就在该目录；从错误目录执行会找不到配置。'],['Q2','镜像和容器一样吗？','镜像是只读模板，容器是它的运行实例。'],['Q3','如何确认容器在线？','在宿主机运行 docker ps，检查名称与状态。'],['Q4','首次构建失败时先做什么？','保留最后一条 ERROR，确认当前目录、Docker 服务、网络和磁盘空间；只修最先失败的那一层。']],
    troubleTitle:'容器启动失败时，按层排查',
    troubleLead:'先看 Compose 输出最后一条有意义的 ERROR，再判断是目录、权限、服务、网络/镜像还是图形显示。修复后只重跑失败步骤。',
    trouble:[['找不到 Compose 文件','看到 no configuration file provided：回到宿主机，进入 robotics_essentials_ros2/docker 后再执行。'],['Docker 服务未启动','看到 Cannot connect to the Docker daemon：运行 sudo systemctl enable --now docker，再用 docker info 验证。'],['Docker 权限不足','看到 permission denied while connecting Docker：按官方说明加入 docker 用户组，重新登录后再试，不要长期使用 sudo 开发。'],['镜像构建失败','保留最后一条 ERROR，检查网络、代理、磁盘空间和 Dockerfile 行号；不要同时启动第二个 Compose。'],['容器名称冲突','看到 container name is already in use：先 docker ps -a 查看旧容器，确认后停止旧实例，再重新启动。'],['Gazebo / RViz 不显示','重新运行 xhost +，检查 DISPLAY 与 /tmp/.X11-unix；容器在线不等于 GUI 已连通。']],
    after:['记录容器生命周期','运行 docker ps 保存状态；完成课程后记得可用 xhost - 恢复 X11 访问控制。'], next:'00.03 · 工作空间与目录挂载', layers:['host','docker']
  },
  workspace: {
    code:'TASK 00.03', category:'FILESYSTEM & BUILD', title:'把源码放进 src，才能真正持久化。', time:'20', output:'可构建且可持久化的 Package',
    intro:'Compose 只挂载宿主机 exercises_ws/src。Package 必须创建在容器的 ~/exercises_ws/src 中，否则重建容器后可能消失。',
    contentCode:'00.03 / WORKSPACE', contentTitle:'看懂 src、build、install、log', lead:'src 是源码与版本控制区域；build、install、log 由 colcon 生成。构建完成后还要 source install/setup.bash，当前终端才能发现新包。',
    guide:['四个工作空间目录和 Volume 的职责','从 00.02 的课程容器继续，在 src 创建验证包，回到工作空间根目录构建并 source','ros2 pkg list 能找到 workspace_probe，且构建失败时知道如何保留源码排错'],
    concepts:[['SRC','src','真正编写和持久化的功能包源码，本课程只有该目录挂载到宿主机。'],['BLD','build / log','构建中间文件与日志，可以删除后重新生成；构建失败先看 log 和最后一条 ERROR。'],['INS','install','节点运行时使用的安装结果；每个新终端需要加载环境。'],['REC','失败恢复顺序','先确认 package.xml 和依赖，再从工作空间根目录重建；不要先删除整个工作空间。']],
    steps:[
      {location:'CONTAINER · BUILD', command:'cd ~/exercises_ws/src && pwd', action:'进入真正持久化的源码目录', expected:'路径必须以 /home/user/exercises_ws/src 结尾。'},
      {location:'CONTAINER · BUILD', command:'ros2 pkg create --build-type ament_python workspace_probe', action:'创建 Python 验证包', expected:'src/workspace_probe 下出现 package.xml、setup.py 和 Python 包目录。'},
      {location:'CONTAINER · BUILD', command:'cd ~/exercises_ws && colcon build --symlink-install', action:'从工作空间根目录构建', expected:'Summary 中应显示 workspace_probe finished。'},
      {location:'CONTAINER · BUILD', command:'source install/setup.bash && ros2 pkg list | grep workspace_probe', action:'加载并发现新包', expected:'应输出 workspace_probe。'}
    ],
    checks:[['Q1','为什么 Package 要创建在 src？','当前 Compose 只持久化 src；这也是标准 ROS 2 工作空间结构。'],['Q2','install 有什么作用？','保存可运行包和环境脚本。'],['Q3','新终端为什么找不到包？','每个新终端都需要 source 对应工作空间。'],['Q4','colcon build 失败后先看哪里？','先看终端最后一条 ERROR 和 log，再检查 package.xml、依赖与当前目录；不要直接删除 src。']],
    troubleTitle:'构建失败时，先保留源码再定位',
    troubleLead:'工作空间最怕“为了重装把源码删掉”。先确认 src 是否还在，再从最小错误开始修复，最后重新 build 与 source。',
    trouble:[['Package not found','确认当前终端已 source install/setup.bash，并确认包目录位于 ~/exercises_ws/src。'],['构建没有发现包','确认 package.xml 位于 ~/exercises_ws/src/workspace_probe，且 package 名称没有拼写错误。'],['依赖缺失','保留 colcon 输出中的具体依赖名，在容器内补齐对应 ROS 包后，从工作空间根目录重建。'],['CMake / Python 构建错误','先看最后一条 ERROR 对应的文件和行号，只修改当前包，再重跑 colcon build --symlink-install。'],['权限或磁盘错误','检查 src、build、install、log 的所有者和磁盘空间；不要用 root 生成整个工作空间。'],['重建容器后源码消失','检查宿主机 $HOME/exercises_ws/src 与 Compose Volume，源码应在宿主机而不是只存在容器层。']],
    after:['验证 Volume 持久化','在宿主机 $HOME/exercises_ws/src 中确认 workspace_probe 目录真实存在。'], next:'00.04 · 启动 Andino 仿真', layers:['docker','ros']
  },
  simulation: {
    code:'TASK 00.04', category:'SIMULATION BOOT', title:'启动 Andino，再用 /clock 证明它在运行。', time:'20', output:'Andino 仿真在线',
    intro:'Launch 命令会启动仿真、机器人模型、传感器和 RViz。Gazebo 初次下载资源可能较慢，窗口出现后还需要点击 Play。',
    contentCode:'00.04 / SIMULATION', contentTitle:'窗口出现不等于仿真已经前进', lead:'Gazebo/Ignition 可能保持暂停状态。只有 Play 后 /clock 持续更新，传感器与机器人运动才会真正推进。',
    guide:['Launch、Gazebo、RViz、/clock 的关系','必须先完成 00.02 进入容器；启动 Launch、解除暂停，再从第二个容器终端检查 /clock','Gazebo 与 RViz 正常显示，仿真时间持续更新，并能区分窗口问题和数据问题'],
    concepts:[['01','Launch 编排系统','一条 Launch 命令可以启动多个节点和进程；失败时先保留 Launch 终端的最后一条错误。'],['02','Simulation Clock','use_sim_time 节点依赖 /clock，而不是宿主机墙上时间。'],['03','RViz 不是仿真器','RViz 只显示 ROS 2 数据，Gazebo/Ignition 才计算物理与传感器。'],['04','两个终端各有职责','Launch 终端负责保持系统运行，检查终端只观察 /clock、Topic 和 TF；长时间命令用 Ctrl+C 停止。']],
    steps:[
      {location:'CONTAINER · SIM · KEEP RUNNING', command:'ros2 launch andino_gz andino_gz.launch.py', action:'启动 Andino 仿真与 RViz', expected:'等待 Gazebo/Ignition 和 RViz 窗口出现；保持 SIM 终端运行，后续章节都依赖它。'},
      {location:'GAZEBO · MANUAL STEP', manual:true, command:'点击 Gazebo 左下角 Play', action:'解除仿真暂停', expected:'仿真时间开始变化，机器人能够响应 Teleop 或 /cmd_vel。'},
      {location:'HOST · NEW TERMINAL', command:'docker exec -it robotics_essentials_ros2 bash', action:'打开检查终端', expected:'新提示符进入 /home/user/exercises_ws；把它记为 INSPECT，SIM 终端继续保持运行。'},
      {location:'CONTAINER · INSPECT', command:'ros2 topic hz /clock', action:'证明仿真时间持续发布', expected:'应持续显示非零平均频率；确认后按 Ctrl+C，INSPECT 终端继续留给后续检查。'}
    ],
    checks:[['Q1','Launch 文件是什么？','用于配置并启动一组节点和进程。'],['Q2','窗口打开但机器人为什么不动？','Gazebo 可能仍处于暂停状态。'],['Q3','如何证明仿真时间在前进？','在第二个容器终端检查 /clock 频率。'],['Q4','Launch 启动失败时先看什么？','先看 Launch 终端最后一条错误，确认容器、包名、资源路径和 GUI 权限，再重试一次。']],
    troubleTitle:'仿真启动失败时，先分清窗口和数据',
    troubleLead:'Gazebo 窗口、RViz 窗口、Launch 进程和 ROS 2 数据流是四层证据；不要因为看见一个窗口就判断全部正常。',
    trouble:[['首次启动长时间等待','资源可能正在下载；观察 Launch 日志和网络状态，不要重复启动多个实例。'],['Launch 找不到包或文件','保留最后一条错误，确认已 source 工作空间、包名正确，并从课程容器内执行。'],['Entity already exists','旧仿真仍在运行；先在 Launch 终端 Ctrl+C，再确认没有残留进程后重启。'],['窗口不显示','检查 xhost +、DISPLAY、X11 挂载和显卡会话；Launch 进程在线不代表 GUI 连接成功。'],['/clock 没有频率','确认 Gazebo 已点击 Play，并检查 Launch 是否仍在运行；不要只看窗口是否存在。'],['机器人不响应','先检查 /clock、/cmd_vel 和控制器状态，再判断是仿真暂停还是控制链路问题。']],
    after:['完成首次遥控','按参考课程打开 Gazebo Teleop，前进、转向并安全停止机器人。'], next:'00.05 · 环境验收与排错', layers:['ros','sim']
  },
  validation: {
    code:'TASK 00.05', category:'ACCEPTANCE TEST', title:'不用“看起来正常”，用真实证据验收。', time:'15', output:'环境健康基线',
    intro:'最后用节点、Topic、频率和 TF 检查证明环境可用。保存这些结果，后续实验失败时就能区分环境问题和代码问题。',
    contentCode:'00.05 / VALIDATION', contentTitle:'建立可重复的健康检查', lead:'每条命令都应在新的容器终端执行，并记录自己环境的实际输出，不要照抄页面示例。',
    guide:['用 ROS 2 CLI 证明发现、数据和坐标链正常','必须先完成 00.04；完成 Node、Topic、频率、TF 四项真实验收，失败就从原命令恢复','保存进入模块 01 前的环境健康基线'],
    concepts:[['01','Node Discovery','确认关键节点已经加入 ROS_DOMAIN_ID=42。'],['02','Data Flow','确认 /scan、/odom 等 Topic 不只是存在，而且持续发布。'],['03','Spatial Chain','确认 odom 到 rplidar_laser_link 的 TF 路径可查询。'],['04','Evidence Baseline','每项验收都要保存自己环境的真实输出；一条命令失败时先停在该层，不要跳到结论。']],
    steps:[
      {location:'CONTAINER · INSPECT', command:'ros2 node list', action:'检查关键节点', expected:'应看到 robot_state_publisher，以及 ros_gz_bridge / parameter_bridge 相关节点。'},
      {location:'CONTAINER · INSPECT', command:'ros2 topic list | grep -E "^/(scan|odom|cmd_vel)$"', action:'检查关键 Topic', expected:'应至少看到 /scan、/odom 与 /cmd_vel。'},
      {location:'CONTAINER · INSPECT', command:'ros2 topic hz /scan', action:'检查雷达持续发布', expected:'应持续输出稳定的非零平均频率；确认后按 Ctrl+C。'},
      {location:'CONTAINER · INSPECT', command:'ros2 run tf2_ros tf2_echo odom rplidar_laser_link', action:'检查 TF 链', expected:'应持续输出 Translation 与 Rotation；确认后按 Ctrl+C。'}
    ],
    checks:[['Q1','如何证明 Topic 在工作？','检查端点、消息内容和持续频率，而不是只看名称。'],['Q2','No transform 查什么？','检查 Fixed Frame、Frame 名称、TF 父子链和时间。'],['Q3','修复后如何验收？','重复原始失败测试并保存恢复证据。'],['Q4','其中一条验收命令失败怎么办？','记录失败命令和原始输出，只排查对应层；修复后从这条命令开始重做，不能用别的成功输出来替代。']],
    troubleTitle:'验收失败时，不要用“看起来正常”代替证据',
    troubleLead:'把失败命令、完整输出和判断写下来。先修复对应层，再从失败命令开始重复，最后补齐整套健康基线。',
    trouble:[['node list 为空','检查是否在容器中、环境是否 source，以及 ROS_DOMAIN_ID；确认 Launch 进程仍在运行。'],['Topic 名称存在但没有数据','用 ros2 topic info --verbose 看发布者数量，再检查仿真是否暂停和 QoS。'],['/scan 没有频率','检查传感器插件、Launch 日志和 Gazebo Play 状态；不要只看 topic list。'],['TF echo 超时','检查 robot_state_publisher、里程计节点、Frame 名称和 /clock 时间基准。'],['命令本身报错','保存完整错误，确认终端位置和 ROS 发行版；修复后从原命令重试。'],['修复后仍不稳定','重复完整验收并记录频率变化；偶尔成功不能算通过。']],
    after:['保存环境基线','保存 node list、关键 Topic、/scan 频率和 TF 输出，作为模块 01 的起点。'], next:'进入 01 · ROS 2 通信基础', layers:['host','docker','ros','sim']
  }
};

const taskOrder = Object.keys(tasks);
const environmentConceptEvidence = {
  requirements: [
    '用 uname -m 与 lsb_release -ds 证明平台符合 x86_64 Ubuntu 22.04 基线；不符合时停止继续部署。',
    '能解释 Gazebo 负责物理与传感器、RViz 负责订阅并显示；后续分别用 /clock 与 Display Status 验证。',
    '用宿主机 exercises_ws/src、DISPLAY 和 /tmp/.X11-unix 证明源码持久化与 GUI 显示入口已经准备。',
    '保留最后一条 ERROR，先判断平台、权限、服务、网络还是显示层；修复后重复原检查命令。'
  ],
  docker: [
    'pwd 必须以 robotics_essentials_ros2/docker 结尾，证明 Compose 正在读取仓库提供的正确配置。',
    'docker compose up -d 创建运行实例，docker ps 再证明容器真正处于 Running，而不是只有镜像。',
    'xhost + 只开放显示权限；最终仍要以 Gazebo 或 RViz 窗口能否显示作为 GUI 证据。',
    '根据原始错误只修目录、Docker 服务、权限、镜像构建或 X11 中的一层，然后重跑失败步骤。'
  ],
  workspace: [
    'pwd 必须位于 ~/exercises_ws/src，并在宿主机挂载目录中看到源码，才能证明重建容器后不会丢失。',
    'colcon 输出和 log 用来定位构建阶段；build 与 log 可重建，但 src 不能当作缓存删除。',
    'source install/setup.bash 后 ros2 pkg list 能找到新包，才证明安装空间已被当前终端加载。',
    '从最后一条构建错误定位 package.xml、依赖或源码行；修复当前包后从工作空间根目录重新构建。'
  ],
  simulation: [
    'SIM 终端持续运行并保留完整日志，证明 Launch 编排出的 Gazebo、RViz 与 ROS 节点没有被提前关闭。',
    'Gazebo 点击 Play 后，ros2 topic hz /clock 持续输出非零频率，才证明仿真时间正在前进。',
    'Gazebo 负责生成世界与传感器，RViz 负责显示 ROS 数据；窗口、数据与坐标状态必须分别验证。',
    'SIM 只负责保持系统运行，INSPECT 专门执行查询；这样 Ctrl+C 检查命令时不会误停整个仿真。'
  ],
  validation: [
    'ros2 node list 中记录 robot_state_publisher 与桥接节点的真实名称，证明组件已加入计算图。',
    'Topic 名存在后还要用 hz 或 echo 验证持续数据，不能把列表中的名称当作数据正在流动。',
    'tf2_echo odom rplidar_laser_link 持续返回位姿，才能证明传感器坐标链真实连通。',
    '保存每条原始命令与输出；某项失败就停在该层修复，再用同一命令证明恢复。'
  ]
};
const layerInfo = {
  host:['LAYER / HOST','Ubuntu 22.04 主机','参考课程直接支持 x86_64 Ubuntu 22.04；负责运行 Docker、保存源码和显示 GUI。'],
  docker:['LAYER / DOCKER','课程容器','使用仓库 Dockerfile 固定 ROS 2、Ignition 与依赖，并挂载宿主机 exercises_ws/src。'],
  ros:['LAYER / ROS 2','ROS 2 Humble','提供节点发现、Topic、Service、TF、CLI 和功能包系统；Compose 设置 ROS_DOMAIN_ID=42。'],
  sim:['LAYER / SIMULATION','Ignition Fortress + Andino','仿真物理、传感器和机器人运动；RViz 负责显示 ROS 2 数据。']
};

let saved = {};
try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch (_) { saved = {}; }
saved.completed = Array.isArray(saved.completed) ? saved.completed : [];
saved.steps = saved.steps && typeof saved.steps === 'object' ? saved.steps : {};
saved.stages = saved.stages && typeof saved.stages === 'object' ? saved.stages : {};
const completedTasks = new Set(saved.completed);
const requestedTask = new URLSearchParams(window.location.search).get('task');
let currentTask = tasks[requestedTask] ? requestedTask : tasks[saved.currentTask] ? saved.currentTask : 'requirements';
let currentStage = 'learn';
let confirmedSteps = new Set(saved.steps[currentTask] || []);

function persist() {
  saved.completed = [...completedTasks];
  saved.currentTask = currentTask;
  saved.steps[currentTask] = [...confirmedSteps];
  saved.stages[currentTask] = currentStage;
  try { localStorage.setItem(storageKey, JSON.stringify(saved)); } catch (_) {}
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(window.envToastTimer);
  window.envToastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}

function renderProgress() {
  const progress = Math.round(completedTasks.size / taskOrder.length * 100);
  $('#envProgressText').textContent = `${progress}%`;
  $('#envProgressBar').style.width = `${progress}%`;
  $('#envProgressMeta').textContent = `${completedTasks.size} / ${taskOrder.length} TASKS VERIFIED`;
  $('#readinessPercent').textContent = `${progress}%`;
  $('.readiness-score').style.setProperty('--score', `${progress * 3.6}deg`);
  $$('[data-task]').forEach((button, index) => {
    const name = button.dataset.task;
    const done = completedTasks.has(name);
    button.classList.toggle('complete', done);
    button.classList.toggle('active', name === currentTask);
    button.setAttribute('aria-current', name === currentTask ? 'page' : 'false');
    button.querySelector(':scope > i').textContent = done ? '✓' : String(index + 1).padStart(2, '0');
  });
  renderCurrentTaskEvidence();
}

function renderCurrentTaskEvidence() {
  const task = tasks[currentTask];
  const taskIndex = taskOrder.indexOf(currentTask);
  const allStepsDone = confirmedSteps.size === task.steps.length;
  const taskDone = completedTasks.has(currentTask);
  $('#statusTaskCode').textContent = `00.${String(taskIndex + 1).padStart(2, '0')}`;
  $('#statusTaskTitle').textContent = task.contentTitle;
  const gates = [
    {element: $('#envLearnGate'), stage: 'learn', complete: confirmedSteps.size > 0 || taskDone, meta: currentStage === 'learn' ? '当前入口 · 阅读知识链' : '已进入真实操作'},
    {element: $('#envPracticeGate'), stage: 'practice', complete: allStepsDone, meta: `${confirmedSteps.size} / ${task.steps.length} 条真实证据`},
    {element: $('#envReviewGate'), stage: 'review', complete: taskDone, meta: taskDone ? '本任务已经完成' : allStepsDone ? '可以进入后验收' : '等待真实步骤完成'}
  ];
  gates.forEach(gate => {
    gate.element.classList.toggle('active', currentStage === gate.stage);
    gate.element.classList.toggle('complete', gate.complete);
    $('small', gate.element).textContent = gate.meta;
  });
}

function selectEnvironmentKnowledge(index) {
  const task = tasks[currentTask];
  const concept = task.concepts[index];
  if (!concept) return;
  $$('[data-env-knowledge]').forEach((button, buttonIndex) => {
    const active = buttonIndex === index;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  const previous = task.concepts[index - 1];
  const next = task.concepts[index + 1];
  let relation = '';
  if (!previous) relation = `它是本节的判断起点；确认后才能进入“${next[1]}”。`;
  else if (!next) relation = `它把“${previous[1]}”收束成可恢复、可复查的结果。`;
  else relation = `先有“${previous[1]}”，再通过当前节点连接到“${next[1]}”。`;
  $('#envKnowledgeLabel').textContent = `NODE / ${String(index + 1).padStart(2, '0')}`;
  $('#envKnowledgeTitle').textContent = concept[1];
  $('#envKnowledgeText').textContent = concept[2];
  $('#envKnowledgeRelation').textContent = relation;
  $('#envKnowledgeEvidence').textContent = environmentConceptEvidence[currentTask][index];
}

function renderEnvironmentKnowledge(task) {
  $('#envKnowledgeFlow').innerHTML = task.concepts.map((concept, index) => {
    const shortText = concept[2].split(/[。；]/)[0];
    return `<button type="button" data-env-knowledge="${index}"><i>${String(index + 1).padStart(2, '0')}</i><span>KNOWLEDGE NODE</span><b>${concept[1]}</b><small>${shortText}</small></button>`;
  }).join('<em aria-hidden="true">→</em>');
  $$('[data-env-knowledge]').forEach((button, index) => button.addEventListener('click', () => selectEnvironmentKnowledge(index)));
  selectEnvironmentKnowledge(0);
}

function renderStageGuard() {
  const task = tasks[currentTask];
  const remaining = task.steps.length - confirmedSteps.size;
  const reviewLocked = remaining > 0;
  $$('[data-env-stage]').forEach(button => {
    const locked = button.dataset.envStage === 'review' && reviewLocked;
    button.classList.toggle('locked', locked);
    button.setAttribute('aria-disabled', String(locked));
  });

  let title = '';
  let text = '';
  let state = '';
  if (currentStage === 'learn') {
    title = '先理解，再操作；不需要背术语';
    text = `先按顺序点击知识节点，看懂“${task.concepts[0][1]}”如何连接到可验证结果；不要直接跳到命令。`;
    state = '理解阶段';
  } else if (currentStage === 'practice' && remaining > 0) {
    const nextIndex = task.steps.findIndex((_, index) => !confirmedSteps.has(index));
    title = `当前只做第 ${nextIndex + 1} 步：${task.steps[nextIndex].action}`;
    text = `先确认执行位置是“${task.steps[nextIndex].location}”。输出不符合预期时不要确认，也不要继续下一步。`;
    state = `${confirmedSteps.size} / ${task.steps.length} 已确认`;
  } else if (currentStage === 'practice') {
    title = '所有真实步骤都已确认';
    text = '现在可以进入“后验收”，用问答和排错任务检查自己是否真的理解。';
    state = '允许验收';
  } else {
    title = '最后检查：能解释、能复现、能排错';
    text = '只有终端证据齐全才会来到这里。完成复盘与课后任务后，再标记本节完成。';
    state = '验收阶段';
  }
  $('#envGuardTitle').textContent = title;
  $('#envGuardText').textContent = text;
  $('#envGuardState').textContent = state;
  $('#envLearningGuard').classList.toggle('complete', !reviewLocked);
  renderCurrentTaskEvidence();
}

function setStage(stage, options = {}) {
  if (!stageOrder.includes(stage)) return;
  if (stage === 'review' && confirmedSteps.size < tasks[currentTask].steps.length) {
    const remaining = tasks[currentTask].steps.length - confirmedSteps.size;
    if (options.guardMessage !== false) showToast(`还差 ${remaining} 个真实步骤未确认，已带你回到当前步骤`);
    stage = 'practice';
  }
  currentStage = stage;
  saved.stages[currentTask] = stage;
  $$('[data-env-stage]').forEach(button => {
    const active = button.dataset.envStage === stage;
    button.classList.toggle('active', active);
    button.setAttribute('aria-current', active ? 'step' : 'false');
  });
  $$('[data-env-stage-panel]').forEach(panel => {
    panel.hidden = panel.dataset.envStagePanel !== stage;
  });
  renderStageGuard();
  updateStepLocks();
  updateCurrentAction();
  persist();
  if (options.scroll !== false) $('.deployment-stage-nav').scrollIntoView({behavior:'smooth', block:'start'});
}

function updateStepLocks() {
  $$('.procedure-step').forEach(row => {
    const index = Number(row.dataset.step);
    const done = confirmedSteps.has(index);
    const previousComplete = [...Array(index).keys()].every(required => confirmedSteps.has(required));
    const available = done || previousComplete;
    row.classList.toggle('locked', !available);
    row.classList.toggle('current', available && !done);
    row.setAttribute('aria-disabled', String(!available));
    const copyButton = $('.copy-deploy-command', row);
    const confirmButton = $('.confirm-deploy-step', row);
    const evidenceCheck = $('.evidence-ready', row);
    const evidenceReady = done || Boolean(evidenceCheck?.checked);
    if (copyButton) copyButton.disabled = !available;
    if (evidenceCheck) evidenceCheck.disabled = !available || done;
    if (confirmButton) {
      confirmButton.disabled = !available || done || !evidenceReady;
      confirmButton.textContent = done ? '已经确认' : evidenceReady ? '我看到了，确认' : '先勾选证据自检';
    }
  });
}

function renderSteps(task) {
  $('#procedureSteps').innerHTML = task.steps.map((step, index) => {
    const done = confirmedSteps.has(index);
    const copyButton = step.manual ? '' : `<button class="copy-deploy-command" data-copy-step="${index}">复制命令</button>`;
    const commandLabel = step.manual ? '在界面中完成' : '复制后粘贴到上述终端';
    const evidenceLabel = done ? '证据已核对' : step.manual ? '我已对照界面结果' : '我已对照真实输出';
    return `<article class="procedure-step${done ? ' complete' : ''}" data-step="${index}"><i>${done ? '✓' : String(index + 1).padStart(2,'0')}</i><div class="procedure-copy"><div class="step-location"><span>在哪里执行</span><b>${step.location}</b></div><h3>${step.action}</h3><div class="step-command-label">${commandLabel}</div><code>${step.command}</code><div class="step-evidence"><span>看到这个再确认</span><p>${step.expected}</p></div><div class="step-stop"><b>没有看到？</b><span>先不要确认。停在本步，对照下方排错表检查终端、目录和前置程序。</span></div></div><div class="procedure-actions"><label class="evidence-confirmation"><input class="evidence-ready" type="checkbox"${done ? ' checked disabled' : ''} /><span>${evidenceLabel}</span></label>${copyButton}<button class="confirm-deploy-step">${done ? '已经确认' : '先勾选证据自检'}</button></div></article>`;
  }).join('');
  $$('.copy-deploy-command').forEach(button => button.addEventListener('click', () => {
    copyText(task.steps[Number(button.dataset.copyStep)].command, button);
  }));
  $$('.evidence-ready').forEach(input => input.addEventListener('change', () => {
    updateStepLocks();
    if (input.checked) showToast('证据自检已勾选；请再确认真实结果与说明一致');
  }));
  $$('.confirm-deploy-step').forEach(button => button.addEventListener('click', () => confirmStep(button.closest('.procedure-step'))));
  updateStepLocks();
}

function confirmStep(stepElement) {
  const index = Number(stepElement.dataset.step);
  if (confirmedSteps.has(index)) return;
  if (![...Array(index).keys()].every(required => confirmedSteps.has(required))) {
    showToast('请按顺序完成，当前步骤依赖前一个终端状态');
    return;
  }
  confirmedSteps.add(index);
  stepElement.classList.add('complete');
  $('i', stepElement).textContent = '✓';
  const evidenceCheck = $('.evidence-ready', stepElement);
  if (evidenceCheck) {
    evidenceCheck.checked = true;
    evidenceCheck.disabled = true;
    $('span', evidenceCheck.closest('label')).textContent = '证据已核对';
  }
  $('#deployOutput').innerHTML = `<i>EVIDENCE ${String(index + 1).padStart(2,'0')}</i> ${tasks[currentTask].steps[index].expected}`;
  $('#procedureCounter').textContent = `${confirmedSteps.size} / ${tasks[currentTask].steps.length} 已确认`;
  persist();
  updateStepLocks();
  renderStageGuard();
  updateCurrentAction();
  if (confirmedSteps.size === tasks[currentTask].steps.length) showToast('真实步骤证据已齐，可以进入“后验收”');
}

function renderTask(name, options = {}) {
  currentTask = name;
  const task = tasks[name];
  if (completedTasks.has(name)) confirmedSteps = new Set(task.steps.map((_, index) => index));
  else confirmedSteps = new Set(saved.steps[name] || []);
  // 每次进入小章节都从“先理解”开始；只保留学习证据，不恢复上次停留的界面。
  currentStage = 'learn';
  $('#taskCode').textContent = task.code;
  $('#taskCategory').textContent = task.category;
  $('#taskTitle').textContent = task.title;
  $('#taskIntro').textContent = task.intro;
  $('#taskTime').textContent = `${String(task.time).padStart(2,'0')} MIN`;
  $('#taskOutput').textContent = task.output;
  $('#contentCode').textContent = task.contentCode;
  $('#contentTitle').textContent = task.contentTitle;
  $('#contentLead').textContent = task.lead;
  $('#guideLearn').textContent = task.guide[0];
  $('#guideDo').textContent = task.guide[1];
  $('#guideAfter').textContent = task.guide[2];
  $('#procedureTitle').textContent = task.contentTitle;
  $('#helpTitle').textContent = '一次只做当前亮起的步骤';
  $('#helpText').textContent = '“复制命令”不会执行任何操作。请在标注的真实终端运行；只有实际结果与证据说明一致，才点击确认。';
  $('#successText').textContent = task.guide[2];
  $('#afterTitle').textContent = task.after[0];
  $('#afterText').textContent = task.after[1];
  $('#nextTaskName').textContent = task.next;
  $('#procedureCounter').textContent = `${confirmedSteps.size} / ${task.steps.length} 已确认`;
  renderEnvironmentKnowledge(task);
  const taskIndex = taskOrder.indexOf(name);
  const previousTask = taskIndex > 0 ? tasks[taskOrder[taskIndex - 1]] : null;
  $('#envKnowledgeBefore').textContent = previousTask ? `${previousTask.code.replace('TASK ', '')} 已产出：${previousTask.guide[2]}` : '课程起点：确认电脑、操作系统与参考课程基线是否匹配';
  $('#envKnowledgeCurrent').textContent = task.guide[0];
  $('#envKnowledgeOutput').textContent = task.guide[2];
  $('#knowledgeChecks').innerHTML = task.checks.map(check => `<button class="knowledge-check" aria-expanded="false"><span>${check[0]}</span><b>${check[1]}</b><em>点击查看答案</em><p>${check[2]}</p></button>`).join('');
  $('#troubleTitle').textContent = task.troubleTitle || '新手排错顺序';
  $('#troubleLead').textContent = task.troubleLead || '不要同时修改很多东西。先确认当前失败发生在哪一层。';
  $('#troubleMatrix').innerHTML = task.trouble.map(row => `<div class="trouble-row"><b>${row[0]}</b><span>${row[1]}</span></div>`).join('');
  $('#deployOutput').innerHTML = confirmedSteps.size ? '<i>已恢复</i> 已读取本任务的真实步骤进度。' : '<i>准备开始</i> 页面不会执行命令，请从第一步开始。';
  $('#completeSetupTask').innerHTML = completedTasks.has(name) ? '本节已完成 <i>✓</i>' : '确认完成本节 <i>→</i>';
  $$('.architecture-stack button').forEach(button => button.classList.toggle('active', task.layers.includes(button.dataset.layer)));
  $$('.knowledge-check').forEach(button => button.addEventListener('click', () => {
    const expanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!expanded));
    button.classList.toggle('revealed', !expanded);
  }));
  renderSteps(task);
  renderProgress();
  setStage(currentStage, {scroll:false, guardMessage:false});
  persist();
  const index = taskOrder.indexOf(name);
  $('#previousSetupTask').disabled = false;
  $('#previousSetupTask').textContent = index === 0 ? '← COURSE HOME' : '← PREVIOUS';
  $('#nextSetupTask').textContent = index === taskOrder.length - 1 ? '进入模块 01 →' : '下一任务 →';
  if (options.updateUrl !== false) history.replaceState(null, '', `./index.html?task=${encodeURIComponent(name)}`);
  if (options.scroll) $('.deployment-hero').scrollIntoView({behavior:'smooth', block:'start'});
  if (window.matchMedia('(max-width: 860px)').matches) {
    const taskRail = $('.setup-task-list');
    const activeTask = $(`[data-task="${name}"]`);
    const moduleRail = $('.module-switcher');
    const activeModule = $('.module-switcher .active');
    if (taskRail && activeTask) taskRail.scrollLeft = Math.max(0, activeTask.offsetLeft - (taskRail.clientWidth - activeTask.clientWidth) / 2);
    if (moduleRail && activeModule) moduleRail.scrollLeft = Math.max(0, activeModule.offsetLeft - (moduleRail.clientWidth - activeModule.clientWidth) / 2);
  }
}

function updateCurrentAction() {
  const task = tasks[currentTask];
  let action = '';
  if (currentStage === 'learn') action = '先确认课程基线与关键概念，再进入真实步骤';
  else if (confirmedSteps.size < task.steps.length) action = `下一步：${task.steps[confirmedSteps.size].action}`;
  else if (!completedTasks.has(currentTask)) action = '真实步骤已齐，进入复盘并标记任务完成';
  else action = '本任务已完成，可以进入下一任务';
  $('#statusNextAction').textContent = action;
}

function takeNextAction() {
  if (currentStage === 'learn') setStage('practice');
  else if (confirmedSteps.size < tasks[currentTask].steps.length) setStage('practice');
  else setStage('review');
}

async function copyText(value, button) {
  let copied = false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      copied = true;
    }
  } catch (_) {}
  if (!copied) {
    const fallback = document.createElement('textarea');
    fallback.value = value;
    fallback.setAttribute('readonly', '');
    fallback.style.position = 'fixed';
    fallback.style.opacity = '0';
    document.body.appendChild(fallback);
    fallback.select();
    try { copied = document.execCommand('copy'); } catch (_) { copied = false; }
    fallback.remove();
  }
  if (copied) {
    const original = button.innerHTML;
    button.textContent = '已复制';
    showToast('命令已复制；请先确认终端位置，再粘贴执行');
    setTimeout(() => { button.innerHTML = original; }, 1400);
  } else {
    showToast('浏览器未允许复制，请手动选择命令');
  }
}

$$('[data-task]').forEach(button => button.addEventListener('click', () => renderTask(button.dataset.task, {scroll:true})));
$$('[data-env-stage]').forEach(button => button.addEventListener('click', () => setStage(button.dataset.envStage)));
$$('.architecture-stack button').forEach(button => button.addEventListener('click', () => {
  const info = layerInfo[button.dataset.layer];
  $('#layerLabel').textContent = info[0];
  $('#layerTitle').textContent = info[1];
  $('#layerText').textContent = info[2];
}));
$('#jumpProcedure').addEventListener('click', () => setStage('practice'));
$('#statusJump').addEventListener('click', takeNextAction);
$('#completeSetupTask').addEventListener('click', () => {
  const task = tasks[currentTask];
  if (completedTasks.has(currentTask)) {
    showToast('该任务已经完成');
    return;
  }
  if (confirmedSteps.size < task.steps.length) {
    showToast('请先在真实终端完成并确认所有步骤');
    setStage('practice');
    return;
  }
  completedTasks.add(currentTask);
  persist();
  renderProgress();
  updateCurrentAction();
  $('#completeSetupTask').innerHTML = '本节已完成 <i>✓</i>';
  showToast(`${task.code} 已完成 · 进度已保存`);
});
$('#previousSetupTask').addEventListener('click', () => {
  const index = taskOrder.indexOf(currentTask);
  if (index > 0) {
    renderTask(taskOrder[index - 1], {scroll:true});
    return;
  }
  if (window.routeTo) window.routeTo('../../index.html#curriculum');
  else window.location.href = '../../index.html#curriculum';
});
$('#nextSetupTask').addEventListener('click', () => {
  const index = taskOrder.indexOf(currentTask);
  if (!completedTasks.has(currentTask)) {
    showToast('请先完成当前任务；也可以使用左侧目录预览其他任务');
    takeNextAction();
    return;
  }
  if (index === taskOrder.length - 1) {
    if (window.routeTo) window.routeTo('../01/index.html');
    else window.location.href = '../01/index.html';
    return;
  }
  renderTask(taskOrder[index + 1], {scroll:true});
});

window.addEventListener('pageshow', event => {
  if (event.persisted) window.location.reload();
});
window.addEventListener('storage', event => {
  if (event.key === storageKey) window.location.reload();
});

renderTask(currentTask, {scroll:false});

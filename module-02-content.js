window.module02Lessons = {
  slam_model: {
    code: '02.01',
    category: 'MENTAL MODEL / MAPPING',
    title: '先看懂 SLAM：机器人怎样边走边画地图',
    time: 32,
    intro: 'SLAM 不是“打开一个地图窗口”，而是同时估计机器人位姿并更新环境地图。先把 LaserScan、里程计、TF、位姿估计和 OccupancyGrid 串起来，后面的启动命令才有判断依据。',
    route: {
      learn: '解释 SLAM、OccupancyGrid、位姿估计和闭环检测之间的关系',
      do: '先证明 /scan、odom 到雷达的 TF 与地图消息接口都具备',
      after: '画出“扫描 → 位姿 → 地图”的四段数据链，并标出每段失败现象'
    },
    prerequisite: '前置：完成 00.04 并保持 Andino 仿真运行；已经在 01.03、01.06 学过 Topic 与 TF。若仿真未运行，先回到 00.04，不要在空系统里检查 SLAM 输入。',
    concepts: [
      {
        label: 'SLAM',
        title: '同时定位与建图',
        definition: '机器人没有现成地图时，要一边根据传感器更新地图，一边估计自己在地图中的位置，这两个问题互相依赖。',
        detail: '如果位姿估计偏了，同一面墙会被画到不同位置；如果地图质量差，后续扫描匹配又会更不稳定。SLAM 的关键是让运动估计与环境观测不断互相校正。'
      },
      {
        label: 'OCCUPANCY GRID',
        title: '占据栅格地图',
        definition: '二维环境被切成很多小格，每个格子表达“空闲、被占据或未知”，ROS 2 使用 nav_msgs/msg/OccupancyGrid 传输。',
        detail: 'resolution 决定每个像素代表多少米；origin 决定图像左下角在 map 坐标系中的位置。地图图像不是普通截图，它必须和 YAML 元数据一起使用。'
      },
      {
        label: 'LOOP CLOSURE',
        title: '闭环检测',
        definition: '机器人再次回到走过的区域时，SLAM 尝试认出旧位置，并用这个约束修正累计漂移。',
        detail: '闭环可能让整张地图突然轻微调整，这是优化结果，不一定是故障。真正的问题是墙体持续重影、地图撕裂，或 map 到 odom 的关系剧烈跳变。'
      }
    ],
    chain: {
      before: '01.03 Topic、01.06 TF 与 01.04 底盘控制',
      current: '把传感器观测和运动估计组合成地图',
      next: '02.02 启动 slam_toolbox 并看到 /map',
      nodes: [
        {tag: 'SENSE', title: '/scan', role: '提供环境轮廓', detail: 'rplidar_laser_link 中的 LaserScan 给出每个方向的距离。没有持续扫描，SLAM 没有可用于匹配的环境特征。', preview: 'ros2 topic hz /scan'},
        {tag: 'MOTION', title: 'ODOM + TF', role: '给出短时运动先验', detail: 'odom 到 base_link 提供连续运动估计，base_link 到 rplidar_laser_link 给出传感器安装关系。TF 断链时扫描无法放入统一空间。', preview: 'ros2 run tf2_ros tf2_echo odom rplidar_laser_link'},
        {tag: 'ESTIMATE', title: 'SLAM TOOLBOX', role: '扫描匹配与图优化', detail: 'slam_toolbox 比较相邻扫描、维护位姿图，并在识别到旧区域时加入闭环约束。', preview: 'ros2 node list | grep slam'},
        {tag: 'OUTPUT', title: '/map + map→odom', role: '发布地图与全局修正', detail: 'OccupancyGrid 供 RViz 与地图服务器使用；map 到 odom 吸收全局修正，同时保留 odom 的短时连续性。', preview: 'ros2 topic info /map --verbose'}
      ]
    },
    lab: {
      title: '检查建图前的四项输入',
      intro: '本节不启动 slam_toolbox，只确认它依赖的输入真实存在。每条命令都在课程容器的 INSPECT 终端执行，SIM 必须继续运行。',
      success: '能够证明 /scan 有发布者且持续更新、TF 从 odom 连到 rplidar_laser_link，并能读懂 OccupancyGrid 的关键字段。',
      recovery: '若 /scan 或 TF 不成立，停在当前层：先检查 Gazebo 是否 Play、/clock 是否更新、Andino Launch 是否仍运行。输入没有恢复前不要启动建图。',
      steps: [
        {terminal:'INSPECT · CONTAINER', keep:'保持 SIM 终端与 Gazebo 运行', action:'确认雷达 Topic 有真实发布端', command:'ros2 topic info /scan --verbose', expected:'Type 为 sensor_msgs/msg/LaserScan，Publisher count 至少为 1，并能看到发布端 QoS。', recovery:'Publisher count 为 0 时检查仿真是否暂停、雷达插件是否启动；Topic 不存在时回到 00.04 重启 Andino。'},
        {terminal:'INSPECT · SAME TERMINAL', keep:'保持 SIM 运行', action:'确认雷达不是只有名称而是真的在更新', command:'ros2 topic hz /scan', expected:'终端持续输出 average rate；观察数次后按 Ctrl+C 结束，不要求固定为某个绝对频率。', recovery:'一直无输出时先运行 ros2 topic echo /scan --once；仍无数据则检查 /clock 与 Gazebo Play。', stop:'看到稳定频率后按 Ctrl+C，避免命令一直占用终端。'},
        {terminal:'INSPECT · SAME TERMINAL', keep:'保持 SIM 运行', action:'确认里程计坐标能连接到雷达坐标', command:'ros2 run tf2_ros tf2_echo odom rplidar_laser_link', expected:'持续看到 Translation、Rotation 和时间戳，而不是 Could not transform。', recovery:'若断链，运行 ros2 run tf2_tools view_frames，找出缺失的 parent/child；不要通过随意改 Fixed Frame 掩盖问题。', stop:'看到多次有效变换后按 Ctrl+C。'},
        {terminal:'INSPECT · SAME TERMINAL', keep:'保持 SIM 运行', action:'读取地图消息的结构', command:'ros2 interface show nav_msgs/msg/OccupancyGrid', expected:'看到 Header、MapMetaData info 与 int8[] data，能指出 resolution、origin、width、height 的位置。', recovery:'Package not found 时确认已进入 Humble 课程容器并 source /opt/ros/humble/setup.bash。'}
      ]
    },
    scenario: {
      title: '雷达有数据，但 SLAM 无法使用扫描',
      symptom: '/scan 持续发布，slam_toolbox 日志提示无法把 rplidar_laser_link 转换到 odom。',
      question: '第一项最有效的检查是什么？',
      options: [
        '运行 tf2_echo odom rplidar_laser_link，确认空间链和时间是否可查询',
        '把地图分辨率改得更小',
        '重新给 RViz 换一个颜色主题'
      ],
      correct: 0,
      correctText: '正确。扫描存在但无法放入统一坐标系，证据已经指向 TF 或时间层，应先验证变换链。',
      wrongText: '当前故障发生在扫描进入 SLAM 之前，地图参数和显示样式都不能修复缺失的坐标变换。'
    },
    checks: [
      {prompt:'为什么 SLAM 必须同时处理位姿和地图？', answer:'因为扫描要依赖位姿放进地图，而位姿又要依赖地图或历史扫描进行匹配，两者互相约束。'},
      {prompt:'OccupancyGrid 与普通 PNG 有什么不同？', answer:'OccupancyGrid 带坐标系、分辨率、原点和栅格状态；保存后仍需 YAML 元数据把图像转换回真实世界尺寸。'},
      {prompt:'闭环后地图轻微调整一定是错误吗？', answer:'不一定。闭环优化会重新分配累计误差；持续重影、撕裂或剧烈跳变才需要继续排查。'}
    ],
    after: {
      title: '四段数据链手绘任务',
      text: '用一张纸画出 /scan → odom/TF → slam_toolbox → /map，并在每一段旁写一条检查命令。',
      deliverable: '提交物：四个节点、三条箭头、四条真实命令，以及“TF 断链会看到什么”的一句说明。'
    },
    next: '02.02 · 启动在线建图管线'
  },
  mapping_launch: {
    code: '02.02',
    category: 'SYSTEM STARTUP / SLAM TOOLBOX',
    title: '启动在线建图：让 /map 第一次出现',
    time: 38,
    intro: '这一节把仿真、slam_toolbox、RViz 和检查终端分开启动。你要学会判断“进程启动”“Topic 存在”“地图真正更新”是三种不同证据。',
    route: {
      learn: '解释异步建图节点、map→odom 和 RViz Map Display 的职责',
      do: '按 SIM → MAPPING → INSPECT → RVIZ 顺序启动并验收 /map',
      after: '保存四个终端的职责与关键输出截图'
    },
    prerequisite: '前置：02.01 的 /scan 和 TF 检查全部通过；课程容器处于 Running。开始前关闭重复的 Andino、slam_toolbox 或 RViz 进程，避免同名节点和重复 TF 发布者。',
    concepts: [
      {label:'ONLINE ASYNC', title:'在线异步建图', definition:'传感器回调持续接收扫描，地图更新与优化在后台进行，不要求机器人每移动一步就阻塞等待整张地图重算。', detail:'异步不等于无顺序。传感器时间、TF 和位姿队列仍必须匹配；CPU 过载会表现为消息积压或变换超时。'},
      {label:'MAP FRAME', title:'map 与 odom 的分工', definition:'odom 保持短时连续，map 表达经过全局修正后的世界参考；SLAM 通常发布 map→odom。', detail:'不要让两个定位系统同时发布 map→odom。建图时由 slam_toolbox 负责；之后切换到 AMCL 时必须先停止 slam_toolbox。'},
      {label:'DISPLAY', title:'RViz Map Display', definition:'Map Display 订阅 /map 并把 OccupancyGrid 画出来，它只是消费者，不负责生成地图。', detail:'RViz 里没有地图时，要分别检查 /map 发布端、消息数据、Fixed Frame 和 Display Status，不能只反复点击 Add。'}
    ],
    chain: {
      before: '02.01 已验证 /scan、TF 与地图接口',
      current: '启动并证明完整在线建图管线',
      next: '02.03 运动覆盖、闭环与地图质量',
      nodes: [
        {tag:'SIM', title:'ANDINO GAZEBO', role:'提供物理、雷达和里程计', detail:'SIM 终端是整条管线的根。关闭它会同时失去 /clock、/scan、odom 和机器人运动。', preview:'ros2 launch andino_gz andino_gz.launch.py'},
        {tag:'MAPPING', title:'SLAM TOOLBOX', role:'消费扫描并估计地图', detail:'在线异步 Launch 启动 slam_toolbox 并使用 Andino 的参数配置。终端必须保持运行。', preview:'ros2 launch andino_gz slam_toolbox_online_async.launch.py'},
        {tag:'GRAPH', title:'/map + TF', role:'提供可检查的数据证据', detail:'INSPECT 证明 /map 有发布者，并检查 map→odom 已经出现。只看到节点名还不算建图成功。', preview:'ros2 topic info /map --verbose'},
        {tag:'VIEW', title:'RVIZ MAP', role:'显示占据栅格和状态', detail:'Map Display 订阅 /map；Fixed Frame 使用 map。绿色状态与逐步扩展的栅格共同构成可视证据。', preview:'RViz → Add → Map → /map'}
      ]
    },
    lab: {
      title: '按职责启动建图工位',
      intro: '依次使用 SIM、MAPPING、INSPECT 和 RVIZ。长时间运行的 Launch 不要关闭；查询命令只放在 INSPECT。',
      success: 'Gazebo 与 RViz 正常显示，slam_toolbox 保持运行，/map 有发布者，RViz 中能看到机器人周围第一圈栅格。',
      recovery: '任何一步失败都保留该终端最后一条 ERROR。先检查容器位置、重复进程、/clock、/scan 和 TF，再重试当前层；不要一次重启所有终端。',
      steps: [
        {terminal:'SIM · CONTAINER · KEEP RUNNING', keep:'若已有唯一且正常的 Andino SIM，可沿用；否则先关闭重复实例', action:'启动 Andino 仿真基线', command:'ros2 launch andino_gz andino_gz.launch.py', expected:'Gazebo 与 RViz 出现，SIM 终端没有持续 ERROR，机器人和雷达可见。', recovery:'窗口不出现时检查 DISPLAY/X11；模型不加载时保留 Launch 的 package/resource 错误并回到 00.04。', stop:'本节结束前保持 SIM 运行。'},
        {terminal:'MAPPING · NEW CONTAINER TERMINAL · KEEP RUNNING', keep:'SIM 必须继续运行', action:'启动 slam_toolbox 在线异步建图', command:'ros2 launch andino_gz slam_toolbox_online_async.launch.py', expected:'日志显示 slam_toolbox 配置并激活，没有持续的 transform timeout；MAPPING 终端保持占用。', recovery:'找不到 Launch 时运行 ros2 pkg prefix andino_gz；变换超时时回到 02.01 重查 /scan 与 TF。', stop:'建图期间保持 MAPPING 运行。'},
        {terminal:'INSPECT · NEW CONTAINER TERMINAL', keep:'同时保持 SIM 与 MAPPING', action:'证明 /map 由真实节点发布', command:'ros2 topic info /map --verbose', expected:'Type 为 nav_msgs/msg/OccupancyGrid，Publisher count 至少为 1，发布端与 slam_toolbox 相关。', recovery:'Topic 不存在时先用 ros2 node list | grep slam 检查节点；节点存在但未激活时查看 MAPPING 日志与 lifecycle 状态。'},
        {terminal:'INSPECT · SAME TERMINAL', keep:'保持 SIM 与 MAPPING', action:'确认 map 到 odom 的全局修正已经建立', command:'ros2 run tf2_ros tf2_echo map odom', expected:'持续看到 map 到 odom 的 Translation、Rotation 与时间戳。', recovery:'Could not transform 时确认没有 AMCL 与 slam_toolbox 同时争用 map→odom，并检查 use_sim_time。', stop:'看到多次有效输出后按 Ctrl+C。'},
        {terminal:'RVIZ / GUI', keep:'保持 SIM、MAPPING 和 INSPECT 可用', action:'添加 Map Display 并订阅 /map', command:'RViz → Fixed Frame: map → Add → Map → Topic: /map', expected:'Map Display 状态为绿色，机器人附近出现黑白灰栅格；移动前地图范围较小是正常现象。', recovery:'红色状态先展开原始错误；No map received 查 /map，No transform 查 map 到消息 frame_id。', manual:true}
      ]
    },
    scenario: {
      title: 'slam_toolbox 进程存在，但 /map 没有发布端',
      symptom: 'ros2 node list 能看到 slam_toolbox，RViz Map 显示 No map received。',
      question: '下一步怎样最有效地缩小范围？',
      options: [
        '检查 MAPPING 日志、节点 lifecycle 状态以及 /scan 是否持续到达',
        '重新安装 RViz',
        '先启动 AMCL 来生成 map'
      ],
      correct: 0,
      correctText: '正确。节点名称只证明发现成功，还要确认它已激活并收到扫描输入。',
      wrongText: 'RViz 只是消费者，AMCL 也不会替 slam_toolbox 生成新地图；应先检查建图节点状态与输入。'
    },
    checks: [
      {prompt:'为什么 SIM 与 MAPPING 要放在不同终端？', answer:'两者都需要持续运行，分开后能独立观察日志、停止单层，并避免查询命令覆盖关键错误。'},
      {prompt:'看到 /map 名称就能确认建图成功吗？', answer:'不能。还要确认 Publisher count、消息更新、map→odom 和 RViz 中实际栅格。'},
      {prompt:'建图时谁应该发布 map→odom？', answer:'本路线中由 slam_toolbox 负责；切换到 AMCL 前要停止 slam_toolbox。'}
    ],
    after: {
      title: '建图工位证据包',
      text: '分别记录 SIM、MAPPING、INSPECT 和 RVIZ 的职责，并截取每一层的成功证据。',
      deliverable: '提交物：四张证据图或四段输出，每段标注“它证明了什么、不能证明什么”。'
    },
    next: '02.03 · 运动覆盖与闭环质量'
  },
  mapping_drive: {
    code: '02.03',
    category: 'MAPPING OPERATION / LOOP CLOSURE',
    title: '安全覆盖环境：让地图从一小块变成可用空间',
    time: 42,
    intro: '地图质量取决于机器人如何运动。速度过快、只走直线、贴墙太近或从不返回旧区域，都会让扫描匹配和闭环变差。本节用低速、分段、可停止的动作完成第一轮覆盖。',
    route: {
      learn: '识别覆盖不足、扫描拖影、闭环修正和不可通行窄缝',
      do: '用低速旋转、前进、停止和回环路线扩展地图',
      after: '给地图做一次质量审查并列出需要补扫的区域'
    },
    prerequisite: '前置：02.02 的 /map 与 map→odom 已通过；Gazebo 处于 Play。清空仿真机器人周围，COMMAND 终端只负责运动，随时准备 Ctrl+C 与全零 Twist。',
    concepts: [
      {label:'COVERAGE', title:'覆盖而不是乱逛', definition:'建图路线要让雷达从多个角度观察墙角、通道和开阔区域，同时保留足够重叠区域供扫描匹配。', detail:'先原地慢转建立周围轮廓，再沿边界分段前进；进入新区域前保留可回头空间。一次只执行短动作，观察地图后再决定下一段。'},
      {label:'SCAN MATCH', title:'扫描匹配', definition:'算法比较当前扫描与历史扫描或局部地图，估计机器人相对运动并修正里程计误差。', detail:'环境特征太少、运动太快或 TF 时间错位都会降低匹配质量。墙体出现多条平行重影时，先停止运动再查时间与 TF。'},
      {label:'MAP QUALITY', title:'可用地图的判断标准', definition:'墙体应连续、通道宽度合理、无大面积重复轮廓，机器人能够回到已知区域并让地图稳定对齐。', detail:'“看起来像房间”还不够。后续 Nav2 需要可分辨的空闲区、障碍边界和机器人可通过的通道。'}
    ],
    chain: {
      before: '02.02 已产生第一圈 /map',
      current: '通过受控运动增加覆盖并触发闭环',
      next: '02.04 保存并验收地图文件',
      nodes: [
        {tag:'ORIENT', title:'低速原地旋转', role:'建立起点周围的完整轮廓', detail:'小角速度让雷达观察各方向。若地图拖影，立即停止，不要用更快速度“补救”。', preview:'angular.z: 0.25'},
        {tag:'EXPLORE', title:'短距离前进', role:'进入未知区域', detail:'每段只走几秒，保持离障碍物有余量；在 RViz 中确认已知栅格向前扩展。', preview:'linear.x: 0.12'},
        {tag:'STOP + OBSERVE', title:'停下检查', role:'分离运动误差与地图状态', detail:'发送全零 Twist 后观察地图是否仍跳动。停止后持续错位通常指向 TF、时间或扫描匹配问题。', preview:'linear.x: 0.0, angular.z: 0.0'},
        {tag:'RETURN', title:'回到旧区域', role:'提供闭环约束', detail:'沿不同方向回到起点附近，观察旧墙体是否重新对齐，而不是生成第二套轮廓。', preview:'RViz 中比较新旧墙线'}
      ]
    },
    lab: {
      title: '完成一条低速回环路线',
      intro: 'COMMAND 终端的运动命令会持续发布，必须按说明 Ctrl+C 并发送停止命令。每个动作后都回到 RViz 判断地图，而不是连续粘贴所有命令。',
      success: '地图覆盖明显扩展，墙体轮廓基本连续；返回起点附近后没有长期保留两套平行墙线。',
      recovery: '机器人靠近障碍、地图开始拖影或控制不确定时，第一动作永远是 Ctrl+C 并发送全零 Twist。停止后再检查 /clock、TF、scan 频率与地图日志。',
      steps: [
        {terminal:'COMMAND · CONTAINER', keep:'保持 SIM、MAPPING 与 RVIZ 运行', action:'低速原地旋转建立周围轮廓', command:'ros2 topic pub -r 10 /cmd_vel geometry_msgs/msg/Twist "{linear: {x: 0.0}, angular: {z: 0.25}}"', expected:'机器人缓慢旋转，RViz 中周围墙体逐步出现；旋转约一圈前按 Ctrl+C。', recovery:'机器人不动时先检查 /cmd_vel 订阅端、ros_gz_bridge、Gazebo Play 与 /clock，不要提高到危险速度。', stop:'完成所需角度后按 Ctrl+C，并立即执行下一步停止命令。'},
        {terminal:'COMMAND · SAME TERMINAL', keep:'保持其他三个终端运行', action:'明确发送全零速度并确认停止', command:'ros2 topic pub --once /cmd_vel geometry_msgs/msg/Twist "{linear: {x: 0.0}, angular: {z: 0.0}}"', expected:'机器人停止转动；RViz 中机器人姿态不再连续变化。', recovery:'仍运动时再次发送全零 Twist，并检查是否有其他 /cmd_vel 发布者持续覆盖命令。'},
        {terminal:'COMMAND · SAME TERMINAL', keep:'确认前方有足够空闲区域', action:'低速向前扩展一小段未知区域', command:'ros2 topic pub -r 10 /cmd_vel geometry_msgs/msg/Twist "{linear: {x: 0.12}, angular: {z: 0.0}}"', expected:'机器人缓慢前进，未知灰区转为可见的空闲区与障碍边界；数秒后按 Ctrl+C。', recovery:'路径接近障碍或地图错位时立即 Ctrl+C，再执行全零命令；不要让持续发布命令留在后台。', stop:'只移动一小段，按 Ctrl+C 后再次执行全零停止命令。'},
        {terminal:'RVIZ / GAZEBO', keep:'COMMAND 已停止，SIM 与 MAPPING 继续', action:'规划并完成多段短动作，最终回到起点附近', command:'界面任务：旋转观察 → 短距离前进 → 停止检查 → 转向 → 返回旧区域', expected:'地图覆盖扩大；回到旧区域时墙体重新对齐或轻微整体修正，没有持续的双墙重影。', recovery:'出现持续双墙时停止机器人，保存截图与 MAPPING 错误，再查 use_sim_time、TF 时间和 /scan 频率。', manual:true}
      ]
    },
    scenario: {
      title: '地图出现两套平行墙线',
      symptom: '机器人高速转弯后，RViz 中同一面墙出现明显重影，停止后仍未恢复。',
      question: '最安全、最有信息量的第一步是什么？',
      options: [
        '先停止机器人，保留现象，再检查 TF 时间、/clock、scan 频率和 MAPPING 日志',
        '把线速度继续提高，让机器人更快回到起点',
        '直接保存当前地图，后续由 Nav2 自动修复'
      ],
      correct: 0,
      correctText: '正确。先消除持续运动这个变量，再用时间、TF 与传感器证据判断重影来源。',
      wrongText: '继续运动会扩大错误；Nav2 使用地图但不会自动修复一张已经重影的静态地图。'
    },
    checks: [
      {prompt:'为什么建议分段运动并频繁停止？', answer:'这样能控制风险，并把运动期间的误差与停止后的地图状态分开观察。'},
      {prompt:'闭环路线为什么要回到旧区域？', answer:'重访区域能提供历史匹配约束，帮助图优化修正累计漂移。'},
      {prompt:'怎样区分正常闭环修正与持续故障？', answer:'正常修正通常短暂且随后稳定；持续双墙、撕裂或姿态跳变需要检查时间、TF 和扫描匹配。'}
    ],
    after: {
      title: '地图质量审查表',
      text: '从墙体连续性、通道宽度、未知区域、重影和回环稳定性五项检查当前地图。',
      deliverable: '提交物：一张地图截图、五项结论，以及至少两个准备补扫的位置。'
    },
    next: '02.04 · 保存与校验地图'
  },
  map_save: {
    code: '02.04',
    category: 'MAP ARTIFACT / PERSISTENCE',
    title: '保存地图：把运行中的 /map 变成可复用文件',
    time: 30,
    intro: '地图保存不是截屏。map_saver 会生成图像和 YAML：图像保存栅格，YAML 保存分辨率、原点、阈值和图像路径。本路线把文件放进宿主机挂载的 src/maps，避免重建容器后丢失。',
    route: {
      learn: '解释 PNG/PGM 与 YAML 各自保存什么，以及阈值如何影响占据判断',
      do: '把 /map 保存到持久化目录，并在容器与宿主机两侧核对',
      after: '建立一份带版本、日期和质量说明的地图清单'
    },
    prerequisite: '前置：02.03 已得到没有明显重影的地图；SIM 与 MAPPING 保持运行，/map 仍有发布者。宿主机 $HOME/exercises_ws/src 已按 00.03 挂载。',
    concepts: [
      {label:'IMAGE', title:'地图图像', definition:'每个像素编码空闲、占据或未知区域，本节按参考仓库使用 PNG 格式保存。', detail:'图像方向与普通照片不同，不能随意裁剪或缩放。任何像素修改都必须保持 YAML 中 resolution、origin 与实际环境一致。'},
      {label:'YAML METADATA', title:'地图元数据', definition:'YAML 记录 image、mode、resolution、origin、negate、occupied_thresh 和 free_thresh。', detail:'Nav2 加载 YAML 后才能把像素恢复成真实世界坐标。image 通常使用相对路径，因此移动文件时要让 YAML 和图像保持对应。'},
      {label:'PERSISTENCE', title:'容器与宿主机持久化', definition:'容器的普通 Home 目录可能随容器重建消失；课程只保证 exercises_ws/src 挂载到宿主机。', detail:'因此保存到 ~/exercises_ws/src/maps，并在 HOST 再次确认文件存在。这样地图既能被容器读取，也能被宿主机备份。'}
    ],
    chain: {
      before: '02.03 已获得可用的实时 /map',
      current: '把运行时 Topic 固化为可追踪资产',
      next: '02.05 用保存地图启动 AMCL 定位',
      nodes: [
        {tag:'SOURCE', title:'/map', role:'实时 OccupancyGrid', detail:'map_saver 订阅当前地图。若没有发布端，命令无法生成有效文件。', preview:'ros2 topic info /map --verbose'},
        {tag:'SAVE', title:'MAP SAVER CLI', role:'转换并写出文件', detail:'free 0.15 指定空闲阈值，fmt png 指定图像格式，-f 指定不带扩展名的输出前缀。', preview:'ros2 run nav2_map_server map_saver_cli ...'},
        {tag:'ARTIFACT', title:'YAML + PNG', role:'几何元数据与栅格图像', detail:'两份文件必须成对存在；YAML 的 image 字段要能找到 PNG。', preview:'ls -lh andino_map.yaml andino_map.png'},
        {tag:'HOST', title:'MOUNTED COPY', role:'跨容器保留资产', detail:'宿主机 exercises_ws/src/maps 是最终持久化证据。只在容器 $HOME 根目录看到文件还不够。', preview:'HOST: ls $HOME/exercises_ws/src/maps'}
      ]
    },
    lab: {
      title: '保存、读取并跨边界确认地图',
      intro: '前三步在容器 INSPECT 执行，最后一步在宿主机 HOST 执行。不要停止 MAPPING，直到 map_saver 返回成功。',
      success: '容器与宿主机都能看到 andino_map.yaml 和 andino_map.png，YAML 的 image、resolution、origin 与阈值字段完整。',
      recovery: '保存超时时先检查 /map 发布端；Permission denied 时检查挂载目录所有者；只生成一份文件时保留 map_saver 的完整错误并确认磁盘空间。',
      steps: [
        {terminal:'INSPECT · CONTAINER', keep:'保持 SIM 与 MAPPING 运行', action:'创建宿主机可持久化的地图目录', command:'mkdir -p ~/exercises_ws/src/maps && ls -ld ~/exercises_ws/src/maps', expected:'目录路径为 /home/user/exercises_ws/src/maps，当前用户拥有写权限。', recovery:'Permission denied 时先检查宿主机目录所有者与 Compose Volume，不要用 sudo 在挂载目录制造 root 文件。'},
        {terminal:'INSPECT · SAME TERMINAL', keep:'保持 /map 有发布端', action:'按参考参数保存地图', command:'ros2 run nav2_map_server map_saver_cli --free 0.15 --fmt png -f ~/exercises_ws/src/maps/andino_map', expected:'日志显示收到地图并成功写出地图；命令正常返回到提示符。', recovery:'Failed to spin map subscription 时运行 ros2 topic info /map --verbose；找不到 nav2_map_server 时检查镜像依赖是否完整。'},
        {terminal:'INSPECT · SAME TERMINAL', keep:'地图已经保存，可以继续保持建图或准备后续停止', action:'确认两份文件及 YAML 元数据', command:'ls -lh ~/exercises_ws/src/maps/andino_map.yaml ~/exercises_ws/src/maps/andino_map.png && sed -n "1,12p" ~/exercises_ws/src/maps/andino_map.yaml', expected:'两份文件都非空；YAML 能看到 image、resolution、origin、occupied_thresh 与 free_thresh。', recovery:'YAML 的 image 指向不存在文件时不要手工猜路径；重新在同一目录保存，或同步修改并重新验证相对路径。'},
        {terminal:'HOST · UBUNTU TERMINAL', keep:'容器不需要停止', action:'证明地图已经穿过 Volume 保存在宿主机', command:'ls -lh $HOME/exercises_ws/src/maps/andino_map.yaml $HOME/exercises_ws/src/maps/andino_map.png', expected:'宿主机看到与容器同名的 YAML 和 PNG；这证明容器重建后地图仍可恢复。', recovery:'宿主机看不到时回到 00.03 检查 exercises_ws/src 的 Volume；不要把容器内文件存在误当作持久化成功。'}
      ]
    },
    scenario: {
      title: 'YAML 存在，但加载地图时报 image file not found',
      symptom: 'andino_map.yaml 可以打开，其中 image 指向 andino_map.png，但该图像被单独移动到了另一个目录。',
      question: '正确处理方式是什么？',
      options: [
        '让 YAML 与图像保持可解析的相对路径，成对移动或更新 image 后重新验证',
        '删除 YAML，只把 PNG 交给 Nav2',
        '提高 occupied_thresh 让路径自动恢复'
      ],
      correct: 0,
      correctText: '正确。YAML 是入口，image 字段必须能解析到对应栅格图像。',
      wrongText: 'Nav2 不能只靠普通 PNG 恢复真实尺寸；阈值也不会修复文件路径。'
    },
    checks: [
      {prompt:'为什么地图需要 YAML 和图像两份文件？', answer:'图像保存栅格状态，YAML 保存真实尺寸、坐标原点、阈值和图像路径。'},
      {prompt:'为什么不直接保存到容器的 ~/andino_map？', answer:'课程只保证 exercises_ws/src 被挂载；容器重建可能丢失普通 Home 目录中的文件。'},
      {prompt:'保存成功后为什么还要在 HOST 检查？', answer:'容器内存在只证明写盘成功，HOST 检查才能证明 Volume 持久化链路成立。'}
    ],
    after: {
      title: '地图资产登记',
      text: '为这张地图记录日期、来源环境、分辨率、文件位置、覆盖范围与已知缺陷。',
      deliverable: '提交物：地图清单一行、YAML/PNG 校验结果，以及一条“何时需要重建地图”的判断标准。'
    },
    next: '02.05 · AMCL 初始定位'
  },
  localization: {
    code: '02.05',
    category: 'LOCALIZATION / AMCL',
    title: '切换到已知地图：让机器人知道自己在哪里',
    time: 44,
    intro: '建图阶段由 slam_toolbox 同时维护地图和位姿；导航阶段地图已经固定，AMCL 用雷达与已知地图估计机器人位姿。切换前必须停止建图，避免两个系统同时发布 map→odom。',
    route: {
      learn: '解释 AMCL 粒子、初始位姿、map→odom 与里程计的分工',
      do: '清理建图进程，启动 Nav2，加载地图并在 RViz 给出初始位姿',
      after: '记录一次从错误初始估计到收敛的观察结果'
    },
    prerequisite: '前置：02.04 的 YAML/PNG 已在 ~/exercises_ws/src/maps；完成 01.06，能解释 map→odom→base_link。开始前逐个检查终端并停止旧 SIM 与 MAPPING。',
    concepts: [
      {label:'KNOWN MAP', title:'已知地图定位', definition:'地图保持不变，定位系统只估计机器人在 map 坐标系中的位姿，不再修改环境栅格。', detail:'导航时若仍让 slam_toolbox 在线改图，定位与规划的参考会变化。教学路线明确切换职责：建图用 slam_toolbox，导航用 AMCL。'},
      {label:'PARTICLES', title:'粒子假设', definition:'AMCL 用许多带权重的位姿样本表示“机器人可能在哪里”，雷达与地图越匹配的粒子权重越高。', detail:'初始位姿不是要求像素级准确，而是把粒子放到正确区域和朝向附近。随后机器人轻微运动，粒子通常会进一步收敛。'},
      {label:'MAP→ODOM', title:'全局修正与连续运动', definition:'AMCL 通过 map→odom 把全局位置修正叠加到连续的 odom→base_link 上。', detail:'odom 可以缓慢漂移但不能跳；map 下的位姿允许被定位结果修正。两个发布者争用 map→odom 会导致机器人在 RViz 中跳动。'}
    ],
    chain: {
      before: '02.04 已保存静态地图',
      current: '用地图、雷达和里程计估计全局位姿',
      next: '02.06 让 Nav2 规划并执行目标',
      nodes: [
        {tag:'MAP', title:'MAP SERVER', role:'发布固定 OccupancyGrid', detail:'加载 YAML 后发布 /map，并通过 lifecycle 管理状态。地图只提供环境，不决定机器人当前在哪里。', preview:'ros2 service call /map_server/load_map ...'},
        {tag:'PRIOR', title:'/initialpose', role:'给出初始位置范围', detail:'RViz 的 2D Pose Estimate 发布位置、朝向和协方差，帮助 AMCL 把粒子放到正确区域。', preview:'RViz → 2D Pose Estimate'},
        {tag:'MATCH', title:'AMCL', role:'雷达与地图概率匹配', detail:'AMCL 使用 /scan、里程计和地图更新粒子权重，并输出 /amcl_pose。', preview:'ros2 topic echo /amcl_pose --once'},
        {tag:'TF', title:'map→odom→base_link', role:'提供导航所需全局位姿', detail:'map→odom 来自 AMCL，odom→base_link 来自里程计；Nav2 用组合后的 map→base_link 规划与控制。', preview:'ros2 run tf2_ros tf2_echo map base_link'}
      ]
    },
    lab: {
      title: '从建图模式切换到定位模式',
      intro: '先清理旧进程，再启动 nav2:=True。顺序错了最容易出现重复 TF、旧地图或 AMCL 未激活。',
      success: 'Nav2 节点激活，保存地图加载成功；给出 2D Pose Estimate 后能收到 /amcl_pose，并可查询 map 到 base_link。',
      recovery: '机器人跳动先查重复 map→odom；AMCL 无输出先查 lifecycle、/scan、地图和初始位姿；地图错位先确认加载的是当前 YAML。',
      steps: [
        {terminal:'SIM + MAPPING · ALL OLD TERMINALS', keep:'先不要启动新 Nav2', action:'停止旧仿真和 slam_toolbox，消除重复发布者', command:'界面操作：逐个旧终端按 Ctrl+C，直到 ros2 node list 不再出现旧 slam_toolbox 与重复仿真实例', expected:'旧 Launch 正常退出；没有 slam_toolbox 继续发布 map→odom。', recovery:'进程不退出时先记录 PID 与日志，再用正常终止方式处理；不要直接关闭所有 Docker 服务。', manual:true},
        {terminal:'SIM · CONTAINER · KEEP RUNNING', keep:'确认旧 SIM 与 MAPPING 已停止', action:'启动带 Nav2 的 Andino 仿真', command:'ros2 launch andino_gz andino_gz.launch.py nav2:=True', expected:'Gazebo、RViz 与 Nav2 相关节点启动；终端没有持续 lifecycle 或 map 错误。', recovery:'Nav2 包缺失时检查课程镜像；节点停在 configuring 时保留日志并检查参数与地图路径。', stop:'后续定位与导航期间保持 SIM 运行。'},
        {terminal:'INSPECT · NEW CONTAINER TERMINAL', keep:'保持 Nav2 SIM 运行', action:'加载刚保存的地图', command:'ros2 service call /map_server/load_map nav2_msgs/srv/LoadMap "{map_url: /home/user/exercises_ws/src/maps/andino_map.yaml}"', expected:'响应 result 表示加载成功，RViz 显示保存的地图，而不是空白或错误地图。', recovery:'服务不存在时检查 map_server lifecycle；RESULT_MAP_DOES_NOT_EXIST 时核对绝对路径与 YAML 的 image 字段。'},
        {terminal:'RVIZ / GUI', keep:'保持 Nav2 与地图服务运行', action:'在地图中给出机器人初始位置和朝向', command:'RViz → 2D Pose Estimate → 在机器人实际位置按下并沿朝向拖动', expected:'粒子云出现在估计附近，机器人模型与激光逐步对齐地图墙体。', recovery:'粒子在错误房间或方向相反时重新给出更准确的位姿；不要通过拖动模型假装完成定位。', manual:true},
        {terminal:'INSPECT · CONTAINER', keep:'保持 SIM；已完成初始位姿', action:'证明 AMCL 已输出全局位姿', command:'ros2 topic echo /amcl_pose --once', expected:'收到 PoseWithCovarianceStamped，header.frame_id 为 map，位置和四元数字段都有明确数值。', recovery:'无输出时检查 ros2 lifecycle get /amcl、/scan、/initialpose 与 use_sim_time。'},
        {terminal:'INSPECT · SAME TERMINAL', keep:'保持 AMCL 与里程计运行', action:'确认导航所需的完整全局 TF', command:'ros2 run tf2_ros tf2_echo map base_link', expected:'持续得到 map 到 base_link 的变换，机器人轻微运动时数值平滑变化。', recovery:'断链时分别检查 map→odom 与 odom→base_link；跳变时查重复发布者和错误初始位姿。', stop:'看到数次有效变换后按 Ctrl+C。'}
      ]
    },
    scenario: {
      title: '地图正常，但机器人模型出现在错误房间',
      symptom: 'AMCL 已 active，/scan 有数据，粒子集中在错误位置，雷达与墙体明显错位。',
      question: '最合理的第一步是什么？',
      options: [
        '在 RViz 重新给出接近真实位置和朝向的 2D Pose Estimate，再观察粒子是否收敛',
        '修改地图 PNG 的颜色',
        '同时启动 slam_toolbox 帮 AMCL 修正地图'
      ],
      correct: 0,
      correctText: '正确。系统输入具备但先验区域错误，应先修正初始位姿并观察匹配结果。',
      wrongText: '地图颜色不影响定位；同时启动 slam_toolbox 会制造职责冲突和重复 map→odom。'
    },
    checks: [
      {prompt:'AMCL 与 slam_toolbox 的核心区别是什么？', answer:'slam_toolbox 在未知环境中同时定位和改图；AMCL 在固定已知地图上只估计位姿。'},
      {prompt:'为什么必须给 2D Pose Estimate？', answer:'它把粒子放到合理区域和朝向附近，避免在整张地图中盲目搜索。'},
      {prompt:'map→odom 与 odom→base_link 分别负责什么？', answer:'前者提供全局定位修正，后者提供短时连续运动估计。'}
    ],
    after: {
      title: '定位收敛观察',
      text: '先故意把初始位姿放偏一点，再给出正确估计，比较粒子云、激光对齐和 /amcl_pose 的变化。',
      deliverable: '提交物：错误与正确两张截图，以及“什么证据说明已经收敛”的三条判断。'
    },
    next: '02.06 · Nav2 规划与控制链'
  },
  nav2_stack: {
    code: '02.06',
    category: 'NAVIGATION / PLAN AND CONTROL',
    title: '给出目标：看懂 Nav2 怎样把终点变成 /cmd_vel',
    time: 48,
    intro: 'Nav2 不是单个节点。BT Navigator 接收长任务，Planner 生成全局路径，Controller 根据局部代价地图输出速度，Gazebo DiffDrive 执行运动。本节重点是沿链路观察，而不是只看机器人有没有到达。',
    route: {
      learn: '区分 Action、全局规划、局部控制、Costmap 与底盘执行',
      do: '检查 Nav2 lifecycle 与 Action，给出目标并观察路径和 /cmd_vel',
      after: '为一次导航建立“目标—路径—控制—到达”证据链'
    },
    prerequisite: '前置：02.05 中地图加载成功、AMCL 已收敛、map→base_link 可查询。机器人周围有足够空闲区，Gazebo 保持 Play。',
    concepts: [
      {label:'NAVIGATE ACTION', title:'NavigateToPose Action', definition:'导航是可能持续数十秒、需要反馈和取消的长任务，因此使用 Action，而不是普通 Service。', detail:'RViz 的 Nav2 Goal 会向 /navigate_to_pose 发送目标；BT Navigator 组织规划、跟随、恢复和完成条件。'},
      {label:'COSTMAP', title:'代价地图', definition:'Costmap 把静态地图、雷达障碍和机器人膨胀半径组合成规划可用的风险栅格。', detail:'global costmap 支持较大范围规划，local costmap 关注机器人附近动态障碍。地图有空白不代表机器人中心一定能通过，膨胀层会保留机体安全距离。'},
      {label:'PLAN + CONTROL', title:'全局路径与局部控制', definition:'Planner 选择从起点到目标的全局路径，Controller 结合局部障碍持续计算 /cmd_vel。', detail:'路径存在不等于一定可执行。控制器还要满足转弯半径、速度限制、局部障碍和进度检查。'}
    ],
    chain: {
      before: '02.05 已得到稳定的 map→base_link',
      current: '把目标转换为路径、速度和实际运动',
      next: '02.07 诊断失败与恢复行为',
      nodes: [
        {tag:'GOAL', title:'/navigate_to_pose', role:'接收目标、反馈与取消', detail:'BT Navigator 接收 RViz 目标并执行行为树。Action 能报告当前位置反馈并支持取消。', preview:'ros2 action info /navigate_to_pose'},
        {tag:'PLAN', title:'PLANNER SERVER', role:'生成全局路径', detail:'Planner 读取全局代价地图，从当前位姿计算到目标的 path。目标在障碍中时通常无法形成有效路径。', preview:'ros2 lifecycle get /planner_server'},
        {tag:'CONTROL', title:'CONTROLLER SERVER', role:'跟随路径并避障', detail:'Controller 使用局部代价地图和机器人状态持续输出 /cmd_vel。没有有效局部轨迹时会停止或触发恢复。', preview:'ros2 lifecycle get /controller_server'},
        {tag:'ACT', title:'/cmd_vel → GAZEBO', role:'桥接并执行车轮运动', detail:'现有 Andino 仿真由 ros_gz_bridge 与 Gazebo DiffDrive 执行，不使用 diff_drive_controller。', preview:'ros2 topic echo /cmd_vel --once'}
      ]
    },
    lab: {
      title: '发送第一个可解释的导航目标',
      intro: '先证明 Nav2 节点 Active，再从 RViz 给出近距离空闲目标。目标执行时用 INSPECT 观察 Action 与 /cmd_vel。',
      success: '目标被接受，RViz 出现路径，/cmd_vel 有受限的非零速度，机器人移动并在目标附近停止。',
      recovery: '目标无路径先查地图、定位和 costmap；路径有但不动时沿 Controller → /cmd_vel → ros_gz_bridge → Gazebo Play 向下检查。',
      steps: [
        {terminal:'INSPECT · CONTAINER', keep:'保持 SIM、地图与 AMCL 运行', action:'确认全局规划节点已经 Active', command:'ros2 lifecycle get /planner_server', expected:'输出 active；若节点名称不同，先用 ros2 node list 确认实际名称。', recovery:'unconfigured/inactive 时查看 Nav2 Launch 日志、地图与参数错误，不要绕过 lifecycle 直接发目标。'},
        {terminal:'INSPECT · SAME TERMINAL', keep:'保持定位已收敛', action:'确认局部控制节点已经 Active', command:'ros2 lifecycle get /controller_server', expected:'输出 active，说明控制服务器可接收路径并计算速度。', recovery:'inactive 时检查 lifecycle manager 日志、controller plugin 与 costmap 配置。'},
        {terminal:'INSPECT · SAME TERMINAL', keep:'保持 planner 与 controller active', action:'检查导航 Action 的服务端', command:'ros2 action info /navigate_to_pose', expected:'Action server count 至少为 1，并能看到服务端节点。', recovery:'Action 不存在时检查 bt_navigator lifecycle；不要用 Service 代替长时间导航任务。'},
        {terminal:'RVIZ / GUI', keep:'保持 INSPECT 可用，目标附近必须是已知空闲区域', action:'给出一个近距离、方向明确的 Nav2 Goal', command:'RViz → Nav2 Goal → 在空闲区域按下并拖出目标朝向', expected:'RViz 显示全局/局部路径，机器人开始转向或前进；目标工具反馈已发送。', recovery:'目标立即失败时先看 Nav2 日志与 costmap；目标落在灰色未知区或障碍中时重新选择已知空闲区。', manual:true},
        {terminal:'INSPECT · CONTAINER', keep:'在目标仍执行时运行', action:'证明控制器确实输出速度', command:'ros2 topic echo /cmd_vel --once', expected:'收到 geometry_msgs/msg/Twist；运动期间 linear.x 或 angular.z 至少一项非零，抵达后回到零。', recovery:'/cmd_vel 无数据时检查 Controller 状态、路径和 Action；有数据但不动时查 ros_gz_bridge、Gazebo Play 与 /clock。'}
      ]
    },
    scenario: {
      title: '目标被接受、路径也出现，但机器人不动',
      symptom: 'RViz 有全局路径，Action 仍在执行，机器人位置不变化。',
      question: '应该怎样沿数据下游检查？',
      options: [
        '先看 /cmd_vel 是否有非零数据；有则继续查 ros_gz_bridge、Gazebo Play 和 /clock',
        '重新保存地图',
        '删除 AMCL 粒子云显示'
      ],
      correct: 0,
      correctText: '正确。规划证据已经成立，应继续检查控制输出、桥接和执行层。',
      wrongText: '地图保存和显示插件不会解释“路径存在但执行不动”，应沿路径下游收集证据。'
    },
    checks: [
      {prompt:'为什么导航目标使用 Action？', answer:'任务持续时间长，需要反馈、结果和取消；Service 不适合表达这种生命周期。'},
      {prompt:'全局路径与 /cmd_vel 之间还隔着什么？', answer:'局部代价地图、Controller、速度限制与进度检查。'},
      {prompt:'本项目 /cmd_vel 最终由谁执行？', answer:'ros_gz_bridge 把命令送入 Gazebo，由 Gazebo DiffDrive 插件驱动车轮；不使用 diff_drive_controller。'}
    ],
    after: {
      title: '导航证据时间线',
      text: '完成一次短目标，把目标发送、路径出现、/cmd_vel 非零、机器人到达和速度归零按时间排序。',
      deliverable: '提交物：五个时间点、对应证据，以及一条“路径存在但不动”的排查分支。'
    },
    next: '02.07 · 故障隔离与恢复'
  },
  recovery: {
    code: '02.07',
    category: 'FIELD DEBUG / RECOVERY',
    title: '导航失败时，不重启一切：按层找到真正卡点',
    time: 45,
    intro: '“机器人到不了目标”可能来自定位、地图、Costmap、Planner、Controller、速度桥接或仿真执行。固定排查顺序能避免在多个参数之间盲目试错。',
    route: {
      learn: '用症状区分定位失败、无路径、局部轨迹失败和执行层故障',
      do: '从传感器、TF、Action、/cmd_vel 与 Costmap 收集最小证据集',
      after: '完成一份只修改一个变量的导航故障报告'
    },
    prerequisite: '前置：02.06 至少成功完成一次短距离导航。保留一个可复现的目标，不要一看到失败就重启容器或修改多个 Nav2 参数。',
    concepts: [
      {label:'LAYERED DEBUG', title:'分层排查', definition:'按输入与依赖顺序检查：传感器/时间 → 定位/TF → Costmap → Planner → Controller → /cmd_vel → 执行。', detail:'每层都用一条可观察证据排除假设。已经证明正常的上游不需要无休止重复检查，但修复后要回归整条链。'},
      {label:'RECOVERY', title:'恢复行为', definition:'Nav2 可以清理 Costmap、旋转、等待或重新规划，帮助系统从暂时局部失败中恢复。', detail:'恢复行为不是万能修复。地图错误、定位错误或桥接失效不会因为多转几圈自动消失；应区分暂时障碍与结构性故障。'},
      {label:'CANCEL SAFELY', title:'取消与安全停止', definition:'当目标不再安全或系统行为无法解释时，应取消 Action，并确认 /cmd_vel 回到零。', detail:'只在 RViz 看到机器人停住还不够，还要确认没有遗留发布者继续发送速度。真实机器人同时需要急停可触达。'}
    ],
    chain: {
      before: '02.06 已建立目标到执行的正常证据链',
      current: '在故障时定位第一处不满足预期的层',
      next: '02.08 完成端到端综合任务',
      nodes: [
        {tag:'SENSE + TIME', title:'/scan + /clock', role:'导航输入是否更新', detail:'雷达停止或仿真暂停会让 Costmap 失去新障碍信息，控制器可能等待或失败。', preview:'ros2 topic hz /scan'},
        {tag:'LOCALIZE', title:'map→base_link', role:'机器人是否知道自己在哪', detail:'TF 断链、AMCL 发散或初始位姿错误会让 Planner 的起点不可信。', preview:'ros2 run tf2_ros tf2_echo map base_link'},
        {tag:'DECIDE', title:'ACTION + COSTMAP', role:'是否有路径和局部可行空间', detail:'目标是否接受、全局路径是否存在、局部 Costmap 是否把通道全部标成高代价。', preview:'ros2 action info /navigate_to_pose'},
        {tag:'EXECUTE', title:'/cmd_vel + BRIDGE', role:'命令是否到达车轮', detail:'非零速度已经产生却不运动时，问题下移到 ros_gz_bridge、Gazebo Play、/clock 或真实底盘安全链。', preview:'ros2 topic echo /cmd_vel --once'}
      ]
    },
    lab: {
      title: '建立导航最小诊断快照',
      intro: '对同一个失败目标按顺序采集证据。不要在采集期间改参数；只有确定第一处异常后才选择修复动作。',
      success: '能够把故障归类到传感器/时间、定位、规划、控制或执行层，并说明下一条检查为何能缩小范围。',
      recovery: '若机器人行为不安全，先取消目标并确认全零速度，再继续诊断。任何修改后都重新发送同一目标做回归。',
      steps: [
        {terminal:'INSPECT · CONTAINER', keep:'保持失败现场与 Nav2 日志', action:'确认雷达数据仍持续进入系统', command:'ros2 topic hz /scan', expected:'持续输出 average rate；记录是否稳定后按 Ctrl+C。', recovery:'无数据时先查 Gazebo Play、/clock 与雷达插件，暂时不要修改 Planner。', stop:'记录频率后按 Ctrl+C。'},
        {terminal:'INSPECT · SAME TERMINAL', keep:'保持 AMCL 与失败目标状态', action:'确认全局定位链仍连通且数值合理', command:'ros2 run tf2_ros tf2_echo map base_link', expected:'持续获得变换，位置与 RViz 中机器人所在区域相符，没有剧烈跳变。', recovery:'断链或跳变时先处理 AMCL、初始位姿、时间和重复 TF；定位恢复前不要继续调 Controller。', stop:'记录数次输出后按 Ctrl+C。'},
        {terminal:'INSPECT · SAME TERMINAL', keep:'保持 Nav2 运行', action:'确认导航 Action 服务端仍存在', command:'ros2 action info /navigate_to_pose', expected:'Action server count 至少为 1；若目标执行中，应能从 RViz 或日志看到当前状态。', recovery:'服务端消失时检查 bt_navigator lifecycle 与 Launch 日志。'},
        {terminal:'INSPECT · SAME TERMINAL', keep:'尽量在目标执行或恢复期间运行', action:'检查是否产生控制速度', command:'ros2 topic echo /cmd_vel --once', expected:'有局部轨迹时收到非零 Twist；等待、取消或到达时可能为零，需要结合目标状态解释。', recovery:'路径存在却始终无命令时检查 controller_server 与 local costmap；有非零命令却不动时下移到桥接和仿真。'},
        {terminal:'RVIZ / GUI', keep:'保留前四项记录', action:'检查全局/局部 Costmap，并在必要时安全取消目标', command:'RViz → Global Costmap / Local Costmap Status → 观察目标与机器人周围代价；必要时 Cancel Navigation', expected:'能指出目标是否在障碍/未知区、机器人周围是否被膨胀层封死；取消后机器人停止且 /cmd_vel 回零。', recovery:'显示为空先查对应 Topic 与 lifecycle；取消后仍运动时立即发送全零 Twist 并检查其他速度发布者。', manual:true}
      ]
    },
    scenario: {
      title: 'Planner 报 No valid path，机器人和定位都正常',
      symptom: '/scan 正常、map→base_link 稳定，目标点落在墙边，global costmap 显示目标被膨胀区覆盖。',
      question: '最合理的处理是什么？',
      options: [
        '把目标移到明确的空闲栅格，并检查 inflation radius 与机器人尺寸是否合理',
        '提高 /cmd_vel 速度绕过 Planner',
        '重启 AMCL 直到路径出现'
      ],
      correct: 0,
      correctText: '正确。证据已经定位到目标/Costmap 可行性，应先修正目标位置并核对膨胀参数。',
      wrongText: '定位已经稳定，提高速度或重启 AMCL 都不能让障碍中的目标变成可行路径。'
    },
    checks: [
      {prompt:'为什么不能一失败就重启所有节点？', answer:'重启会破坏现场证据，可能暂时掩盖问题，却无法说明真正根因和预防方式。'},
      {prompt:'路径存在但 /cmd_vel 一直为空，优先查哪层？', answer:'Controller、local costmap、进度检查和局部轨迹可行性。'},
      {prompt:'/cmd_vel 非零但机器人不动，问题向哪里移动？', answer:'ros_gz_bridge、Gazebo Play、/clock 与底盘执行层。'}
    ],
    after: {
      title: '单变量故障报告',
      text: '选择一个可安全复现的问题，记录预期、实际、证据、唯一修改和同一目标的回归结果。',
      deliverable: '提交物：五段式报告，以及一条没有证据时明确拒绝修改的说明。'
    },
    next: '02.08 · 模块综合导航任务'
  },
  field_assessment: {
    code: '02.08',
    category: 'MODULE CHECK / AUTONOMOUS MISSION',
    title: '综合任务：从地图文件到自主到达目标',
    time: 55,
    intro: '最后一节不再拆散知识点。你要从干净状态启动 Nav2、加载地图、完成定位、发送目标、记录路径与速度，并对一个失败分支给出证据化判断。',
    route: {
      learn: '把建图资产、定位、规划、控制和恢复串成一份可复现流程',
      do: '从干净状态完成一次自主导航并保存六层证据',
      after: '提交 Navigation Readiness Packet 作为模块成果'
    },
    prerequisite: '前置：02.01–02.07 的概念与实验已学习；andino_map.yaml/png 可读取。开始前停止所有旧 Launch，确保不会有重复的 slam_toolbox、AMCL 或仿真实例。',
    concepts: [
      {label:'CLEAN START', title:'从可控状态开始', definition:'综合验收要从已知干净状态启动，而不是依赖浏览器、终端或节点的偶然残留。', detail:'先列出要启动的终端和保持运行的进程，再按顺序执行。任何一步失败就停在该层，不能用后续画面替代缺失证据。'},
      {label:'EVIDENCE CHAIN', title:'六层证据链', definition:'地图、定位、目标、路径、控制与实际运动必须分别有证据，不能用“机器人到了”替代全部内部状态。', detail:'这样即使任务失败，也能明确最后一处正常层与第一处异常层，报告才具有复现价值。'},
      {label:'HANDOFF', title:'可交接成果', definition:'另一个新手只看你的记录，也应该能启动同一地图、完成定位并复现目标。', detail:'交付必须包含环境版本、文件路径、终端职责、命令、GUI 操作、预期证据和失败恢复。'}
    ],
    chain: {
      before: '02.01–02.07 已分别验证每个子系统',
      current: '从干净状态完成端到端自主导航',
      next: '03.01 创建第一个 ROS 2 Python 功能包',
      nodes: [
        {tag:'BOOT', title:'NAV2 SYSTEM', role:'启动地图、定位、规划与控制', detail:'唯一的 nav2:=True 仿真负责提供整套运行环境；不再同时启动 slam_toolbox。', preview:'ros2 launch andino_gz andino_gz.launch.py nav2:=True'},
        {tag:'LOCATE', title:'MAP + AMCL', role:'建立可信全局位姿', detail:'加载持久化地图，给出初始位姿，并用 /amcl_pose 与 map→base_link 双重验收。', preview:'ros2 topic echo /amcl_pose --once'},
        {tag:'NAVIGATE', title:'GOAL + PATH + CMD', role:'把意图变为运动', detail:'目标必须在已知空闲区；路径与 /cmd_vel 分别证明规划和控制已经发生。', preview:'RViz Nav2 Goal + ros2 topic echo /cmd_vel --once'},
        {tag:'REPORT', title:'RESULT + RECOVERY', role:'记录到达或第一处失败', detail:'到达后确认速度归零；失败时按 02.07 归层并记录唯一修复与回归。', preview:'Navigation Readiness Packet'}
      ]
    },
    lab: {
      title: '完成端到端自主导航验收',
      intro: '本任务要求从干净状态开始。每一步只确认真实证据；页面不模拟 ROS 2 运行结果。',
      success: '地图正确、AMCL 收敛、目标被接受、路径出现、/cmd_vel 产生、机器人到达并停止；失败分支也能被明确归层。',
      recovery: '任一层失败就停在当前步骤，按右侧终端矩阵和 02.07 的排查顺序恢复。不要删除进度或同时修改多个参数来“通过”验收。',
      steps: [
        {terminal:'SIM · CONTAINER · KEEP RUNNING', keep:'所有旧 Launch 已停止', action:'从干净状态启动 Nav2 仿真', command:'ros2 launch andino_gz andino_gz.launch.py nav2:=True', expected:'Gazebo/RViz 启动，Nav2 lifecycle manager 没有持续 ERROR。', recovery:'重复节点或端口冲突时重新检查旧终端；依赖缺失时回到容器镜像基线。', stop:'综合任务期间保持 SIM 运行。'},
        {terminal:'INSPECT · NEW CONTAINER TERMINAL', keep:'保持 SIM 运行', action:'确认关键导航节点都存在', command:'ros2 node list | grep -E "amcl|map_server|planner_server|controller_server|bt_navigator"', expected:'至少能识别 AMCL、地图服务器、规划、控制与 BT Navigator 相关节点。', recovery:'缺哪个节点就回到 SIM 日志查该 lifecycle/配置，不要因为其他节点存在就跳过。'},
        {terminal:'INSPECT · SAME TERMINAL', keep:'保持 Nav2 节点运行', action:'加载持久化地图', command:'ros2 service call /map_server/load_map nav2_msgs/srv/LoadMap "{map_url: /home/user/exercises_ws/src/maps/andino_map.yaml}"', expected:'服务响应加载成功，RViz 地图与 02.04 保存结果一致。', recovery:'路径或图像错误时核对 YAML、PNG 与挂载目录；服务不可用时检查 map_server lifecycle。'},
        {terminal:'RVIZ / GUI', keep:'保持 SIM 与地图服务运行', action:'给出初始位姿并等待雷达与地图对齐', command:'RViz → 2D Pose Estimate → 对准 Gazebo 中实际位置和朝向', expected:'粒子云收敛，机器人模型和激光与墙体对齐。', recovery:'错位时重新给出更准确估计，并检查 /scan、map→base_link 与地图版本。', manual:true},
        {terminal:'INSPECT · CONTAINER', keep:'初始位姿已设置', action:'保存定位证据', command:'ros2 topic echo /amcl_pose --once', expected:'收到 map Frame 下的 PoseWithCovarianceStamped。', recovery:'无输出时检查 AMCL lifecycle、/initialpose、/scan 与 use_sim_time。'},
        {terminal:'RVIZ / GUI', keep:'定位已经收敛，目标附近为空闲区', action:'发送一个可安全到达的 Nav2 Goal', command:'RViz → Nav2 Goal → 选择已知空闲区并拖出朝向', expected:'目标被接受，RViz 出现路径，机器人开始执行。', recovery:'目标立即失败时检查目标是否在未知区/障碍中，以及 planner_server 与 global costmap。', manual:true},
        {terminal:'INSPECT · CONTAINER', keep:'目标执行期间运行', action:'保存控制输出证据并观察最终停止', command:'ros2 topic echo /cmd_vel --once', expected:'执行期间至少一次出现非零 Twist；到达后机器人停止，后续速度回到零。', recovery:'无命令查 Controller 与 local costmap；有命令不动查 ros_gz_bridge、Gazebo Play 与 /clock。'}
      ]
    },
    scenario: {
      title: '综合故障：上层全部正常，底盘仍不动',
      symptom: '地图正确、AMCL 稳定、路径存在、/cmd_vel 有非零数据，但 Gazebo 中机器人不移动。',
      question: '证据把故障缩小到了哪里？',
      options: [
        'ros_gz_bridge、Gazebo Play、/clock 与 DiffDrive 执行层',
        'Slam Toolbox 闭环检测',
        '地图 YAML 的 free_thresh'
      ],
      correct: 0,
      correctText: '正确。目标、规划和控制输出都已证明正常，下一层是桥接、仿真时间和 Gazebo DiffDrive 执行。',
      wrongText: '当前导航使用固定地图，且 /cmd_vel 已产生；重新检查建图或地图阈值不会解释执行层静止。'
    },
    checks: [
      {prompt:'综合任务为什么必须从干净状态开始？', answer:'为了消除旧进程、重复 TF 和隐藏依赖，让另一位使用者能够按同一路线复现。'},
      {prompt:'机器人到达目标能替代内部证据吗？', answer:'不能。仍需地图、定位、路径、控制和停止证据，才能在失败时定位层级。'},
      {prompt:'最终成果怎样才算可交接？', answer:'包含环境、地图路径、终端职责、命令、GUI 操作、成功证据、失败恢复和回归结果。'}
    ],
    after: {
      title: 'Navigation Readiness Packet',
      text: '整理本模块的地图资产、启动顺序、定位证据、导航证据、一次故障报告和最终结论。',
      deliverable: '提交物：地图 YAML/PNG、六层证据链、终端拓扑、一次失败恢复，以及“下一位新手如何复现”的完整说明。'
    },
    next: '03.01 · 创建第一个 ROS 2 Python 功能包'
  }
};

window.module02Order = [
  'slam_model',
  'mapping_launch',
  'mapping_drive',
  'map_save',
  'localization',
  'nav2_stack',
  'recovery',
  'field_assessment'
];

window.module01Missions = {
  intro: {
    code: 'MISSION 01.01', category: 'FOUNDATION / MENTAL MODEL', title: 'ROS 2 到底是什么？', time: 20,
    intro: '先建立一张整体地图：ROS 2 提供通信、工具、库和软件组织方式，但它不是传统意义上的操作系统。',
    guideTitle: '01.01 · ROS 2 到底是什么', guideWhy: '先建立全局模型，后面的命令才不会变成死记硬背',
    route: ['用自己的话解释 ROS 2、DDS、Node 和 Package', '查看系统分层，再在真实容器中确认 CLI', '向没有学过 ROS 的人做 60 秒解释'],
    concepts: [['01','Framework，不是操作系统','ROS 2 是构建机器人软件的框架和约定集合，通常运行在 Linux 等操作系统之上。'],['02','DDS 负责底层通信','节点发现、序列化和网络传输主要由 DDS 中间件完成。'],['03','Package 与 Node 分工','Package 组织代码、配置和依赖；Node 是从这些代码启动后正在运行的计算单元。'],['04','工具让系统可观察','ros2 CLI、RViz、rosbag 和日志工具帮助开发者检查与调试系统。']],
    model: ['从机器人功能到运行进程','点击右侧组件，理解 ROS 2 系统从代码组织到数据通信的不同层次。'],
    lab: {title:'确认 ROS 2 命令行可用', intro:'这些命令必须在课程容器中执行。页面只提供命令、位置和预期证据，不会伪装成真实终端。', prerequisite:'前置：完成 00.02 并运行 docker exec -it robotics_essentials_ros2 bash，确认提示符已经进入容器。', success:'能够确认发行版为 humble，并找到 ros2 CLI、rclpy、rviz2 与 demo_nodes_cpp 基础包。', recovery:'如果出现 ros2: command not found，先确认已经进入课程容器，再检查 source /opt/ros/humble/setup.bash；如果 demo_nodes_cpp 或基础包缺失，回到 00.02 检查镜像是否构建完整。'},
    steps: [
      {terminal:'INSPECT · CONTAINER', command:'ros2 --help', action:'查看 ROS 2 CLI 命令组', expected:'输出中应出现 node、topic、service、action、pkg、launch 等命令组。'},
      {terminal:'INSPECT · CONTAINER', command:'printenv ROS_DISTRO', action:'确认 ROS 2 发行版', expected:'输出应为 humble。'},
      {terminal:'INSPECT · CONTAINER', command:"ros2 pkg list | grep -E '^(rclpy|rviz2|demo_nodes_cpp)$'", action:'确认后续章节需要的基础功能包存在', expected:'应看到 rclpy、rviz2 与 demo_nodes_cpp；后续节点、Topic 和 Service 实验会复用这些包。'}
    ],
    checks: [['Q1','ROS 2 是操作系统吗？','不是，它是运行在操作系统之上的机器人软件框架。'],['Q2','DDS 做什么？','负责节点发现与底层数据传输。'],['Q3','Package 和 Node 一样吗？','Package 组织代码，Node 是运行中的计算单元。']],
    after: ['60 秒解释挑战','不使用术语堆砌，向朋友解释 ROS 2 为什么能让多个程序组成一个机器人。'],
    next: '01.02 · 节点与计算图'
  },
  nodes: {
    code: 'MISSION 01.02', category: 'COMPUTATION / ROS GRAPH', title: '节点与计算图', time: 28,
    intro: '把机器人拆成职责单一的节点，并通过计算图观察它们如何连接。重点是区分进程存在、节点被发现和端点真正连接。',
    guideTitle: '01.02 · 节点与计算图', guideWhy: '先知道系统里运行了谁，才能判断数据应该从哪里来',
    route: ['列出节点、查看节点详情并读懂计算图', '使用三个终端启动并观察 talker / listener', '画出 talker 与 listener 的节点关系'],
    concepts: [['01','Node / 节点','一个运行中的计算单元，通常负责驱动、传感器处理或算法等单一职责。'],['02','Discovery / 发现','同一 ROS Domain 中的节点会自动发现彼此，不需要中央服务器。'],['03','Graph / 计算图','节点、Topic、Service 与 Action 组成的实时关系网络。'],['04','Package / 软件包','Package 负责组织代码、配置和依赖；一个 Package 可以提供多个可执行 Node。']],
    model: ['节点如何加入计算图','点击组件理解可执行程序、Node、DDS 发现与系统行为之间的关系。'],
    lab: {title:'用三个终端建立第一个计算图', intro:'talker 和 listener 都是持续运行程序，因此分别使用 TALKER、LISTENER；所有查询统一在 INSPECT 执行。', prerequisite:'前置：完成 01.01。新开两个容器终端并命名为 TALKER、LISTENER，保留原 INSPECT；如果 Andino 仿真仍在运行，SIM 终端不要关闭。三个实验终端的 ROS_DOMAIN_ID 必须一致。', success:'INSPECT 能看到 /talker 与 /listener，并能从 node info 读出 /chatter 端点。', recovery:'如果 node list 为空，先不要重启全部终端：确认 TALKER/LISTENER 仍在运行、每个终端都 source 过环境，并比较 ROS_DOMAIN_ID 是否一致。'},
    steps: [
      {terminal:'TALKER · KEEP RUNNING', command:'ros2 run demo_nodes_cpp talker', action:'启动发布节点', expected:'持续出现 Publishing: Hello World...；保持 TALKER 运行到 01.03 结束。'},
      {terminal:'LISTENER · KEEP RUNNING', command:'ros2 run demo_nodes_cpp listener', action:'启动订阅节点', expected:'持续出现 I heard: Hello World...；保持 LISTENER 运行到 01.03 结束。'},
      {terminal:'INSPECT · QUERY', command:'ros2 node list', action:'列出当前发现的节点', expected:'至少应看到 /talker 和 /listener。'},
      {terminal:'INSPECT · QUERY', command:'ros2 node info /talker', action:'查看 talker 的通信端点', expected:'Publishers 中应出现 /chatter，类型为 std_msgs/msg/String。'}
    ],
    checks: [['Q1','节点一定对应一个 Package 吗？','一个 Package 可以提供多个可执行节点。'],['Q2','为什么 node list 为空？','可能没有节点运行、终端环境未 source，或 ROS_DOMAIN_ID 不一致。'],['Q3','node info 有什么用？','查看节点发布、订阅、服务和动作端点。']],
    after: ['手绘计算图','画出 /talker → /chatter → /listener，并标注 Node、Topic 和消息类型。'],
    next: '01.03 · Topic 与消息'
  },
  topics: {
    code: 'MISSION 01.03', category: 'DATA FLOW / PUB-SUB', title: 'Topic 与消息', time: 32,
    intro: '学习 ROS 2 最常用的异步通信方式：发布者把固定类型的消息送入 Topic，订阅者独立接收。',
    guideTitle: '01.03 · Topic 与消息', guideWhy: '机器人传感器和速度指令都依赖 Topic 数据流',
    route: ['从 Topic 名称追踪到消息类型和字段', '使用 list、info、echo、interface 完成完整检查', '独立解释 /cmd_vel 为什么使用 Twist'],
    concepts: [['01','Publisher / 发布者','产生数据并写入具名 Topic，不等待订阅者响应。'],['02','Topic / 话题','具名的数据通道，所有端点必须使用相同消息类型。'],['03','Subscriber / 订阅者','监听 Topic 并在新消息到达时处理数据。'],['04','持续数据 vs 一次请求','Topic 适合连续传感器或控制数据；需要一次请求和一次结果时，使用后续章节的 Service 模型。']],
    model: ['数据如何穿过发布订阅系统','点击组件理解消息从发布端、接口、DDS 到订阅端的完整路径。'],
    lab: {title:'完成 Topic 四步侦察', intro:'按照“发现 → 类型与端点 → 一条数据 → 字段定义”的顺序检查 /chatter。', prerequisite:'前置：完成 01.02，并保持 TALKER 与 LISTENER 运行；所有查询继续在 INSPECT 执行。若演示节点已经停止，请先重新启动。', success:'能够说出 /chatter 的类型、发布订阅数量，并解释 String 的 data 字段；结束后释放 TALKER 与 LISTENER。', recovery:'如果 echo 没有输出，先用 topic info --verbose 确认发布者数量、类型和 QoS；不要因为 topic list 看得到名称就判定数据正常。'},
    steps: [
      {terminal:'INSPECT · QUERY', command:'ros2 topic list', action:'发现当前所有 Topic', expected:'列表中应出现 /chatter。'},
      {terminal:'INSPECT · QUERY', command:'ros2 topic info /chatter --verbose', action:'检查类型、端点和 QoS', expected:'类型应为 std_msgs/msg/String，并显示 talker 发布端与 listener 订阅端。'},
      {terminal:'INSPECT · QUERY', command:'ros2 topic echo /chatter --once', action:'读取一条真实消息', expected:'应看到 data: Hello World...。'},
      {terminal:'INSPECT · QUERY', command:'ros2 interface show std_msgs/msg/String', action:'查看消息字段定义', expected:'应看到 string data。确认后回到 TALKER、LISTENER 分别按 Ctrl+C，释放两个终端。'}
    ],
    checks: [['Q1','Topic 中能混用消息类型吗？','不能，发布与订阅端类型必须一致。'],['Q2','echo 没输出先查什么？','先检查发布者数量、QoS 和 Topic 是否真的有数据。'],['Q3','为什么 Topic 不适合一次性请求？','Topic 更适合持续数据流；需要一次请求和一次响应时，后面的 Service 章节会提供对应模型。']],
    after: ['释放演示节点，再预习 /cmd_vel','确认 TALKER 与 LISTENER 已按 Ctrl+C 停止；然后在 INSPECT 使用 topic info 和 interface show，写出 Twist 中控制前进与旋转的字段。'],
    next: '01.04 · 控制 Andino 底盘'
  },
  control: {
    code: 'MISSION 01.04', category: 'PRACTICAL LAB / ACTUATION', title: '控制 Andino 底盘', time: 45,
    intro: '把消息接口知识变成真实动作：检查 /cmd_vel，持续发布 Twist，并安全地控制机器人前进、旋转和停止。',
    guideTitle: '01.04 · 控制 Andino 底盘', guideWhy: '第一次把 ROS 2 数据流连接到机器人执行机构',
    route: ['理解 linear.x、angular.z 与差速底盘的关系', '持续发送低速命令并主动停止', '独立完成前进、左转、停止组合动作'],
    concepts: [['01','Twist / 速度消息','linear 描述平移速度，angular 描述旋转速度。移动底盘主要使用 x 与 z。'],['02','Differential Drive','左右轮速度差产生转向，相同轮速产生直线运动。'],['03','Safety / 安全停止','真实机器人测试必须保留急停，并准备全零 Twist 停止指令。'],['04','Watchdog / 命令超时','不同控制器的超时策略不一样；实验中主动发送全零 Twist，才能明确表达停止。']],
    model: ['命令如何到达左右车轮','从速度发布端经过 /cmd_vel、ros_gz_bridge 和 Gazebo DiffDrive 系统插件，最终转换为左右轮速度。'],
    lab: {title:'发送可观察、可停止的运动序列', intro:'运动命令使用 --rate 10 持续发布。观察约 2 秒后按 Ctrl+C，再发送全零 Twist。', prerequisite:'前置：SIM 中的 Andino Launch 仍在运行且 Gazebo 已 Play；完成 01.03 的 Topic 侦察方法。本节第 1 步会实际检查 /cmd_vel。确认场地安全，真实机器人必须可立即急停。', success:'机器人能低速前进和原地旋转，并在零速度指令后停止。', recovery:'如果 /cmd_vel 有订阅者但机器人不动，先停止发布，再检查 Gazebo 是否 Play、/clock 是否更新、ros_gz_bridge 是否存在；当前 Andino 仿真不使用 ros2_control，不要运行控制器列表命令。'},
    steps: [
      {terminal:'INSPECT · QUERY', command:'ros2 topic info /cmd_vel --verbose', action:'确认速度 Topic 类型和订阅端', expected:'类型应为 geometry_msgs/msg/Twist，并至少看到 ros_gz_bridge / parameter_bridge 相关订阅端。'},
      {terminal:'COMMAND · CTRL+C AFTER 2S', command:'ros2 topic pub --rate 10 /cmd_vel geometry_msgs/msg/Twist "{linear: {x: 0.2}}"', action:'持续发送低速前进命令', expected:'机器人应持续低速前进；约 2 秒后按 Ctrl+C。'},
      {terminal:'COMMAND · CTRL+C AFTER 2S', command:'ros2 topic pub --rate 10 /cmd_vel geometry_msgs/msg/Twist "{angular: {z: 0.5}}"', action:'持续发送原地左转命令', expected:'机器人应原地左转；约 2 秒后按 Ctrl+C。'},
      {terminal:'COMMAND · SAFETY STOP', command:'ros2 topic pub --once /cmd_vel geometry_msgs/msg/Twist "{}"', action:'主动发送全零停止指令', expected:'所有 Twist 字段为 0，机器人停止。'}
    ],
    checks: [['Q1','前进使用哪个字段？','linear.x，正值通常表示向前。'],['Q2','左转使用哪个字段？','angular.z，遵循右手坐标系。'],['Q3','为什么运动序列最后要发送全零 Twist？','控制器超时策略不同，主动发送零速度比只退出发布程序更明确、更安全。']],
    after: ['组合动作挑战','让 Andino 前进、左转约 90°，再安全停止，并记录每个 Twist 字段。'],
    next: '01.05 · RViz 传感器世界'
  },
  rviz: {
    code: 'MISSION 01.05', category: 'VISUALIZATION / SENSOR DATA', title: 'RViz 传感器世界', time: 35,
    intro: '把 ROS 2 数据变成可观察的工程画面：添加 Camera、检查 LaserScan，并理解 Fixed Frame。',
    guideTitle: '01.05 · RViz 传感器世界', guideWhy: '能看见数据，才能快速判断 Topic、QoS 或 TF 哪一层出错',
    route: ['识别 Displays、3D View 与 Fixed Frame', '按参考课程步骤添加 Camera 并检查状态', '保存自己的机器人监控布局'],
    concepts: [['01','Display / 显示插件','每个 Display 负责订阅并解码一种 ROS 2 数据。'],['02','Fixed Frame','所有数据最终转换到的参考坐标，常用 map、odom 或 base_footprint。'],['03','Status / 状态','绿色表示正常，黄色表示警告，红色通常指向 Topic、类型或 TF 错误。'],['04','frame_id / 数据来源','消息里的 frame_id 说明数据在哪个坐标系产生；RViz 需要用 TF 把它转换到 Fixed Frame。']],
    model: ['RViz 如何得到最终画面','Topic 提供数据，Display 负责解析，TF 将数据转换到 Fixed Frame。'],
    lab: {title:'验证传感器可视化链路', intro:'本节同时包含终端检查和 RViz 界面操作；手动步骤没有可复制命令。', prerequisite:'前置：SIM 中的 Andino Launch 正在运行，Gazebo 已解除暂停，RViz 窗口已经打开；INSPECT 可用于查询。', success:'Camera 能显示 /image_raw，Fixed Frame 改为 odom 后机器人相对 odom 运动，状态保持 OK。', recovery:'如果 RViz 出现红色 Status，先展开并复制原始错误，再按 Topic → QoS → frame_id → TF → Fixed Frame 顺序检查；不要先重装显卡驱动。'},
    steps: [
      {terminal:'INSPECT · QUERY', command:'ros2 topic hz /scan', action:'确认雷达持续发布', expected:'应持续输出稳定频率；按 Ctrl+C 停止。'},
      {terminal:'RVIZ · MANUAL STEP', manual:true, action:'添加 Camera 显示', command:'Add → By topic → /image_raw → Camera', expected:'Displays 中出现 Camera，Status 为 OK，并显示模拟相机图像。'},
      {terminal:'RVIZ · MANUAL STEP', manual:true, action:'切换 Fixed Frame', command:'Global Options → Fixed Frame → odom', expected:'移动机器人时，它应相对 odom 网格移动，而不是始终固定在中心。'},
      {terminal:'INSPECT · QUERY', command:'ros2 run tf2_ros tf2_echo odom rplidar_laser_link', action:'确认雷达坐标可变换到 odom', expected:'应持续输出 Translation 与 Rotation；按 Ctrl+C 停止。'}
    ],
    checks: [['Q1','RViz 是仿真器吗？','不是，它只订阅和显示 ROS 2 数据。'],['Q2','No transform 先查什么？','Fixed Frame、消息 frame_id 和 TF 链。'],['Q3','绿色 Status 能证明数据物理正确吗？','不能，它主要证明订阅、类型和坐标转换当前可用。']],
    after: ['保存调试布局','创建包含 Grid、RobotModel、LaserScan、Camera、TF 的 RViz 配置并保存。'],
    next: '01.06 · TF 时间与变换调试'
  },
  transforms: {
    code: 'MISSION 01.06', category: 'SPATIAL DATA / TF2', title: 'TF 时间与变换调试', time: 38,
    intro: 'TF 不只描述空间关系，还带有时间。你会区分静态和动态变换，理解 Buffer，并排查 extrapolation 错误。',
    guideTitle: '01.06 · TF 时间与变换调试', guideWhy: '导航、传感器融合和 RViz 都依赖正确时间上的坐标变换',
    route: ['区分静态 TF、动态 TF 与时间戳', '使用 tf2_echo 和 view_frames 检查坐标树', '定位 No transform 与 extrapolation 错误'],
    concepts: [['01','Static Transform','安装后不变化的传感器位置，发布到 /tf_static。'],['02','Dynamic Transform','随机器人运动持续更新的关系，例如 odom → base_link。'],['03','TF Buffer','保存一段时间内的变换历史，用于查询消息时间点的坐标关系。'],['04','一棵树一个父节点','同一个 Child Frame 在同一时刻只能有一个 Parent；重复发布会让空间关系产生歧义。']],
    model: ['坐标树如何随时间更新','/tf 与 /tf_static 传输关系，TF Buffer 按时间缓存并回答变换查询。'],
    lab: {title:'完成 TF 三项诊断', intro:'先生成整棵树，再观察单条实时变换，最后检查动态 TF 频率。', prerequisite:'前置：SIM 中的 Andino 仿真正在运行并解除暂停，已完成 01.05 的 Fixed Frame 检查。', success:'能够确认 odom → base_link → second_base_link → rplidar_laser_link 连通，并指出动态与静态边分别来自哪里。', recovery:'如果出现 No transform 或 extrapolation，先保留错误中的 Frame 和时间关键词，再检查 /clock、use_sim_time、父子 Frame 和 TF 发布者。'},
    steps: [
      {terminal:'INSPECT · QUERY', command:'ros2 run tf2_tools view_frames', action:'生成完整 TF 树', expected:'当前目录生成 frames.pdf；图中应能找到 odom、base_link、second_base_link 与 rplidar_laser_link。'},
      {terminal:'INSPECT · QUERY', command:'ros2 run tf2_ros tf2_echo odom base_link', action:'查看动态里程计变换', expected:'应持续输出随运动变化的 Translation 与 Rotation；按 Ctrl+C 停止。'},
      {terminal:'INSPECT · QUERY', command:'ros2 topic hz /tf', action:'确认动态 TF 持续更新', expected:'应持续输出非零更新频率；按 Ctrl+C 停止。'}
    ],
    checks: [['Q1','传感器安装位置用哪种 TF？','通常使用静态变换。'],['Q2','Extrapolation 表示什么？','查询时间超出 Buffer 中可用变换范围。'],['Q3','TF 树能有两个父节点吗？','同一 Child Frame 在同一时刻只能有一个 Parent。']],
    after: ['故意制造并排查断链','修改一个 Frame 名称使 RViz 报错，然后用 view_frames 找到断点并修复。'],
    next: '01.07 · 服务与客户端'
  },
  services: {
    code: 'MISSION 01.07', category: 'REQUEST / RESPONSE', title: '服务与客户端', time: 30,
    intro: '当任务需要明确的一次请求和一次结果时，使用 Service。本节使用 ROS 2 官方 demo 服务，不依赖不存在的仿真重置接口。',
    guideTitle: '01.07 · 服务与客户端', guideWhy: '一次性请求需要可确认的响应，不能只依赖连续 Topic 数据流',
    route: ['判断何时使用 Topic 或 Service', '启动 AddTwoInts 服务并检查接口', '发起一次请求并读取响应结果'],
    concepts: [['01','Service Server','提供具名功能，收到请求后执行并返回响应。'],['02','Service Client','构造请求并等待对应服务端返回结果。'],['03','Request / Response','适合短时、明确的请求响应；长任务通常使用 Action。'],['04','如何选择通信方式','连续传感器数据用 Topic；一次请求一次结果用 Service；需要反馈和取消的长任务用 Action。']],
    model: ['一次服务调用如何完成','客户端通过 DDS 发现服务端，发送 Request，并接收与请求对应的 Response。'],
    lab: {title:'启动并调用自包含演示服务', intro:'服务端是持续运行程序，使用 SERVER；CLIENT 用来检查类型并发起调用。', prerequisite:'前置：完成 01.01 的基础包检查。打开两个课程容器终端并命名为 SERVER、CLIENT，确认 demo_nodes_cpp 已安装。', success:'调用 /add_two_ints 后得到 sum: 5，并能解释 Request 与 Response 字段；完成后在 SERVER 按 Ctrl+C。', recovery:'如果服务名称存在但调用等待，先确认 SERVER 进程和回调日志，再检查服务类型是否完全一致；不要无限等待，也不要把同一个请求改成 Topic。'},
    steps: [
      {terminal:'SERVER · KEEP RUNNING', command:'ros2 run demo_nodes_cpp add_two_ints_server', action:'启动服务端', expected:'SERVER 保持运行并等待请求。'},
      {terminal:'CLIENT · QUERY', command:'ros2 service type /add_two_ints', action:'查看服务类型', expected:'应输出 example_interfaces/srv/AddTwoInts。'},
      {terminal:'CLIENT · QUERY', command:'ros2 interface show example_interfaces/srv/AddTwoInts', action:'查看请求与响应字段', expected:'--- 上方包含 int64 a、int64 b，下方包含 int64 sum。'},
      {terminal:'CLIENT · CALL', command:'ros2 service call /add_two_ints example_interfaces/srv/AddTwoInts "{a: 2, b: 3}"', action:'发起请求', expected:'响应中应出现 sum: 5；确认后回到 SERVER 按 Ctrl+C。'}
    ],
    checks: [['Q1','传感器数据用 Service 吗？','不用，连续数据更适合 Topic。'],['Q2','服务端不在线会怎样？','客户端无法完成调用，需要等待或处理超时。'],['Q3','长时间导航用 Service 吗？','通常使用支持反馈和取消的 Action。']],
    after: ['设计一个检查电池服务','写出服务名、请求字段、响应字段，并解释为什么不用 Topic。'],
    next: '01.08 · 模块综合验收'
  },
  assessment: {
    code: 'MISSION 01.08', category: 'MODULE ASSESSMENT', title: '通信基础综合验收', time: 50,
    intro: '把节点、Topic、消息、TF、RViz 与 Service 组合成一套可执行的排查流程。',
    guideTitle: '01.08 · 模块综合验收', guideWhy: '真正掌握意味着能在陌生故障中选择正确工具，而不是记住答案',
    route: ['从症状判断通信、坐标或服务问题', '独立执行完整系统检查', '输出一份可复用的机器人调试报告'],
    concepts: [['01','Observe First','先收集 node、topic、status 和日志证据，再修改系统。'],['02','Isolate Layers','按进程、数据、接口、QoS、TF 的顺序缩小范围。'],['03','Verify Recovery','修复后重复原始测试，确认问题真正消失。'],['04','调试报告要可复现','写下环境、命令、输出、判断、修复和回归结果，让别人能按同一路径复查。']],
    model: ['机器人故障如何逐层隔离','从 Node 是否存在，到 Topic 是否有数据，再到类型、QoS、TF 与消费者状态。'],
    lab: {title:'执行五步健康检查', intro:'不要照抄示例输出；每一步都要保存你自己环境中的真实结果。', prerequisite:'前置：完成 00.05 环境验收以及 01.01～01.07 的通信练习。Andino 仿真正在运行，Gazebo 已解除暂停；准备一个文本文件记录命令、输出和判断。', success:'提交节点、控制 Topic、雷达频率、TF 与 Service 五项真实证据。', recovery:'任何一项失败都要保留命令、完整输出和判断，先修复对应层，再从失败命令开始重做；不能用上游成功结果替代下游证据。'},
    steps: [
      {terminal:'INSPECT · REPORT', command:'ros2 node list', action:'确认核心节点存在', expected:'记录 robot_state_publisher，以及 ros_gz_bridge / parameter_bridge 相关节点的实际名称。'},
      {terminal:'INSPECT · REPORT', command:'ros2 topic info /cmd_vel --verbose', action:'确认控制端点', expected:'记录消息类型、发布者、订阅者与 QoS。'},
      {terminal:'INSPECT · REPORT', command:'ros2 topic hz /scan', action:'确认传感器频率', expected:'记录稳定后的平均频率，再按 Ctrl+C。'},
      {terminal:'INSPECT · REPORT', command:'ros2 run tf2_ros tf2_echo odom rplidar_laser_link', action:'确认空间链路', expected:'记录一组 Translation / Rotation，再按 Ctrl+C。'},
      {terminal:'INSPECT · REPORT', command:'ros2 service list -t | head -20', action:'确认请求响应接口', expected:'记录至少一个服务名称与类型。'}
    ],
    checks: [['Q1','机器人不动的排查顺序？','SIM 与桥接节点 → /cmd_vel 端点和内容 → Gazebo Play 与 /clock → odom 反馈。'],['Q2','RViz 红色先做什么？','展开 Status，按原始错误检查 Topic、QoS 或 TF。'],['Q3','修复后如何验收？','重复原始失败测试并记录恢复证据。']],
    after: ['提交模块调试报告','写出环境信息、五项检查结果、一个故障案例及修复验证。'],
    next: '02.01 · SLAM 基础与建图准备'
  }
};

window.module01Order = Object.keys(window.module01Missions);

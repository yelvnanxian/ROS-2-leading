window.missionExtensions = {
  intro: {
    details: [
      'ROS 2 还规定了包结构、参数、日志、Launch 与生命周期等工程约定，因此它不仅是一套消息总线。',
      'DDS 通过 Participant、Writer 与 Reader 建立端点；ROS 2 在其上封装了更适合机器人开发的 Node、Topic 和 Service。',
      '可观察性是分布式系统的基本能力。不能被 node list、topic info 或日志证明的状态，不应只凭界面猜测。',
      'Package、Launch、CLI、RViz 与 rosbag 分别负责组织、编排、检查、显示和记录。把这些工具放回职责链中，才能知道故障时应该先打开哪一种证据。'
    ],
    model: [
      ['SOURCE','PACKAGE','组织代码','Package / 功能包','保存源码、配置、Launch 与依赖声明；它是代码组织单位，不是运行进程。'],
      ['RUNTIME','NODE','执行职责','Node / 节点','Package 中的可执行程序启动后成为节点，节点通过名称加入 ROS Graph。'],
      ['MIDDLEWARE','DDS','发现传输','DDS / 中间件','负责发现、序列化和跨进程传输，并通过 QoS 控制通信策略。'],
      ['SYSTEM','ROBOT','协同能力','Robot / 系统行为','多个节点以稳定接口组合，形成感知、控制、定位和规划能力。']
    ],
    deep: [
      ['WHY IT EXISTS','为什么机器人软件需要通信框架？','传感器、驱动和算法的频率、语言与运行设备都不同。ROS 2 把这些差异隔离，让组件依赖接口而不是彼此的内部实现。','判断是否掌握','你能解释“为什么不把所有功能写进一个程序”，才算建立了分布式思维。'],
      ['HOW IT WORKS','ROS 2 调用链实际分成几层？','应用代码调用 rclcpp 或 rclpy，客户端库进入 rcl，再由 rmw 适配具体 DDS 实现。更换 DDS 时，上层节点代码通常无需重写。','继续追问','遇到通信问题时，要判断故障在应用、ROS 接口、RMW 还是网络发现层。'],
      ['COMMON PITFALL','ROS 2 不是 Ubuntu 的替代品','ROS 2 依赖操作系统提供进程、网络、设备与文件系统。安装了 Ubuntu 不等于安装了 ROS 2，安装 ROS 2 也不代表机器人应用已经运行。','新手自检','分别说出 OS、ROS 2、Package 和 Node 的职责，不要把它们混成一个概念。'],
      ['FIELD APPLICATION','一台移动机器人如何拆分？','雷达驱动发布 /scan，定位节点消费 /scan 并发布位姿，规划节点计算路径，底盘控制器消费 /cmd_vel。每个组件可以独立替换和重启。','工程价值','接口稳定后，仿真雷达与真实雷达可以服务同一个定位节点。']
    ],
    trace: ['一条 ROS 2 数据如何建立连接','从代码创建消息开始，追踪到另一个节点收到数据。每一层都有不同的检查工具。',[
      ['PRODUCER','创建消息','发布节点','节点按消息类型创建数据并调用 publish；此时数据仍在进程内。','ros2 node info /publisher'],
      ['INTERFACE','约束结构','消息接口','例如 std_msgs/msg/String 规定 data 字段和序列化结构，双方类型必须一致。','ros2 interface show std_msgs/msg/String'],
      ['DDS GRAPH','发现传输','DDS 端点匹配','发布端与订阅端根据名称、类型、Domain 和 QoS 匹配，再完成传输。','ros2 topic info /chatter --verbose'],
      ['CONSUMER','触发回调','订阅节点','数据到达订阅队列后触发回调；处理过慢可能造成排队或丢弃。','ros2 topic echo /chatter --once']
    ]],
    scenario: ['同名 Topic 却没有数据','两个节点都在运行，发布者和订阅者都声称使用 /chatter。请选择最有效的第一项证据。','node list 能看到 /talker 与 /listener，但 listener 没有输出。',['立刻重装 ROS 2','运行 ros2 topic info /chatter --verbose 检查类型、端点与 QoS','把两个节点合并成一个程序'],1,'正确。先证明端点是否真正匹配，再决定检查 Domain、类型还是 QoS。','这个动作会跳过关键证据。分布式故障应先检查计算图中的端点状态。']
  },
  nodes: {
    details: [
      '节点应围绕单一职责设计，但“单一”不是越小越好；边界应兼顾故障隔离、数据复制成本与部署方式。',
      '发现依赖 ROS_DOMAIN_ID、网络多播或发现服务器。节点存在但互相不可见，常常是 Domain 或网络隔离问题。',
      '计算图是实时状态，不是静态架构图。节点重启、重映射或生命周期切换都会改变图。',
      'Package 是代码与依赖的组织单位，Executable 是启动入口，Node 才是加入计算图的运行实体。一个 Package 可以提供多个可执行程序，也可以启动多个节点实例。'
    ],
    model: [
      ['BINARY','EXECUTABLE','启动入口','Executable / 可执行程序','ros2 run 通过 Package 与可执行名找到程序；同一个程序可以使用不同参数启动多次。'],
      ['PROCESS','NODE','加入计算图','Node / 节点','节点以唯一名称注册端点。重名节点会让调试和参数操作产生歧义。'],
      ['DISCOVERY','GRAPH','自动发现','ROS Graph / 计算图','DDS 发现把节点、Topic、Service 与 Action 的端点关系汇总为实时计算图。'],
      ['BEHAVIOR','SYSTEM','协作输出','Robot Behavior / 行为','当节点之间的端点匹配并持续交换数据，系统才真正产生机器人能力。']
    ],
    deep: [
      ['WHY IT EXISTS','为什么要把功能拆成节点？','驱动、感知和控制有不同的更新频率与故障模式。拆分后可以独立重启、复用和部署，也便于定位是谁停止了输出。','边界原则','优先按职责和故障边界拆分，不要为了节点数量而拆分。'],
      ['HOW IT WORKS','节点怎样出现在计算图里？','节点初始化 Context，创建 DDS Participant 和通信端点。发现协议交换元数据后，ros2 node list 才能看到它。','重要区别','“进程存在”和“节点被发现”是两份不同证据。'],
      ['COMMON PITFALL','不要用节点名猜功能','节点名可以重映射，可执行文件也能启动多个命名空间实例。调试时应使用 node info 查看实际端点。','命名建议','真实项目使用命名空间区分 robot_1、robot_2 或 sensor/front。'],
      ['FIELD APPLICATION','多机器人为何需要命名空间？','两台 Andino 都可能有 base_controller 和 /scan。通过 /robot_1 与 /robot_2 命名空间隔离端点，避免数据串线。','现场检查','先列节点，再检查完全限定名和 ROS_DOMAIN_ID。']
    ],
    trace: ['节点从启动到参与通信','依次查看进程被启动、节点注册、端点加入和计算图产生数据。',[
      ['EXECUTABLE','创建进程','启动可执行程序','ros2 run 找到安装空间中的可执行入口并启动操作系统进程。','ros2 pkg executables demo_nodes_cpp'],
      ['NODE INIT','注册身份','创建节点名称','节点初始化名称、命名空间、参数服务和日志发布端点。','ros2 node list'],
      ['ENDPOINTS','声明接口','创建 Publisher / Subscriber','节点创建端点，声明自己发布或订阅的 Topic 类型与 QoS。','ros2 node info /talker'],
      ['LIVE GRAPH','形成连接','端点成功匹配','listener 被发现并订阅 /chatter 后，计算图与真实数据流同时成立。','ros2 topic info /chatter']
    ]],
    scenario: ['节点明明启动却找不到','终端显示 talker 正在输出日志，但另一个终端 ros2 node list 为空。请选择第一步。','talker 进程仍在运行，但检查终端看不到任何节点。',['检查两个终端的 ROS_DOMAIN_ID 和是否 source 同一 ROS 环境','反复重启电脑直到出现','直接修改 talker 源码'],0,'正确。先验证环境与 Domain 是否一致，这是“进程存在但发现失败”的高概率原因。','当前还没有证据表明节点源码有错，应先排除终端环境与发现域。']
  },
  topics: {
    details: [
      '发布者只负责写入，不知道有多少订阅者正在处理，因此 Topic 适合连续、松耦合的数据流。',
      'Topic 名称只是通道标识，消息类型才定义字段。类型相同仍不够，QoS 也必须兼容。',
      '订阅回调处理过慢会让队列积压；History、Depth 和 Reliability 决定保留或丢弃策略。',
      '选择通信方式时先问数据是否持续、是否必须返回结果、是否需要进度与取消：持续流用 Topic，短请求用 Service，长任务通常用 Action。'
    ],
    model: [
      ['SOURCE','PUBLISHER','产生数据','Publisher / 发布端','传感器或控制节点创建消息，以指定频率调用 publish。'],
      ['CONTRACT','MESSAGE','定义字段','Message Interface / 消息接口','消息类型固定字段、单位和嵌套结构，是发布订阅双方共同遵守的契约。'],
      ['CHANNEL','TOPIC + DDS','匹配端点','Topic / 传输通道','名称、类型、Domain 与 QoS 共同决定端点能否匹配。'],
      ['SINK','SUBSCRIBER','执行回调','Subscriber / 订阅端','接收队列中的消息触发回调，延迟与丢包还受处理速度影响。']
    ],
    deep: [
      ['WHY IT EXISTS','为什么传感器流适合 Topic？','雷达不断产生新扫描，消费者只关心持续到达的数据，不需要每帧都返回确认。发布者与订阅者可独立启动。','选择标准','连续、多消费者、无需逐条响应的数据优先考虑 Topic。'],
      ['HOW IT WORKS','名称、类型和 QoS 如何匹配？','DDS 只有在 Topic 名称、数据类型与兼容 QoS 同时满足时才建立连接。ros2 topic info --verbose 可查看端点详情。','排查顺序','list 找名字，info 找类型和端点，echo 看内容，hz 看持续性。'],
      ['COMMON PITFALL','echo 无输出不等于没有 Topic','Topic 可能只有订阅者没有发布者，也可能使用不兼容 QoS，或消息频率极低。先看 Publisher count。','证据意识','区分“Topic 名存在”与“数据正在流动”。'],
      ['FIELD APPLICATION','/cmd_vel 和 /scan 有什么不同？','两者都是 Topic，但 /cmd_vel 是低带宽控制指令，/scan 是高频传感器数组；可靠性和队列深度应按用途选择。','工程判断','QoS 没有全局最优，只有与数据特性匹配。']
    ],
    trace: ['跟踪 /scan 的一帧数据','从激光插件采样到导航节点消费，观察接口与 QoS 在何处生效。',[
      ['LASER','采样环境','雷达生产者','Gazebo 插件或真实驱动生成一帧距离数组，并填写时间戳与 frame_id。','ros2 topic hz /scan'],
      ['LASERSCAN','约束字段','sensor_msgs/LaserScan','angle_min、increment 和 ranges 共同描述扫描；单位通常是弧度和米。','ros2 interface show sensor_msgs/msg/LaserScan'],
      ['DDS QOS','传输队列','Sensor Data QoS','高频数据常用 Best Effort 和较浅队列，避免旧数据积压。','ros2 topic info /scan --verbose'],
      ['NAV NODE','消费最新帧','订阅回调','定位或避障节点读取 ranges，并借助 TF 把 laser frame 转换到目标坐标。','ros2 topic echo /scan --once']
    ]],
    scenario: ['Topic 存在但 echo 一直等待','/scan 出现在 topic list 中，但 echo 没有任何一帧数据。先做什么？','ros2 topic list 能看到 /scan，RViz 的 LaserScan 显示为空。',['运行 ros2 topic info /scan --verbose，确认发布者数量和 QoS','先把 RViz 背景改亮','创建另一个同名空 Topic'],0,'正确。先判断有没有发布端以及 QoS 是否兼容，再检查仿真暂停或驱动状态。','界面设置不能证明数据流状态；创建同名 Topic 还会增加干扰。']
  },
  control: {
    details: [
      'Twist 表达机体期望速度而非轮速。当前 Andino 仿真由 Gazebo DiffDrive 系统插件依据轮距与轮径，把 linear.x、angular.z 转成左右轮目标速度。',
      '差速运动学中 v_left = v - ωL/2，v_right = v + ωL/2；L 为轮距。原地转向时两轮速度大小相等、方向相反。',
      '真实底盘测试必须先清空运动区域、确认急停可触达，再从低速开始。安全停止是控制流程的一部分，不是实验结束后的补充动作。',
      'Watchdog 会在一段时间收不到新命令时停止执行，但不同底盘的超时时间和策略不同。因此每个运动序列仍要主动发送全零 Twist，并观察 odom 与机器人动作都已停止。'
    ],
    model: [
      ['OPERATOR','TELEOP','生成意图','Teleop / 控制端','键盘、手柄或导航节点把运动意图转换成 geometry_msgs/Twist。'],
      ['COMMAND','/CMD_VEL','速度接口','Twist / 速度命令','linear.x 控制前后，angular.z 控制偏航；其他字段对常见平面底盘通常为零。'],
      ['CONTROL','GAZEBO DIFFDRIVE','运动学换算','Gazebo DiffDrive 插件','ros_gz_bridge 把 /cmd_vel 送入仿真后，插件根据轮距、轮径和限速换算左右轮速度。'],
      ['ACTUATOR','WHEELS','执行运动','Wheel Actuators / 车轮','电机驱动车轮，同时编码器反馈里程计，闭合控制与估计链路。']
    ],
    deep: [
      ['WHY IT EXISTS','为什么不直接发布左右轮转速？','上层规划只关心机器人怎么移动，不应依赖具体轮距和电机接口。Twist 形成通用机体速度契约。','接口解耦','更换底盘控制器时，导航节点仍可继续发布 /cmd_vel。'],
      ['HOW IT WORKS','Twist 如何变成差速轮速？','速度消息先经 ros_gz_bridge 进入 Gazebo，再由 DiffDrive 系统插件结合 linear.x、angular.z、轮距和轮径计算左右轮目标。','观察重点','机器人不动时依次区分 /cmd_vel、桥接、Gazebo 播放状态和车轮执行四层。'],
      ['COMMON PITFALL','--once 只发送一帧','很多控制器需要持续命令，单帧可能很快被 watchdog 清零。实验动作要明确持续时间，并始终安排停止指令。','安全规则','速度先低后高，场地先清空，急停始终可触达。'],
      ['FIELD APPLICATION','导航系统如何接入底盘？','局部规划器持续发布 /cmd_vel；当前仿真由 ros_gz_bridge 与 Gazebo DiffDrive 插件执行，里程计和 TF 再把运动结果反馈给定位与规划。','闭环思维','命令发出不等于动作完成，还要观察 odom 和真实位移。']
    ],
    trace: ['一条 Twist 如何驱动车轮','从操作指令到左右轮执行，逐层确认消息、桥接与仿真执行状态。',[
      ['SOURCE','产生目标','速度发布端','键盘、规划器或 ros2 topic pub 创建 Twist，并限制到安全速度范围。','ros2 topic info /cmd_vel --verbose'],
      ['/CMD_VEL','传递命令','控制 Topic','geometry_msgs/Twist 把机体线速度和角速度送到 ros_gz_bridge 订阅端。','ros2 topic echo /cmd_vel --once'],
      ['ROS_GZ_BRIDGE','桥接命令','ROS ↔ Gazebo 桥','桥接节点把 ROS 2 的 /cmd_vel 转给 Gazebo Transport；本项目不使用 ros2_control。',"ros2 node list | grep -E 'bridge|gz'"],
      ['WHEELS + ODOM','执行反馈','插件、车轮与里程计','Gazebo DiffDrive 插件驱动车轮并产生 odom，TF 随之更新 odom → base_link。','ros2 topic echo /odom --once']
    ]],
    scenario: ['命令正常但机器人不动','/cmd_vel 能 echo 到非零 Twist，机器人仍保持静止。下一步最合理的是？','linear.x 为 0.2，Topic 有订阅者，但 Gazebo 中车轮不转。',['继续提高 linear.x 到 5.0','先停止命令，再检查 Gazebo 是否 Play、/clock 是否更新，以及 ros_gz_bridge 是否仍在运行','删除 /cmd_vel Topic'],1,'正确。消息已经产生，下一层应验证仿真时间、桥接节点和 Gazebo 执行状态；当前 Andino 仿真不使用 ros2_control。','提高速度会扩大风险，也不能证明桥接和仿真是否在工作。']
  },
  rviz: {
    details: [
      'Display 是数据消费者。绿色状态只证明该 Display 当前能接收并转换数据，不代表数据物理上正确。',
      'Fixed Frame 是所有显示数据的共同参考系。选择 map、odom 或 base_link 会改变观察含义，而不是修改原始数据。',
      'RViz 的红色 Status 通常已经给出原始原因，例如 Topic 不存在、QoS 不兼容或找不到消息时间点的 TF。',
      'frame_id 告诉 RViz 数据最初在哪个坐标系产生。显示一帧数据必须同时具备消息、时间戳、有效 frame_id，以及该 Frame 到 Fixed Frame 的完整 TF 路径。'
    ],
    model: [
      ['DATA','TOPIC','提供观测','ROS Topic / 数据源','LaserScan、Image 和 Marker 等消息提供原始观测与时间戳。'],
      ['PLUGIN','DISPLAY','解析消息','RViz Display / 插件','每种 Display 订阅特定类型，并提供颜色、尺寸与 QoS 等显示配置。'],
      ['SPACE','TF BUFFER','转换坐标','TF / 空间转换','RViz 在消息时间戳上查询 frame_id 到 Fixed Frame 的变换。'],
      ['VIEW','3D SCENE','合成画面','Rendered Scene / 场景','转换后的几何数据进入同一 3D 场景，供开发者比较和诊断。']
    ],
    deep: [
      ['WHY IT EXISTS','为什么机器人调试需要可视化？','数值日志难以直接暴露坐标翻转、激光偏移或地图漂移。把不同数据放到同一坐标系后，空间错误会立即显现。','使用原则','RViz 是诊断仪表，不是系统正确性的唯一证据。'],
      ['HOW IT WORKS','RViz 显示一帧 LaserScan 需要什么？','必须有正确 Topic、兼容 QoS、有效消息、frame_id，以及消息时间点到 Fixed Frame 的完整 TF。缺一项都会失败。','读状态栏','先展开红色 Display 的 Status，再复制原始错误关键词排查。'],
      ['COMMON PITFALL','Fixed Frame 不是随便选','若设为不存在的 map，而系统只有 odom，所有依赖 TF 的数据显示都会失败。选择应对应当前系统已发布的全局参考系。','快速验证','用 tf2_echo 验证 Fixed Frame 到消息 frame_id。'],
      ['FIELD APPLICATION','如何保存机器人调试工位？','将 RobotModel、LaserScan、Camera、TF 和 Diagnostic 配置好后保存 .rviz 文件，并由 Launch 自动加载。','团队价值','统一布局能让所有人用相同视角复现故障。']
    ],
    trace: ['RViz 如何显示一帧雷达','从 /scan 到 3D 画面，逐项确认数据源、插件、TF 和渲染状态。',[
      ['TOPIC','接收消息','/scan 数据源','Display 使用配置的 QoS 订阅 LaserScan，并读取 header.stamp 与 frame_id。','ros2 topic info /scan --verbose'],
      ['DISPLAY','解析几何','LaserScan 插件','插件把角度和 ranges 转成雷达坐标系中的点。','ros2 interface show sensor_msgs/msg/LaserScan'],
      ['TF LOOKUP','转换坐标','消息时间点的 TF','RViz 查询 rplidar_laser_link 到 Fixed Frame 的变换；过旧或未来时间都会失败。','ros2 run tf2_ros tf2_echo odom rplidar_laser_link'],
      ['RENDER','绘制场景','3D View','使用仓库真实提供的 Andino RViz 配置加载显示，并在 Status 中读取结果。','rviz2 -d "$(ros2 pkg prefix andino_gz)/share/andino_gz/rviz/andino_gz.rviz"']
    ]],
    scenario: ['LaserScan 显示红色 No transform','/scan 有持续数据，RViz 仍无法显示。第一步应验证什么？','Status: No transform from [rplidar_laser_link] to [map]。',['用 tf2_echo 检查当前已知的 odom → rplidar_laser_link，并确认 Fixed Frame 是否误选了尚不存在的 map','增加 LaserScan 点的尺寸','重装显卡驱动'],0,'正确。错误已明确指向坐标链；当前仿真先用 odom 验证，不要假设尚未启动的 map Frame 一定存在。','点尺寸不会修复坐标变换；当前也没有证据指向渲染驱动。']
  },
  transforms: {
    details: [
      'TF 是一棵随时间变化的坐标树。同一 child 在同一时刻只能有一个 parent，避免空间关系出现歧义。',
      '静态变换只需发布一次并使用 Transient Local 保存；动态变换持续更新到 /tf。',
      'Buffer 保存有限时间历史。查询时间早于最旧数据或晚于最新数据都会产生 extrapolation。',
      '一棵树要求每个 Child Frame 只有一个父节点。若两个发布者同时声明同一个 child，空间关系会互相竞争，RViz、导航和传感器融合都可能出现跳变。'
    ],
    model: [
      ['SOURCE','BROADCASTER','发布关系','TF Broadcaster / 发布器','robot_state_publisher、里程计或定位节点发布 parent、child、时间戳和位姿。'],
      ['CHANNEL','/TF','传输变换','/tf 与 /tf_static','动态关系持续更新，静态安装关系采用持久化策略提供给晚加入节点。'],
      ['CACHE','BUFFER','保存历史','TF Buffer / 缓存','监听器按 frame 对缓存一段时间，用于回答特定时间点的变换查询。'],
      ['QUERY','CONSUMER','转换数据','TF Listener / 消费者','RViz、导航或传感器融合查询 source 到 target 的变换并转换数据。']
    ],
    deep: [
      ['WHY IT EXISTS','为什么坐标变换必须带时间？','机器人运动时，同一个 rplidar_laser_link 在不同时间对应不同世界位置。把旧雷达帧用当前位姿转换会造成地图拖影和定位误差。','核心句','TF 回答的是“某个时间点，两个 Frame 如何关联”。'],
      ['HOW IT WORKS','Buffer 怎样回答跨多层查询？','查询 odom 到 rplidar_laser_link 时，Buffer 组合 odom→base_link→second_base_link→rplidar_laser_link，并在同一时间点处理动态变换。','树结构价值','任意两个连通 Frame 之间只有一条组合路径。'],
      ['COMMON PITFALL','时间戳 0 和 now 不完全一样','有些 API 中时间 0 表示最新可用变换；传感器处理则应优先查询消息 header.stamp，避免时序错位。','排查方法','保留原始错误中的 past、future 和具体时间差。'],
      ['FIELD APPLICATION','导航为什么依赖 map→odom→base_link？','定位修正 map→odom 的全局漂移，里程计连续发布 odom→base_link，二者分工避免控制所需的连续性被全局修正破坏。','职责边界','不要让两个节点同时发布同一个 child 的父关系。']
    ],
    trace: ['一次 TF 查询如何完成','从发布变换到 RViz 在消息时间点得到坐标，理解断链与超时发生在哪。',[
      ['BROADCAST','发布位姿','变换生产者','里程计和 robot_state_publisher 创建 TransformStamped。','ros2 topic hz /tf'],
      ['TF TOPICS','传输关系','动态与静态通道','/tf 传动态数据，/tf_static 保存不变安装关系。','ros2 topic info /tf_static --verbose'],
      ['BUFFER','缓存插值','时间历史','Listener 按 Frame 缓存关系，并在允许范围内插值。','ros2 run tf2_tools view_frames'],
      ['LOOKUP','组合路径','查询目标变换','消费者在指定时间组合多段变换；断链或时间超界会抛出错误。','ros2 run tf2_ros tf2_echo odom rplidar_laser_link']
    ]],
    scenario: ['TF 树连通却出现 future extrapolation','view_frames 显示所有 Frame 连通，但 RViz 间歇报未来外推。先查什么？','错误显示请求时间比最新 TF 晚约 0.8 秒。',['检查各节点是否使用同一时钟，仿真环境是否统一 use_sim_time','重新命名 rplidar_laser_link','把 Fixed Frame 改成随机 Frame'],0,'正确。树已连通，错误指向时间基准，应检查 /clock、use_sim_time 和时间同步。','重命名 Frame 反而可能制造断链，无法解释明确的时间差。']
  },
  services: {
    details: [
      'Service 由一对 Request/Response 类型组成。客户端发起一次调用，服务端必须对该请求返回对应响应。',
      'ROS 2 Service 底层仍通过 DDS 发现与传输，但语义是一次请求对应一次结果。',
      '服务回调应尽量短。长任务若需要进度、取消或超时管理，通常使用 Action。',
      '通信方式不能只按“能不能传数据”选择：Topic 强调持续流，Service 强调一次响应，Action 强调长任务的反馈与取消。接口语义选错会让超时和故障恢复变得困难。'
    ],
    model: [
      ['CALLER','CLIENT','构造请求','Service Client / 客户端','客户端等待服务可用，按 srv 接口填写 Request 并生成请求标识。'],
      ['CONTRACT','SRV TYPE','定义双向字段','Service Interface / 接口','--- 上方是 Request，下方是 Response，双方必须使用同一服务类型。'],
      ['DISCOVERY','DDS RPC','匹配服务端','DDS Request / Reply','客户端与服务端发现后传输请求，并用请求标识关联唯一响应。'],
      ['PROVIDER','SERVER','执行返回','Service Server / 服务端','服务回调处理请求并返回 Response；调用者需处理不可用或超时。']
    ],
    deep: [
      ['WHY IT EXISTS','什么时候需要明确响应？','重置仿真、保存地图或查询一次状态，都需要知道请求是否被处理以及结果是什么，这比持续 Topic 更适合 Service。','选择标准','短时、一次性、需要返回结果的操作考虑 Service。'],
      ['HOW IT WORKS','客户端如何匹配自己的响应？','每个请求带唯一标识，DDS 把 Response 返回对应客户端。CLI 会等待服务发现，再显示结构化响应。','失败处理','生产代码应设置等待与调用超时，不能无限阻塞。'],
      ['COMMON PITFALL','Service 不适合长时间导航','导航可能持续几十秒，需要进度反馈和取消。用 Service 会让调用者只能等待，且难以表达中间状态。','正确替代','长任务使用 Action，连续状态使用 Topic。'],
      ['FIELD APPLICATION','保存地图为什么常用 Service？','调用频率低、输入明确、完成后需要成功或失败结果，非常符合请求响应模型。','接口设计','Response 应返回 success 与 message，帮助调用者处理失败。']
    ],
    trace: ['一次 Service 调用如何往返','从 CLI 构造请求到服务端处理并返回结果，观察等待点在哪里。',[
      ['SERVER','等待请求','启动服务端','AddTwoInts 服务端启动后注册 /add_two_ints，并保持进程运行。','ros2 run demo_nodes_cpp add_two_ints_server'],
      ['CLIENT','准备调用','检查服务类型','客户端先确认服务端点存在，并读取 Request / Response 契约。','ros2 service type /add_two_ints'],
      ['REQUEST','发送字段','构造 a 与 b','请求通过 DDS 发出，并带有用于匹配响应的唯一标识。','ros2 interface show example_interfaces/srv/AddTwoInts'],
      ['RESPONSE','返回结果','完成一次调用','Response 回到原客户端；本例 a=2、b=3 时应得到 sum=5。','ros2 service call /add_two_ints example_interfaces/srv/AddTwoInts "{a: 2, b: 3}"']
    ]],
    scenario: ['service list 有名称但调用一直等待','/add_two_ints 存在，调用后迟迟没有结果。第一步应该？','客户端已发现服务，但 10 秒后仍无 Response。',['检查服务端日志与回调是否阻塞，并为客户端设置超时','无限等待，Service 一定会完成','改用 Topic 重复发送相同请求'],0,'正确。发现成功只证明端点存在，仍需检查服务回调、执行器和超时策略。','Service 不保证业务一定完成；无限等待会把故障扩散到调用者。']
  },
  assessment: {
    details: [
      '系统排查应从低成本、基础层开始：进程与发现 → 数据 → 接口/QoS → 时间/TF → 消费者行为。',
      '一次只验证一个假设，记录命令、输出和判断。否则同时修改多个参数后无法知道真正原因。',
      '修复完成必须重复原始失败测试，并补充回归检查，避免“看起来好了”却留下同类故障。',
      '可复现报告至少包含环境版本、前置状态、原始命令与输出、判断依据、唯一修改、恢复证据和回归结果。缺少其中任一项，下一位使用者都可能无法复现结论。'
    ],
    model: [
      ['LAYER 01','PROCESS','节点存在','Process / Discovery','先证明关键节点存在、名称正确并处于同一 Domain。'],
      ['LAYER 02','DATA','消息流动','Topic / Interface','再证明发布者、类型、频率、内容与 QoS 符合预期。'],
      ['LAYER 03','SPACE','时空一致','TF / Time','确认 Frame 链连通，时间基准一致，查询落在 Buffer 范围。'],
      ['LAYER 04','BEHAVIOR','恢复验收','Bridge / Simulator / Robot','最后观察桥接、仿真或真实执行行为，并重复原始测试保存证据。']
    ],
    deep: [
      ['WHY IT EXISTS','为什么需要固定排查顺序？','机器人系统层次多，直接修改最显眼的组件容易掩盖根因。固定顺序能先排除基础依赖，减少无效尝试。','报告要求','每个结论都应对应一条命令输出或可复现观察。'],
      ['HOW IT WORKS','如何从症状建立假设？','先写“预期、实际、差异”，再按层列出可能原因，选择成本最低且区分度最高的检查。','好问题','哪一条命令能最快排除最多假设？'],
      ['COMMON PITFALL','不要把重启当作根因','重启可能暂时恢复状态，但没有解释为何失败。除非记录重启前后差异，否则不能形成可复用经验。','验收底线','必须能复现、修复并再次验证。'],
      ['FIELD APPLICATION','现场调试报告应包含什么？','环境版本、复现步骤、时间线、关键命令输出、根因、修复、回归结果和预防措施。','团队价值','下一位工程师应能仅凭报告复现你的判断过程。']
    ],
    trace: ['从故障现象到可验证结论','以“机器人不动”为例，按层收集证据并收敛到根因。',[
      ['DISCOVERY','确认组件','节点与桥接','先列出关键节点，确认 ros_gz_bridge / parameter_bridge 存在，排除系统根本未启动。','ros2 node list'],
      ['DATA','确认命令','/cmd_vel 端点与内容','检查发布订阅数量，再读取实际 Twist，判断命令是否产生。','ros2 topic info /cmd_vel'],
      ['SPACE + TIME','确认反馈','odom 与 TF','验证里程计频率和 odom→base_link，判断执行反馈是否更新。','ros2 run tf2_ros tf2_echo odom base_link'],
      ['RECOVERY','重复原测','修复与回归','修复后重复同一运动命令，并记录 /odom 与现场动作恢复。','ros2 topic echo /odom --once']
    ]],
    scenario: ['综合故障：RViz 有雷达，机器人不响应导航','/scan 与 TF 正常，导航也在发布 /cmd_vel，但底盘不动。下一步检查哪层？','已证明传感器和空间链正常，/cmd_vel 有非零数据。',['检查 /cmd_vel 的订阅端、ros_gz_bridge、Gazebo Play 与 /clock；真实底盘还要检查急停','继续检查 /scan 消息字段','修改 map 的颜色'],0,'正确。现有证据已把问题缩小到桥接与执行层，应沿数据下游继续验证。','重复检查已证明正常的上游信息，不能有效缩小故障范围。']
  }
};

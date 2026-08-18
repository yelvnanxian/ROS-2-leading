window.module04Lessons = {
  odometry_model: {
    code:'04.01', category:'MENTAL MODEL / DEAD RECKONING', title:'先看懂里程计：机器人怎样估计自己走了多远', time:36,
    intro:'里程计不是 GPS，也不是地图定位。它从轮子在一小段时间内转了多少开始，逐次累加出相对位姿。优点是连续、实时；代价是误差也会被持续累加。本节先建立完整心智模型，再检查 Andino 是否真的提供轮速输入。',
    route:{learn:'解释轮式里程计、航位推算、瞬时速度与累计位姿的关系', do:'启动 Andino 并证明 /joint_states、仿真时间和依赖都可用', after:'画出“轮速 → 机体速度 → 位姿”的四段计算链'},
    prerequisite:'前置：03.07 的 ros2_exercises、odometry_publisher.py、console_scripts 和构建流程可用；课程容器与图形显示正常。开始前停止旧 odometry_publisher，避免观察到上一轮残留进程。',
    concepts:[
      {label:'ODOMETRY', title:'相对运动估计', definition:'Odometry 根据连续运动测量估计机器人相对起点的位置与朝向。它回答“从起点大约走到了哪里”，不直接回答“在全局地图的哪个房间”。', detail:'在 ROS 2 中，常见结果包含 odom 坐标系下的 Pose 和 base_link 自身的 Twist。地图定位会在更上层用传感器修正累计误差。'},
      {label:'DEAD RECKONING', title:'航位推算会累积误差', definition:'每个时间片用当前速度推算一个小位移，再把小位移加到上一时刻位姿；任何轮滑、参数误差和时间误差都会被带到后续状态。', detail:'里程计可以短时平滑，却不保证长期回到同一位置。SLAM、AMCL 或传感器融合之所以重要，就是因为它们能提供外部约束。'},
      {label:'SENSOR SOURCES', title:'同一目标有多种观测来源', definition:'轮编码器、相机、IMU 和多传感器融合都可以估计运动。本章只从左右轮角速度计算轮式里程计。', detail:'轮式里程计在平整、抓地良好时简单有效；轮子空转、打滑、胎径变化和地面不平都会破坏“轮子转动等于车体移动”的假设。'}
    ],
    chain:{before:'03 已经能创建、构建并运行 odometry_publisher Node', current:'把左右轮测量转换为连续相对位姿', next:'04.02 从 /joint_states 稳健读取左右轮角速度', nodes:[
      {tag:'MEASURE', title:'/joint_states', role:'提供左右轮角速度', detail:'JointState 的 name 与 velocity 是对应数组。我们必须按关节名称找到索引，不能假设左右轮永远排在固定位置。', preview:'ros2 topic echo /joint_states --once'},
      {tag:'KINEMATICS', title:'WHEEL → BODY', role:'换算线速度与角速度', detail:'轮半径把 rad/s 转为 m/s；左右轮平均值得到前进速度，差值除以轮距得到绕 z 轴角速度。', preview:'v=(vR+vL)/2 · w=(vR-vL)/L'},
      {tag:'INTEGRATE', title:'dt + POSE', role:'把速度累加成 x、y、theta', detail:'速度乘时间得到增量，再根据旧朝向把前进量投影到 x、y。积分频率和时间基准必须可靠。', preview:'dx=v·cos(theta)·dt'},
      {tag:'PUBLISH', title:'/robot_odometry', role:'发布独立实验结果', detail:'自建 Topic 不与 Andino 仿真已有 /odom 冲突，便于比较算法结果和参考结果。', preview:'nav_msgs/msg/Odometry'}
    ]},
    lab:{title:'做里程计输入与依赖预检', intro:'SIM 负责长时间运行仿真，INSPECT 只做查询。本节不修改 Python 文件；先证明输入、时间和库都可用。', success:'Andino 仿真运行，/joint_states 有发布端且持续更新，JointState 接口可读，Python 能导入 rclpy、matplotlib 与 tf_transformations。', recovery:'任一输入缺失就停在本节。Topic 名存在但无数据时先看 Gazebo Play 与 /clock；Python 依赖缺失时核对参考镜像，不要先写依赖它的代码。', steps:[
      {terminal:'SIM · CONTAINER · KEEP RUNNING', keep:'课程容器和 DISPLAY 已通过 00.04', action:'启动唯一的 Andino 仿真', command:'ros2 launch andino_gz andino_gz.launch.py', expected:'Gazebo 与 RViz 出现，机器人模型可见，SIM 终端没有持续 ERROR。', recovery:'窗口不出现回 00.02 检查 DISPLAY/X11；重复节点或重复窗口时停止旧 Launch，只保留一个 SIM。', stop:'本模块实验期间保持 SIM 运行。'},
      {terminal:'INSPECT · NEW CONTAINER TERMINAL', keep:'SIM 与 Gazebo Play 继续运行', action:'确认轮子状态 Topic 有真实发布端', command:'ros2 topic info /joint_states --verbose', expected:'Type 为 sensor_msgs/msg/JointState，Publisher count 至少为 1。', recovery:'Topic 不存在时先看 ros2 topic list 和 SIM 日志；Publisher count 为 0 时检查 Gazebo 是否暂停或插件是否启动。'},
      {terminal:'INSPECT · SAME TERMINAL', keep:'SIM 继续运行', action:'读懂 JointState 消息字段', command:'ros2 interface show sensor_msgs/msg/JointState', expected:'看到 Header、string[] name、float64[] position、velocity 和 effort。', recovery:'Package not found 时确认进入 Humble 课程容器并 source /opt/ros/humble/setup.bash。'},
      {terminal:'INSPECT · SAME TERMINAL', keep:'SIM 继续运行', action:'取得一帧真实关节数据', command:'ros2 topic echo /joint_states --once', expected:'name 中包含 left_wheel_joint 与 right_wheel_joint，velocity 数组存在对应数值；静止时接近 0 正常。', recovery:'一直等待时检查 /joint_states 频率与 /clock；缺少轮关节名时保存完整 name 数组并确认使用的是 Andino 模型。'},
      {terminal:'INSPECT · SAME TERMINAL', keep:'SIM 可继续运行', action:'确认本章 Python 依赖已经进入镜像', command:'python3 -c "import rclpy, matplotlib, tf_transformations; print(\'odometry dependencies ready\')"', expected:'输出 odometry dependencies ready。', recovery:'保留第一条 ModuleNotFoundError。在课程容器执行 sudo apt-get update && sudo apt-get install -y python3-matplotlib ros-humble-tf-transformations，再原样重试导入命令；apt 失败先查 DNS、系统时间和磁盘空间，不要改 Python 源码绕过依赖。'}
    ]},
    scenario:{title:'Topic 名称存在，但节点一直收不到轮速', symptom:'ros2 topic list 有 /joint_states；topic echo 一直等待，Gazebo 画面也停止不动。', question:'第一项最有效的检查是什么？', options:['确认 Gazebo 是否处于 Play，并检查 /clock 是否持续更新', '修改轮半径', '给 RViz 添加 Map Display'], correct:0, correctText:'正确。所有仿真数据都停止时应先检查仿真时间和 Play 状态，而不是修改运动学参数。', wrongText:'当前尚未获得任何消息，轮半径和显示配置都不能恢复停止的发布源。'},
    checks:[
      {prompt:'里程计与地图定位有什么区别？', answer:'里程计从运动增量累加相对位姿，短时连续但会漂移；地图定位使用环境观测把机器人约束到全局地图。'},
      {prompt:'为什么轮式里程计会随时间漂移？', answer:'每个时间片的轮滑、参数和时间误差都会进入累计位姿，后续状态继续建立在已有误差上。'},
      {prompt:'为什么使用 /robot_odometry 而不是覆盖 /odom？', answer:'Andino 仿真已有自己的 /odom；独立 Topic 能避免发布冲突，并允许对比参考输出。'}
    ],
    after:{title:'四段里程计计算链', text:'画出 /joint_states → 轮线速度 → 机体 Twist → x/y/theta → /robot_odometry，并给每一段标注单位。', deliverable:'提交物：五个节点、四条箭头；轮角速度 rad/s、轮线速度 m/s、机体 Twist 的 m/s 与 rad/s、Pose 的 m 与 rad，以及一条误差来源。'},
    next:'04.02 · 稳健读取左右轮 JointState'
  },

  joint_states: {
    code:'04.02', category:'SENSOR INPUT / JOINT STATE', title:'订阅 /joint_states：不要把数组顺序当成永恒真理', time:44,
    intro:'JointState 把多个关节装在同一条消息里。新手常直接读取 velocity[0] 和 velocity[1]，模型一旦改变顺序就会把轮子认反。本节按 name 找索引、检查数组长度，并让上一章的 Node 第一次收到真实传感器回调。',
    route:{learn:'解释 JointState 对齐数组、按名称索引和回调触发机制', do:'添加 sensor_msgs 依赖、订阅者与带保护的轮速读取代码', after:'保存一份关节名、索引和值的对应表'},
    prerequisite:'前置：04.01 的 /joint_states 有发布端并包含两个轮关节；03.07 的 odometry_publisher.py 仍可通过 py_compile。先备份当前文件或使用版本控制，后续每节都在同一文件上增量修改。',
    concepts:[
      {label:'ALIGNED ARRAYS', title:'name 与 velocity 按索引对应', definition:'JointState 的 name[i]、position[i]、velocity[i] 描述同一个关节，但消息不承诺你关心的轮子固定排在第 0、1 项。', detail:'先用 name.index("left_wheel_joint") 找到位置，再读取同索引 velocity。这样即使消息新增转向或传感器关节，代码仍能找到正确车轮。'},
      {label:'SUBSCRIPTION', title:'订阅者把消息交给回调', definition:'create_subscription 声明消息类型、Topic、回调和队列深度；每次数据到达时，执行器在 spin 中调用 joint_states_callback。', detail:'回调应尽量快速。持续绘图或大量日志会拖慢处理；本节日志只用于短时观察，确认后会逐步替换为真正计算。'},
      {label:'DEFENSIVE INPUT', title:'先验证再计算', definition:'名称缺失、velocity 长度不足或非预期消息都应被识别并安全返回，不能让 ValueError 或 IndexError 直接终止节点。', detail:'防呆不是吞掉错误。代码要给出明确 warn，告诉学习者缺的是哪个轮关节或数组字段。'}
    ],
    chain:{before:'04.01 已证明 /joint_states 输入存在', current:'把真实消息安全送入 Python 回调并提取两个轮速', next:'04.03 将 rad/s 转换为差速底盘的 v 与 w', nodes:[
      {tag:'DDS INPUT', title:'/joint_states', role:'传输 JointState 消息', detail:'Gazebo 插件发布，odometry_publisher 订阅。双方类型和 QoS 兼容后回调才会触发。', preview:'sensor_msgs/msg/JointState'},
      {tag:'CALLBACK', title:'joint_states_callback', role:'接收每一帧消息', detail:'rclpy.spin 调度回调。节点启动后只有回调执行，轮速数据才进入计算路径。', preview:'create_subscription(..., 10)'},
      {tag:'LOOKUP', title:'name.index()', role:'按名称解析左右轮索引', detail:'先确认 name 包含两个目标，再使用索引读取 velocity，避免顺序假设。', preview:'left_wheel_joint / right_wheel_joint'},
      {tag:'GUARD', title:'LENGTH CHECK', role:'阻止不完整消息进入计算', detail:'velocity 必须覆盖左右轮索引。失败时 warn 并 return，让节点保持可诊断而不是崩溃。', preview:'len(velocity) > max(indexes)'}
    ]},
    lab:{title:'让 odometry_publisher 安全收到左右轮速', intro:'IDE 修改挂载源码，BUILD 更新依赖与 Overlay，RUN 观察回调。代码片段按标注放入现有类，不要创建第二个同名 Node。', success:'构建成功，RUN 启动后能输出 left/right rad/s；轮子静止时接近 0，运动时数值变化，缺字段时节点不会崩溃。', recovery:'SyntaxError 先 py_compile；Package 依赖问题查 package.xml；回调不触发查 Topic 类型、发布端与 ROS_DOMAIN_ID；ValueError 说明名称保护没有放在 index 前。', steps:[
      {terminal:'INSPECT · CONTAINER', keep:'SIM 继续运行', action:'记录真实关节数组顺序', command:'ros2 topic echo /joint_states --once', expected:'保存 name 与 velocity，能指出左右轮名称对应的索引。', recovery:'未出现两个轮名时不要猜索引；检查模型版本和完整消息。'},
      {terminal:'IDE · PACKAGE ROOT', keep:'编辑 /home/user/exercises_ws/src/ros2_exercises/package.xml', action:'声明 JointState 运行依赖', command:'在 package.xml 的依赖区域加入：\n<depend>sensor_msgs</depend>', expected:'保存后 grep -n sensor_msgs package.xml 能找到这一行，XML 标签闭合。', recovery:'不要写进 export 或 package 标签外；XML 错误时回看相邻 depend 标签并保持格式一致。', manual:true, copyLabel:'复制依赖声明'},
      {terminal:'IDE · odometry_publisher.py', keep:'保留原有 rclpy Node 与 main', action:'添加导入、订阅者和稳健回调', command:`在导入区加入：
from sensor_msgs.msg import JointState

在 __init__ 中加入：
self.joint_subscription = self.create_subscription(
    JointState, '/joint_states', self.joint_states_callback, 10
)

在类中加入：
def joint_states_callback(self, joint_states):
    required = {'left_wheel_joint', 'right_wheel_joint'}
    if not required.issubset(set(joint_states.name)):
        self.get_logger().warning('wheel joint name missing')
        return
    left_index = joint_states.name.index('left_wheel_joint')
    right_index = joint_states.name.index('right_wheel_joint')
    if len(joint_states.velocity) <= max(left_index, right_index):
        self.get_logger().warning('wheel velocity missing')
        return
    left_wheel_vel = joint_states.velocity[left_index]
    right_wheel_vel = joint_states.velocity[right_index]
    self.get_logger().info(
        f'wheel rad/s left={left_wheel_vel:.3f} right={right_wheel_vel:.3f}'
    )`, expected:'文件保存后，回调位于 OdometryPublisher 类内且与 __init__ 同级缩进；没有删除 main、spin 或清理逻辑。', recovery:'IndentationError 时先确认方法缩进 4 个空格、方法体 8 个空格；NameError 时确认 JointState import 位于文件顶部。', manual:true, copyLabel:'复制代码片段'},
      {terminal:'BUILD · CONTAINER', keep:'IDE 已保存且 SIM 可继续运行', action:'语法检查并更新包依赖安装信息', command:'cd /home/user/exercises_ws && python3 -m py_compile src/ros2_exercises/ros2_exercises/odometry_publisher.py && colcon build --symlink-install --packages-select ros2_exercises && source install/setup.bash', expected:'py_compile 无输出，colcon Summary 显示 1 package finished 且无 failed。', recovery:'先处理第一条 SyntaxError/XML/colcon ERROR；不要同时修改运动学公式。'},
      {terminal:'RUN · CONTAINER · KEEP BRIEFLY', keep:'SIM 运行，BUILD 已 source', action:'启动节点并观察轮速回调', command:'ros2 run ros2_exercises odometry_publisher --ros-args -p use_sim_time:=True', expected:'终端持续出现左右轮 rad/s 日志；静止时接近 0。观察数帧后按 Ctrl+C。', recovery:'只有启动日志而无轮速时查 ros2 node info /odometry_publisher 的 Subscribers 与 /joint_states 发布端；节点退出时读取完整 traceback。', stop:'记录几帧后按 Ctrl+C，避免日志长期刷屏。'}
    ]},
    scenario:{title:'节点刚收到消息就因 ValueError 退出', symptom:'traceback 指向 joint_states.name.index("left_wheel_joint")，消息 name 中没有该名称。', question:'代码应怎样防止这种崩溃？', options:['在 index 前确认两个名称都存在，缺失时 warn 并 return', '把索引固定为 0 和 1', '删除 /joint_states 订阅'], correct:0, correctText:'正确。先验证输入契约，再索引；日志保留故障证据，同时节点安全返回等待下一帧。', wrongText:'固定索引会把模型差异变成隐蔽错误，删除订阅则失去里程计输入。'},
    checks:[
      {prompt:'为什么不能直接使用 velocity[0] 和 velocity[1]？', answer:'JointState 通过 name 与其他数组按索引对应，但关节排列可能变化，固定位置会读错轮子。'},
      {prompt:'create_subscription 的回调什么时候执行？', answer:'当兼容的 /joint_states 消息到达且节点正在 rclpy.spin 时，由执行器调度回调。'},
      {prompt:'防御检查为什么既要看名称又要看 velocity 长度？', answer:'名称存在只给出索引，还必须确保 velocity 数组真的覆盖这些索引，否则会 IndexError。'}
    ],
    after:{title:'JointState 对应表', text:'保存一帧真实消息，把每个 name、索引和 velocity 对齐，并写出代码对缺名称、缺 velocity 的处理。', deliverable:'提交物：左右轮两行对应表、一次回调日志和两条防御分支。'},
    next:'04.03 · 差速运动学与单位换算'
  },

  differential_kinematics: {
    code:'04.03', category:'KINEMATICS / WHEEL TO BODY', title:'差速运动学：从轮子 rad/s 得到机器人 v 与 w', time:46,
    intro:'编码器给的是轮轴角速度，不是机器人每秒前进多少米。先乘轮半径得到两侧轮缘线速度，再用“平均”和“差”得到机体前进速度与转向速度。本节同时用三个极端例子验证公式方向。',
    route:{learn:'完成 rad/s→m/s、左右轮平均与差速转向的单位推导', do:'加入 Andino 轮径/轮距参数并输出 linear_velocity、angular_velocity', after:'完成直行、原地旋转、缓弯三组手算'},
    prerequisite:'前置：04.02 回调能够稳定读到 left_wheel_vel 与 right_wheel_vel。轮参数使用参考仓库给定的 Andino 基线：wheel_radius=0.033 m，wheel_separation=0.137 m。',
    concepts:[
      {label:'UNIT CONVERSION', title:'角速度乘半径得到轮缘线速度', definition:'轮轴角速度单位 rad/s，乘以轮半径 m 后得到轮缘速度 m/s：v_left = omega_left × radius。', detail:'忘记乘半径会把约 30 倍量级的 rad/s 当成 m/s，位置会迅速发散。轮胎实际半径偏差也会按比例进入里程计。'},
      {label:'LINEAR VELOCITY', title:'两轮平均决定前进速度', definition:'机器人中心线速度 v=(v_right+v_left)/2。两轮同向同速时直行，速度就是任一轮线速度。', detail:'如果左右轮符号定义与实际模型相反，直行可能被算成旋转。必须结合真实 /joint_states 与机器人行为验证符号。'},
      {label:'ANGULAR VELOCITY', title:'速度差除以轮距决定转向', definition:'绕 z 轴角速度 w=(v_right-v_left)/wheel_separation。右轮更快时按本坐标约定产生正角速度。', detail:'轮距越小，同样的轮速差产生越快旋转；轮距参数错误会让 theta 系统性过大或过小。'}
    ],
    chain:{before:'04.02 已取得两个轮轴角速度', current:'把传感器单位转换为机体 Twist', next:'04.04 用 dt 把 v、w 积分成 x、y、theta', nodes:[
      {tag:'ANGULAR', title:'omega L / R', role:'轮轴角速度 rad/s', detail:'来自 JointState velocity，正负号描述每个轮关节的旋转方向。', preview:'left_wheel_vel · right_wheel_vel'},
      {tag:'RADIUS', title:'vL / vR', role:'轮缘线速度 m/s', detail:'分别乘以 0.033 m。此处完成第一次单位转换。', preview:'v_left = omega_left × 0.033'},
      {tag:'AVERAGE', title:'LINEAR v', role:'机器人中心前进速度', detail:'左右轮线速度平均。相等同号时角速度为零。', preview:'(v_right + v_left) / 2'},
      {tag:'DIFFERENCE', title:'ANGULAR w', role:'机器人绕 z 轴速度', detail:'左右速度差除以 0.137 m。相反等大时线速度为零。', preview:'(v_right - v_left) / 0.137'}
    ]},
    lab:{title:'加入并用极端情况验证差速公式', intro:'先在独立 Python 表达式中验证量纲和符号，再编辑回调。RUN 只观察短时间，SIM 必须继续运行。', success:'同速同向得到 w≈0，相反等大得到 v≈0；真实运行日志中的 m/s 与 rad/s 随机器人行为合理变化。', recovery:'数值异常先检查单位、轮序与符号，不要调大/调小随机常数。直行时 w 明显非零，优先比较左右轮值与关节名称。', steps:[
      {terminal:'INSPECT · CONTAINER', keep:'SIM 运行', action:'观察轮速原始单位与符号', command:'ros2 topic echo /joint_states --once', expected:'velocity 是轮关节 rad/s；静止时接近 0，运动时可为正或负。', recovery:'先确认 name 对应关系，不能只摘录 velocity 数组。'},
      {terminal:'CALC · CONTAINER', keep:'不需要停止 SIM', action:'用同速例子验证直行公式', command:'python3 -c "r=0.033; L=0.137; wl=3.0; wr=3.0; vl=wl*r; vr=wr*r; print((vr+vl)/2, (vr-vl)/L)"', expected:'输出线速度约 0.099，角速度 0.0。', recovery:'若结果不同，逐项打印 vl、vr，检查是否忘记半径或写错括号。'},
      {terminal:'IDE · odometry_publisher.py', keep:'04.02 回调仍存在', action:'在 __init__ 中保存 Andino 轮参数', command:`self.wheel_separation = 0.137
self.wheel_radius = 0.033`, expected:'两个参数位于 __init__，单位分别是 m 与 m；名称与后续公式一致。', recovery:'不要把直径 0.066 当半径，也不要把毫米值 33 直接用于米制公式。', manual:true, copyLabel:'复制参数代码'},
      {terminal:'IDE · joint_states_callback', keep:'放在左右轮角速度读取之后', action:'转换轮线速度并计算机体 Twist', command:`v_left = left_wheel_vel * self.wheel_radius
v_right = right_wheel_vel * self.wheel_radius
linear_velocity = (v_right + v_left) / 2.0
angular_velocity = (v_right - v_left) / self.wheel_separation
self.get_logger().info(
    f'body v={linear_velocity:.3f} m/s w={angular_velocity:.3f} rad/s'
)`, expected:'保存后 py_compile 通过；代码没有再把原始 rad/s 直接当 linear_velocity。', recovery:'NameError 查变量定义顺序；ZeroDivisionError 说明 wheel_separation 错误地设为 0。', manual:true, copyLabel:'复制运动学代码'},
      {terminal:'RUN · CONTAINER · KEEP BRIEFLY', keep:'SIM 运行，Overlay 已从 04.02 构建', action:'语法检查后运行并观察 v、w', command:'cd /home/user/exercises_ws && python3 -m py_compile src/ros2_exercises/ros2_exercises/odometry_publisher.py && source install/setup.bash && ros2 run ros2_exercises odometry_publisher --ros-args -p use_sim_time:=True', expected:'日志持续显示 body v 与 w；机器人静止时都接近 0。用 Gazebo Teleop 短暂直行时 v 改变且 w 接近 0。', recovery:'代码是 symlink install 时只改 .py 无需重建；若 import/入口仍是旧版本，核对 install 链接与实际编辑路径。', stop:'验证一组静止和一组短运动后按 Ctrl+C。'}
    ]},
    scenario:{title:'机器人直行，计算出的角速度却很大', symptom:'Gazebo 中轨迹基本直线，但日志显示 v 接近 0、w 明显非零。', question:'第一项应核对什么？', options:['左右轮名称、索引和符号是否与真实 JointState 对应', '提高 matplotlib 刷新率', '修改 odom frame 名称'], correct:0, correctText:'正确。直行被算成旋转通常是轮序或符号问题，应回到输入映射验证。', wrongText:'显示刷新和 frame 名不会改变运动学数值，问题发生在轮输入到公式之间。'},
    checks:[
      {prompt:'为什么 rad/s 不能直接当作 m/s？', answer:'rad/s 是轮轴角速度，必须乘轮半径 m 才得到轮缘线速度 m/s。'},
      {prompt:'两轮同向同速时 v、w 应是什么关系？', answer:'v 等于任一轮线速度，w 为 0，因此机器人直行。'},
      {prompt:'两轮相反等速时会怎样？', answer:'平均值为 0，因此中心不前进；差值非零，因此原地旋转。'}
    ],
    after:{title:'三种运动手算表', text:'分别用同速同向、相反等速、右快左慢三组轮轴速度，计算 v_left、v_right、v 与 w。', deliverable:'提交物：三行计算、完整单位、预期机器人行为和一条符号错误诊断。'},
    next:'04.04 · 时间增量与二维位姿积分'
  },

  pose_integration: {
    code:'04.04', category:'TIME + INTEGRATION / POSE', title:'把速度积起来：dt、x、y、theta 为什么缺一不可', time:50,
    intro:'速度只描述“现在怎么动”，里程计还要回答“已经到了哪里”。每次回调计算当前时间与上次时间之差，再把 v 沿旧朝向投影到 x、y，并把 w 累加到 theta。本节加入仿真时间跳变保护，避免暂停或重置后出现巨大位移。',
    route:{learn:'解释 dt、二维欧拉积分、朝向投影和时间跳变风险', do:'加入状态变量、仿真时钟与带保护的位姿积分', after:'用一组数值手算一次完整积分'},
    prerequisite:'前置：04.03 已能得到单位正确的 linear_velocity 与 angular_velocity。RUN 必须使用 --ros-args -p use_sim_time:=True，与 Gazebo /clock 保持同一时间基准。',
    concepts:[
      {label:'DELTA TIME', title:'dt 是两次计算之间的秒数', definition:'current_time-last_time 得到持续时间，纳秒除以 1e9 转为秒。速度乘 dt 才是这一小段位移。', detail:'忘记更新 last_time 会让 dt 越来越大；系统暂停或重置会产生 0、负值或异常大间隔，需要安全返回并重置时间基线。'},
      {label:'POSE INTEGRATION', title:'沿旧朝向投影位移', definition:'本章使用一阶欧拉积分：dx=v·cos(theta)·dt，dy=v·sin(theta)·dt，dtheta=w·dt。', detail:'theta=0 时前进主要增加 x；theta≈π/2 时前进主要增加 y。若先更新 theta 再计算 dx/dy，就使用了不同的积分约定。'},
      {label:'STATEFUL CALLBACK', title:'回调必须记住上一次状态', definition:'x、y、theta、last_time 保存在 Node 对象中，每一帧以旧值为起点更新，不能在回调内部重新设为 0。', detail:'节点重启后状态自然从零开始，这正符合相对起点里程计；若需要跨进程保存则是另一项设计。'}
    ],
    chain:{before:'04.03 已得到瞬时 v 与 w', current:'使用仿真 dt 把速度更新为连续二维 Pose', next:'04.05 把 Pose 和 Twist 装入 Odometry 消息', nodes:[
      {tag:'CLOCK', title:'CURRENT - LAST', role:'计算秒制 dt', detail:'使用 Node 的 ROS Clock；use_sim_time=True 时与 Gazebo /clock 同步。', preview:'nanoseconds / 1e9'},
      {tag:'PROJECT', title:'dx / dy', role:'按旧 theta 投影前进量', detail:'cos 决定 x 分量，sin 决定 y 分量。纯旋转时 v≈0，因此 dx、dy≈0。', preview:'v·cos(theta)·dt'},
      {tag:'ROTATE', title:'dtheta', role:'累加平面朝向', detail:'角速度 rad/s 乘秒得到 rad。theta 可以持续累加，转换四元数时三角函数仍能处理。', preview:'w·dt'},
      {tag:'STATE', title:'x / y / theta', role:'成为下一帧起点', detail:'更新后的成员变量保留到下次回调，形成递推链。', preview:'self.x += delta_x'}
    ]},
    lab:{title:'加入可诊断的二维位姿积分', intro:'IDE 先添加 math 与状态，再添加时间保护和积分。每段保存后 py_compile；不要一次粘贴后只看最终 traceback。', success:'RUN 使用仿真时间后，静止时 x/y/theta 基本不变；短直行主要改变 x；原地旋转主要改变 theta；暂停恢复不会出现巨大跳变。', recovery:'位姿跳变先记录 dt；方向错误查 theta 与轮符号；静止漂移先看轮速是否真为零。失败时保留日志，不要用清零掩盖。', steps:[
      {terminal:'INSPECT · CONTAINER', keep:'SIM 运行', action:'证明仿真时钟持续更新', command:'ros2 topic echo /clock --once', expected:'收到 rosgraph_msgs/msg/Clock，sec/nanosec 随仿真推进。', recovery:'一直等待说明 Gazebo 未 Play 或 /clock 发布异常；恢复前不要运行 use_sim_time 节点。'},
      {terminal:'IDE · odometry_publisher.py', keep:'保留已有导入和轮参数', action:'加入 math 与累计状态', command:`导入区加入：
import math

__init__ 中加入：
self.x = 0.0
self.y = 0.0
self.theta = 0.0
self.last_time = self.get_clock().now()`, expected:'状态只在 __init__ 初始化一次，没有放进回调。', recovery:'若每帧都回到 0，检查是否误把初始化代码放在 joint_states_callback。', manual:true, copyLabel:'复制状态代码'},
      {terminal:'IDE · joint_states_callback', keep:'放在轮速读取后、位姿积分前', action:'计算 dt 并保护异常时间间隔', command:`current_time = self.get_clock().now()
dt = (current_time - self.last_time).nanoseconds / 1e9
self.last_time = current_time
if dt <= 0.0 or dt > 0.5:
    self.get_logger().warning(f'skip invalid dt={dt:.3f}s')
    return`, expected:'正常运行时 dt 为小正数；暂停、重置或首帧异常时只跳过当前帧。', recovery:'dt 总为 0 时确认 RUN 参数 use_sim_time=True 与 /clock；dt 经常大于 0.5 时检查回调频率与日志是否阻塞。', manual:true, copyLabel:'复制时间保护'},
      {terminal:'IDE · joint_states_callback', keep:'放在 linear_velocity、angular_velocity 计算之后', action:'用旧 theta 计算并累加位姿', command:`delta_x = linear_velocity * math.cos(self.theta) * dt
delta_y = linear_velocity * math.sin(self.theta) * dt
delta_theta = angular_velocity * dt
self.x += delta_x
self.y += delta_y
self.theta += delta_theta
self.get_logger().info(
    f'pose x={self.x:.3f} y={self.y:.3f} theta={self.theta:.3f}'
)`, expected:'py_compile 通过；x、y 单位为 m，theta 单位为 rad。', recovery:'NameError 查 math import 和变量顺序；位移数量级异常回 04.03 检查 rad/s→m/s。', manual:true, copyLabel:'复制积分代码'},
      {terminal:'RUN · CONTAINER · KEEP RUNNING', keep:'SIM 与 /clock 正常', action:'运行积分节点', command:'cd /home/user/exercises_ws && python3 -m py_compile src/ros2_exercises/ros2_exercises/odometry_publisher.py && source install/setup.bash && ros2 run ros2_exercises odometry_publisher --ros-args -p use_sim_time:=True', expected:'静止时 pose 基本不变；RUN 保持占用，没有 traceback。', recovery:'持续 skip invalid dt 时先检查 /clock 和回调频率；不要删除时间保护。', stop:'保持 RUN，下一步用独立 COMMAND 终端短暂运动。'},
      {terminal:'COMMAND · NEW CONTAINER TERMINAL', keep:'SIM 与 RUN 继续运行，准备立即停止', action:'用 Gazebo Teleop 做一次短直行和短旋转', command:'Gazebo Teleop：低速前进约 2 秒后松开；再低速原地转动约 2 秒后松开', expected:'直行阶段 x/y 中主要一项连续变化；旋转阶段 theta 明显变化，x/y 变化较小。', recovery:'行为与日志相反时立即停止，保存轮速、v/w 与 pose 三层日志，按输入→运动学→积分逐层比较。', stop:'完成两段短动作后停止机器人，再在 RUN 按 Ctrl+C。', manual:true}
    ]},
    scenario:{title:'Gazebo 暂停一会再恢复，位姿突然跳很远', symptom:'轮速数值正常，但恢复后的第一帧 dt 明显大于平时。', question:'代码应怎样处理？', options:['识别异常 dt，更新 last_time 并跳过这一帧积分', '把轮半径改小直到看起来正常', '每帧把 x、y 清零'], correct:0, correctText:'正确。异常来自时间间隔，应在时间层处理，不能篡改运动参数或破坏累计状态。', wrongText:'轮半径和清零都不能解释暂停造成的异常时间跨度。'},
    checks:[
      {prompt:'为什么 dx、dy 需要 cos(theta) 与 sin(theta)？', answer:'机器人前进方向随朝向变化，要把机体前进量投影到 odom 的 x、y 轴。'},
      {prompt:'last_time 为什么每次都要更新？', answer:'下一帧 dt 必须只表示相邻两次回调间隔，否则会不断重复累计旧时间。'},
      {prompt:'状态为什么放在 __init__ 而不是回调开头？', answer:'成员变量需要跨回调保留，回调开头重置会让里程计永远只能得到单帧增量。'}
    ],
    after:{title:'一次积分手算', text:'给定 x=0、y=0、theta=0.5rad、v=0.1m/s、w=0.2rad/s、dt=0.1s，算出 delta 与新位姿。', deliverable:'提交物：dx、dy、dtheta、新 x/y/theta 六个数值、单位和使用旧 theta 的说明。'},
    next:'04.05 · 构造并发布 nav_msgs/Odometry'
  },

  odometry_message: {
    code:'04.05', category:'ROS MESSAGE / PUBLISHER', title:'发布 /robot_odometry：把 Pose 与 Twist 装进标准消息', time:48,
    intro:'内部变量只有当前 Python 进程能看见。现在创建 Odometry Publisher，把时间、坐标系、位置和速度放进标准消息，让 RViz、记录工具和其他节点能够订阅。本节先使用合法的单位四元数作为临时朝向，下一节再映射完整 theta。',
    route:{learn:'读懂 Odometry 的 Header、PoseWithCovariance 与 TwistWithCovariance 层级', do:'声明 nav_msgs/geometry_msgs 依赖并发布完整基础字段', after:'制作 Odometry 字段来源表'},
    prerequisite:'前置：04.04 的 x、y、theta、linear_velocity、angular_velocity 与 current_time 在同一回调中可用。继续使用 /robot_odometry，绝不覆盖仿真已有 /odom。',
    concepts:[
      {label:'ODOMETRY MESSAGE', title:'一条消息同时包含位姿和速度', definition:'nav_msgs/Odometry 包含 header、child_frame_id、pose 与 twist。pose 表达 child 在 parent 中的位置，twist 表达 child 自身的线/角速度。', detail:'字段嵌套较深：pose.pose.position.x 和 twist.twist.linear.x。Covariance 暂时保留默认值，但真实系统应根据噪声填写。'},
      {label:'FRAME METADATA', title:'odom 与 base_link 描述关系', definition:'header.frame_id="odom"，child_frame_id="base_link" 表示消息估计 base_link 在 odom 中的状态。', detail:'把字符串写进消息不会自动发布 TF。仿真已有自己的 odom→base_link；本章只发布独立 Odometry 消息，避免重复 TF 发布者。'},
      {label:'PUBLISHER', title:'Publisher 把内部状态变成接口', definition:'create_publisher(Odometry, "/robot_odometry", 10) 创建发布端；每次回调填好 odom_msg 后调用 publish。', detail:'Topic 名、消息类型和 QoS 是接口契约。echo 能看到字段不代表公式正确，还要通过行为实验验证。'}
    ],
    chain:{before:'04.04 已在 Node 内得到 Pose 与 Twist', current:'把内部状态映射到带时间和 frame 的标准消息', next:'04.06 将 theta 正确转换成归一化四元数', nodes:[
      {tag:'HEADER', title:'STAMP + ODOM', role:'声明时间与父坐标系', detail:'stamp 使用本次 current_time，确保状态和时间来自同一帧计算。', preview:'header.stamp / frame_id'},
      {tag:'POSE', title:'x / y / orientation', role:'描述 base_link 在 odom 中的位姿', detail:'x、y 来自累计状态；本节 orientation 先设 w=1 的单位四元数。', preview:'pose.pose.position.x'},
      {tag:'TWIST', title:'linear.x / angular.z', role:'描述机体瞬时速度', detail:'直接使用 04.03 的 v 与 w；差速平面模型中 linear.y 设为 0。', preview:'twist.twist.linear.x'},
      {tag:'TOPIC', title:'/robot_odometry', role:'供外部节点订阅验证', detail:'与 /odom 分离，可以同时 echo 两者而不产生发布端冲突。', preview:'self.odom_publisher.publish(odom_msg)'}
    ]},
    lab:{title:'构造第一个合法 Odometry 消息', intro:'先读接口，再改依赖、导入、Publisher 和消息字段。代码用单位四元数 w=1 作为临时有效朝向，不发布全零四元数。', success:'/robot_odometry 有唯一自建发布端，echo 能看到 odom/base_link、x/y、w=1 临时朝向与 v/w；节点停止后发布端消失。', recovery:'Topic 不存在查 Publisher 与 publish 调用；字段全零先确认机器人是否运动；类型错误查 import；包依赖变化后必须重建。', steps:[
      {terminal:'INSPECT · CONTAINER', keep:'SIM 可运行，RUN 先停止', action:'读取 Odometry 的真实字段层级', command:'ros2 interface show nav_msgs/msg/Odometry', expected:'看到 Header header、string child_frame_id、PoseWithCovariance pose、TwistWithCovariance twist。', recovery:'接口不可用时确认 Humble desktop 镜像和 /opt/ros/humble/setup.bash。'},
      {terminal:'IDE · package.xml', keep:'保留 sensor_msgs 依赖', action:'声明消息与四元数依赖', command:`加入：
<depend>nav_msgs</depend>
<depend>geometry_msgs</depend>
<depend>tf_transformations</depend>`, expected:'package.xml 中四项核心运行依赖为 sensor_msgs、nav_msgs、geometry_msgs、tf_transformations。', recovery:'标签必须位于 package 内、export 外；保存后用 grep -n 检查。', manual:true, copyLabel:'复制依赖声明'},
      {terminal:'IDE · odometry_publisher.py', keep:'现有 JointState 订阅与状态保留', action:'导入 Odometry 并在 __init__ 创建 Publisher', command:`导入区加入：
from nav_msgs.msg import Odometry

__init__ 中加入：
self.odom_publisher = self.create_publisher(
    Odometry, '/robot_odometry', 10
)`, expected:'Publisher 只创建一次，位于 __init__；Topic 是 /robot_odometry。', recovery:'不要把 create_publisher 放在高频回调里，也不要使用 /odom 与仿真发布端竞争。', manual:true, copyLabel:'复制 Publisher 代码'},
      {terminal:'IDE · joint_states_callback', keep:'放在积分更新之后', action:'填充并发布基础 Odometry 消息', command:`odom_msg = Odometry()
odom_msg.header.stamp = current_time.to_msg()
odom_msg.header.frame_id = 'odom'
odom_msg.child_frame_id = 'base_link'
odom_msg.pose.pose.position.x = self.x
odom_msg.pose.pose.position.y = self.y
odom_msg.pose.pose.position.z = 0.0
odom_msg.pose.pose.orientation.w = 1.0
odom_msg.twist.twist.linear.x = linear_velocity
odom_msg.twist.twist.linear.y = 0.0
odom_msg.twist.twist.angular.z = angular_velocity
self.odom_publisher.publish(odom_msg)`, expected:'orientation.w 明确为 1.0，不是无效的全零四元数；publish 是本段最后一步。', recovery:'AttributeError 时对照接口层级 pose.pose 与 twist.twist；NameError 查 current_time 与速度变量是否在 return 之后可用。', manual:true, copyLabel:'复制消息代码'},
      {terminal:'BUILD · CONTAINER', keep:'IDE 已保存，SIM 可继续', action:'验证语法并因 package.xml 变化重新构建', command:'cd /home/user/exercises_ws && python3 -m py_compile src/ros2_exercises/ros2_exercises/odometry_publisher.py && colcon build --symlink-install --packages-select ros2_exercises && source install/setup.bash', expected:'语法通过，1 package finished，无 failed。', recovery:'第一条 ERROR 若来自 XML，先修 package.xml；ImportError 时运行 python3 -c 单独验证对应包。'},
      {terminal:'RUN · CONTAINER · KEEP RUNNING', keep:'SIM、/clock 与 /joint_states 正常', action:'启动发布节点', command:'ros2 run ros2_exercises odometry_publisher --ros-args -p use_sim_time:=True', expected:'RUN 保持运行，无 traceback；node info 显示 /robot_odometry Publisher。', recovery:'节点立即退出时保存 traceback；不要用 ros2 topic pub 伪造自己的算法输出。', stop:'保持 RUN，下一步用 INSPECT 验收。'},
      {terminal:'INSPECT · NEW CONTAINER TERMINAL', keep:'SIM 与 RUN 同时运行', action:'读取一帧自建 Odometry', command:'ros2 topic echo /robot_odometry --once', expected:'header.frame_id 为 odom、child_frame_id 为 base_link，position、twist 字段存在，orientation.w 当前为 1.0。', recovery:'一直等待时运行 ros2 topic info /robot_odometry --verbose；发布端存在但无数据则回 RUN 查回调和 /joint_states。', stop:'保存消息后在 RUN 按 Ctrl+C。'}
    ]},
    scenario:{title:'节点在运行，但 /robot_odometry 一直没有消息', symptom:'node list 有 /odometry_publisher，topic info 显示 Publisher count=1，topic echo 一直等待。', question:'下一步最有效的检查是什么？', options:['确认 /joint_states 回调是否触发，并检查 publish 是否位于所有 guard return 之后', '重装 RViz', '把 /robot_odometry 改成 /odom'], correct:0, correctText:'正确。发布端已创建但没有消息，问题位于输入回调或 publish 执行路径。', wrongText:'RViz 和 Topic 改名不会让未执行的回调开始发布。'},
    checks:[
      {prompt:'为什么本节临时设置 orientation.w=1.0？', answer:'它是合法的单位四元数，表示零旋转；全零四元数无效，下一节再用 theta 计算真实朝向。'},
      {prompt:'frame_id 写进消息后会自动出现 TF 吗？', answer:'不会。它只是消息元数据；TF 需要独立 TransformBroadcaster。本仿真已有 TF，本章不重复发布。'},
      {prompt:'为什么 package.xml 改变后要重新构建？', answer:'依赖和安装元数据需要由 colcon 更新到 install 覆盖层，单靠 Python symlink 不会更新这些描述。'}
    ],
    after:{title:'Odometry 字段来源表', text:'为 stamp、frame_id、child_frame_id、position、orientation、linear.x、angular.z 分别写出来源。', deliverable:'提交物：七行字段表、一帧真实 /robot_odometry，以及“消息 frame 不等于 TF”的一句说明。'},
    next:'04.06 · theta、四元数与坐标系验收'
  },

  quaternion_frames: {
    code:'04.06', category:'ORIENTATION / FRAME CONTRACT', title:'把 theta 变成四元数：同时守住 frame 与 TF 的边界', time:42,
    intro:'Odometry 的朝向字段不是一个 theta 数字，而是归一化四元数。二维机器人只有 yaw 变化，但仍要转换为 x、y、z、w。本节替换临时 w=1，并明确“Odometry 消息描述 frame”与“发布 TF”是两件事。',
    route:{learn:'解释 yaw→Quaternion、归一化和 odom/base_link 消息契约', do:'加入 quaternion_from_euler 并验证四元数与已有 /odom 分离', after:'完成三组 yaw 到四元数的预期判断'},
    prerequisite:'前置：04.05 已持续发布 /robot_odometry，orientation 当前是 w=1 的临时值；参考镜像已安装 ros-humble-tf-transformations。',
    concepts:[
      {label:'QUATERNION', title:'四个数表达三维旋转', definition:'Quaternion 使用 x、y、z、w 表达旋转，避免欧拉角某些奇异问题。二维 yaw 仍通过 quaternion_from_euler(0,0,theta) 转换。', detail:'theta=0 时结果接近 (0,0,0,1)；theta=π 时 z 接近 ±1、w 接近 0。不能把 theta 直接塞进 orientation.z。'},
      {label:'NORMALIZATION', title:'合法四元数长度应接近 1', definition:'x²+y²+z²+w² 应接近 1。tf_transformations 返回归一化结果，便于下游正确解释。', detail:'全零四元数长度为 0，是无效姿态；这也是上一节必须显式设置 w=1 的原因。'},
      {label:'FRAME CONTRACT', title:'消息关系不等于 TF 发布者', definition:'Odometry 声明 parent=odom、child=base_link，但只有 TransformBroadcaster 才会把变换发送到 /tf。', detail:'Andino 仿真已有 odom→base_link。再让自建节点发布同一 TF 会产生重复发布者和不一致数据，因此本章只比较消息，不广播 TF。'}
    ],
    chain:{before:'04.05 已发布位置、速度与临时朝向', current:'用 theta 生成合法 orientation 并验证 frame 契约', next:'04.07 绘制路径并比较理想运动与累计误差', nodes:[
      {tag:'YAW', title:'self.theta', role:'二维累计朝向 rad', detail:'来自 04.04 的角速度积分，可超过 ±π，三角函数仍能转换。', preview:'theta [rad]'},
      {tag:'CONVERT', title:'quaternion_from_euler', role:'生成 x、y、z、w', detail:'roll=0、pitch=0，只把 theta 作为 yaw。', preview:'quaternion_from_euler(0, 0, theta)'},
      {tag:'ASSIGN', title:'Quaternion MSG', role:'写入 Odometry orientation', detail:'geometry_msgs/Quaternion 按返回数组四项构造。', preview:'Quaternion(x=..., y=..., z=..., w=...)'},
      {tag:'VERIFY', title:'NORM + TOPIC', role:'证明结果有效且无 Topic 冲突', detail:'echo 自建消息，比较 /odom 与 /robot_odometry 发布端，保持独立。', preview:'ros2 topic info ... --verbose'}
    ]},
    lab:{title:'完成真实朝向与 frame 边界验收', intro:'先用独立 Python 验证库输出，再替换临时 orientation.w=1.0。RUN 与 INSPECT 分开，SIM 保持运行。', success:'转动机器人时 /robot_odometry orientation 改变且四元数长度约 1；/odom 与 /robot_odometry 各自有发布端，自建节点不新增 TF 发布逻辑。', recovery:'ImportError 查镜像依赖；朝向不变查 theta；四元数非法查分量赋值；TF 异常则确认没有添加 TransformBroadcaster。', steps:[
      {terminal:'CALC · CONTAINER', keep:'不需要停止 SIM', action:'验证零 yaw 的四元数输出', command:'python3 -c "from tf_transformations import quaternion_from_euler; print(quaternion_from_euler(0,0,0))"', expected:'结果接近 [0, 0, 0, 1]。', recovery:'ModuleNotFoundError 时核对 ros-humble-tf-transformations 与当前 Python 环境。'},
      {terminal:'IDE · odometry_publisher.py', keep:'保留 Odometry import', action:'加入转换导入并替换临时朝向', command:`导入区加入：
from tf_transformations import quaternion_from_euler
from geometry_msgs.msg import Quaternion

用下面代码替换 orientation.w = 1.0：
odom_quat = quaternion_from_euler(0.0, 0.0, self.theta)
odom_msg.pose.pose.orientation = Quaternion(
    x=odom_quat[0], y=odom_quat[1],
    z=odom_quat[2], w=odom_quat[3]
)`, expected:'临时 w=1.0 行已被替换；theta 只作为第三个 euler 参数。', recovery:'不要把返回数组整体赋给 message 字段；geometry_msgs/Quaternion 需要四个命名分量。', manual:true, copyLabel:'复制四元数代码'},
      {terminal:'BUILD · CONTAINER', keep:'package.xml 已声明 geometry_msgs 与 tf_transformations', action:'做语法和依赖检查', command:'cd /home/user/exercises_ws && python3 -m py_compile src/ros2_exercises/ros2_exercises/odometry_publisher.py && source install/setup.bash', expected:'py_compile 无输出，Python import 没有异常。', recovery:'ImportError 先用 python3 -c 单独导入；SyntaxError 按行号修当前片段。'},
      {terminal:'RUN · CONTAINER · KEEP RUNNING', keep:'SIM 与 /clock 正常', action:'运行带真实朝向的节点', command:'ros2 run ros2_exercises odometry_publisher --ros-args -p use_sim_time:=True', expected:'节点保持运行；短暂旋转机器人时 theta 日志和 orientation 都变化。', recovery:'theta 变化但四元数不变时确认 publish 使用的是修改后的 odom_msg；旧代码时核对编辑路径和 symlink。', stop:'保持 RUN 供 INSPECT 验收。'},
      {terminal:'INSPECT · CONTAINER', keep:'RUN 与 SIM 同时运行', action:'保存一帧朝向并确认两个 Topic 分离', command:'ros2 topic echo /robot_odometry --once && ros2 topic info /odom --verbose && ros2 topic info /robot_odometry --verbose', expected:'自建消息 frame 为 odom/base_link、orientation 非全零；/odom 与 /robot_odometry 是两个独立 Topic。', recovery:'命令卡在第一项时先单独运行 topic info；不要为了得到输出把自建 Publisher 改到 /odom。', stop:'保存证据后在 RUN 按 Ctrl+C。'}
    ]},
    scenario:{title:'theta 明显变化，但 orientation 永远是 x=0,y=0,z=0,w=1', symptom:'位置和速度正常，旋转机器人时消息朝向仍保持单位四元数。', question:'最先检查哪一段？', options:['确认临时 w=1 已被 quaternion_from_euler(self.theta) 的结果替换并在 publish 前执行', '修改 wheel_radius', '删除 child_frame_id'], correct:0, correctText:'正确。theta 已正常，故障位于 theta 到消息 orientation 的映射路径。', wrongText:'轮径和 child frame 不会让已经变化的 theta 自动进入 Quaternion。'},
    checks:[
      {prompt:'为什么不能把 theta 直接赋给 orientation.z？', answer:'orientation 是四元数而不是欧拉角字段，必须将 yaw 转换为归一化 x、y、z、w。'},
      {prompt:'怎样快速判断四元数是否基本有效？', answer:'检查 x²+y²+z²+w² 是否接近 1，并确认不是全零。'},
      {prompt:'为什么本章不发布 odom→base_link TF？', answer:'Andino 仿真已有该 TF；重复发布相同 frame 关系会造成冲突。本章只发布独立 Odometry 消息。'}
    ],
    after:{title:'三种 yaw 朝向卡', text:'分别判断 yaw=0、π/2、π 时四元数中哪些分量应变化，并写出 norm 判断。', deliverable:'提交物：三行预期、一次旋转后的真实 orientation、norm 计算和“不广播 TF”的边界说明。'},
    next:'04.07 · 绘制轨迹并识别轮式里程计误差'
  },

  path_validation: {
    code:'04.07', category:'VISUAL VALIDATION / DRIFT', title:'把轨迹画出来：看见理想公式与真实运动之间的差距', time:50,
    intro:'数字一帧帧变化不容易发现系统误差。参考课程用 matplotlib 保存 x/y 历史并画出轨迹。本节添加可视化，分别执行短直行和短旋转，检查路径形状，同时理解为什么轮子转了不一定等于车体真的移动。',
    route:{learn:'解释轨迹可视化、轮滑、参数误差与累计漂移', do:'加入 PathVisualizer 并完成直行/旋转两组安全实验', after:'形成一份轨迹质量审查'},
    prerequisite:'前置：04.06 的 /robot_odometry 位置和朝向有效；DISPLAY/X11 正常，python3 能 import matplotlib。COMMAND 只做短低速动作，随时准备停止。',
    concepts:[
      {label:'TRAJECTORY', title:'路径是连续位姿的历史', definition:'把每次发布的 x、y 保存到列表并按相同比例绘制，能直观看到直线是否弯曲、旋转是否产生位置漂移。', detail:'坐标轴必须 equal scaling，否则视觉比例会误导。图形是算法输出的可视化，不是外部真值。'},
      {label:'WHEEL SLIP', title:'轮子转动不保证车体等量移动', definition:'编码器只知道轮子转了多少。轮子空转、侧滑或被障碍物阻挡时，公式仍可能积分出位移。', detail:'这正是轮式里程计的基本限制。IMU、相机、激光匹配和地图定位可以提供额外观测来修正。'},
      {label:'PARAMETER ERROR', title:'小参数误差会形成系统偏差', definition:'轮半径同时影响距离，轮距影响角速度。两轮实际半径略有不同，会让理论直线逐渐弯曲。', detail:'校准应使用可测量的真实路线和多次实验，不应根据单张图随意改常数。'}
    ],
    chain:{before:'04.06 已得到标准 Odometry 与有效朝向', current:'用轨迹和受控动作验证里程计假设', next:'04.08 从干净状态完成模块交付与故障恢复', nodes:[
      {tag:'COLLECT', title:'path_x / path_y', role:'保存连续位置历史', detail:'每次回调在 publish 后追加当前坐标。列表只存在于当前进程。', preview:'append(x) · append(y)'},
      {tag:'DRAW', title:'EQUAL AXES', role:'按真实比例绘制轨迹', detail:'清空后重画蓝色历史线和红色当前位置，equal aspect 避免比例失真。', preview:'ax.set_aspect("equal")'},
      {tag:'EXPERIMENT', title:'STRAIGHT + ROTATE', role:'用可预测动作验证形状', detail:'短直行应接近直线，原地旋转应主要改变朝向而不是生成大圆。', preview:'Gazebo Teleop / low speed'},
      {tag:'INTERPRET', title:'DRIFT / SLIP', role:'区分显示与模型误差', detail:'轨迹异常要回到轮输入、参数、dt 和积分逐层定位，不能只调图形。', preview:'input → kinematics → integration'}
    ]},
    lab:{title:'添加路径可视化并完成两组安全运动', intro:'IDE 加入参考课程 PathVisualizer；RUN 显示图形；COMMAND 使用短动作并立即停止。图形窗口失败不影响核心 /robot_odometry，可先保留 Topic 证据。', success:'matplotlib 窗口出现；短直行画出近似直线；短旋转主要让当前位置附近方向变化，x/y 不应大幅漂移。', recovery:'窗口不出现查 DISPLAY 与 matplotlib backend；回调变慢先停止日志刷屏；路径形状异常按输入、公式、dt、积分顺序排查。', steps:[
      {terminal:'PREP · CONTAINER', keep:'DISPLAY 已允许容器显示窗口', action:'单独验证 matplotlib 图形依赖', command:'python3 -c "import matplotlib.pyplot as plt; print(\'matplotlib ready\')"', expected:'输出 matplotlib ready，无 ImportError。', recovery:'缺失时在课程镜像安装 python3-matplotlib；DISPLAY 错误回 00.02，不要先修改里程计公式。'},
      {terminal:'IDE · odometry_publisher.py', keep:'类放在 main 之前，保留 OdometryPublisher', action:'加入参考课程路径绘图类', command:`导入区加入：
import matplotlib.pyplot as plt

在 OdometryPublisher 类之后、main 之前加入：
class PathVisualizer:
    def __init__(self):
        plt.ion()
        self.fig, self.ax = plt.subplots()
        self.ax.set_aspect('equal', adjustable='box')
        self.path_x = []
        self.path_y = []

    def visualize(self, x, y):
        self.path_x.append(x)
        self.path_y.append(y)
        self.ax.clear()
        self.ax.plot(self.path_x, self.path_y, 'b-', label='Path')
        self.ax.plot(x, y, 'ro', label='Current Position')
        self.ax.set_aspect('equal', adjustable='box')
        self.ax.set_xlabel('X Position (m)')
        self.ax.set_ylabel('Y Position (m)')
        self.ax.legend()
        plt.draw()
        plt.pause(0.001)`, expected:'PathVisualizer 与 OdometryPublisher 同级，visualize 方法缩进正确，坐标轴比例设置为 equal。', recovery:'不要把类嵌套到 joint_states_callback；IndentationError 时先折叠代码检查类边界。', manual:true, copyLabel:'复制绘图类'},
      {terminal:'IDE · OdometryPublisher', keep:'Publisher 和 publish 代码保持不变', action:'初始化并在发布后更新轨迹', command:`在 __init__ 中加入：
self.path_visualizer = PathVisualizer()

在 self.odom_publisher.publish(odom_msg) 之后加入：
self.path_visualizer.visualize(
    odom_msg.pose.pose.position.x,
    odom_msg.pose.pose.position.y
)`, expected:'每次有效回调只调用一次 visualize，使用刚发布消息的位置。', recovery:'NameError PathVisualizer 时确认类在 main 调用前已定义；窗口卡顿时先移除高频 info 日志再重试。', manual:true, copyLabel:'复制调用代码'},
      {terminal:'RUN · CONTAINER · KEEP RUNNING', keep:'SIM 运行，DISPLAY 正常', action:'语法检查并启动带路径窗口的节点', command:'cd /home/user/exercises_ws && python3 -m py_compile src/ros2_exercises/ros2_exercises/odometry_publisher.py && source install/setup.bash && ros2 run ros2_exercises odometry_publisher --ros-args -p use_sim_time:=True', expected:'出现 matplotlib 窗口，起点在 0,0 附近；RUN 没有 traceback。', recovery:'cannot connect to display 查 DISPLAY/xhost；Qt/backend 错误保留完整日志，核心 Topic 可先用无图版本继续验收。', stop:'保持 RUN 与图形窗口，完成后续两组动作。'},
      {terminal:'COMMAND · CONTAINER', keep:'SIM、RUN、图形窗口运行，机器人前方有空间', action:'执行短低速直行并明确停止', command:`Gazebo Teleop：低速前进约 2 秒后松开
确认机器人完全停止`, expected:'轨迹从起点延伸成近似直线，位置点停止继续移动。', recovery:'机器人靠近障碍立即停止；轨迹明显弯曲时保存左右轮速与 w，先查轮映射和参数。', stop:'动作结束必须松开控制并确认停止。', manual:true},
      {terminal:'COMMAND · CONTAINER', keep:'SIM、RUN、图形窗口继续运行', action:'执行短低速原地旋转并停止', command:`Gazebo Teleop：低速原地旋转约 2 秒后松开
确认机器人完全停止`, expected:'theta 明显变化，但轨迹当前位置不应产生大幅平移。', recovery:'出现大圆时检查两轮是否真正反向等速、linear_velocity 是否接近 0，以及 dt 是否正常。', stop:'停止机器人，在 RUN 按 Ctrl+C 并关闭绘图窗口。'}
    ]},
    scenario:{title:'机器人顶在障碍物上，轮子仍转，轨迹却继续前进', symptom:'Gazebo 中车体位置几乎不变，但 /joint_states 有轮速，/robot_odometry 的 x 继续增加。', question:'这说明了轮式里程计的什么限制？', options:['编码器观测的是轮子转动，轮滑或受阻时不等于车体真实位移，需要其他传感器修正', 'Quaternion 一定写错了', 'RViz Fixed Frame 应改为 map'], correct:0, correctText:'正确。这是轮式航位推算的可观测性限制，公式本身无法从编码器判断车体是否打滑。', wrongText:'Quaternion 和显示 frame 不会让编码器知道车体被障碍物阻挡。'},
    checks:[
      {prompt:'为什么绘图坐标轴要使用 equal aspect？', answer:'让 x、y 使用相同视觉比例，避免直线、圆和漂移被拉伸或压缩。'},
      {prompt:'路径图能作为真实位置真值吗？', answer:'不能。它只是同一里程计算法的历史输出，仍包含轮滑、参数和积分误差。'},
      {prompt:'哪些观测可以帮助修正轮式里程计漂移？', answer:'IMU、相机、激光扫描匹配、SLAM 或地图定位等外部观测与传感器融合。'}
    ],
    after:{title:'轨迹质量审查', text:'保存直行和旋转轨迹，分别判断形状、比例、停止后漂移，并列出一项公式误差与一项物理假设误差。', deliverable:'提交物：两张轨迹证据、四项审查结论和一个“编码器无法判断”的场景。'},
    next:'04.08 · 里程计综合验收与交付'
  },

  odometry_delivery: {
    code:'04.08', category:'MODULE CHECK / ODOMETRY HANDOFF', title:'综合任务：从干净终端重建并交付轮式里程计', time:58,
    intro:'最后一节从干净 Shell 开始，不依赖旧 RUN 或偶然 source。你要证明依赖、构建、输入、节点、输出、运动行为与停止都成立，并对一个失败现象按“输入 → 运动学 → 时间 → 积分 → 消息”归层。',
    route:{learn:'把代码、依赖、数据链、验证和限制整理成可交接成果', do:'完成一次干净构建、运行、直行/旋转验收与故障归层', after:'提交 Odometry Readiness Packet'},
    prerequisite:'前置：04.01–04.07 已完成，ros2_exercises 源码持久化。开始前停止旧 odometry_publisher 与重复 SIM；准备 BUILD、SIM、RUN、INSPECT 四个容器终端。',
    concepts:[
      {label:'EVIDENCE CHAIN', title:'五层证据不能互相替代', definition:'JointState、机体 v/w、dt/Pose、Odometry 消息和实际运动分别证明不同层。最后画面正常也不能替代中间证据。', detail:'失败时找到“最后一处正常”和“第一处异常”，就能把修改限制在一层。'},
      {label:'CONTROLLED TEST', title:'用可预测动作验收', definition:'静止、短直行、短原地旋转有明确预期：零、主要平移、主要旋转。它们比随意绕场更容易暴露轮序、符号和积分错误。', detail:'每次只做短低速动作，结束后确认停止，再保存证据。安全和可重复性优先于轨迹长度。'},
      {label:'HANDOFF', title:'交付包含假设与限制', definition:'可交接成果不仅有“代码能跑”，还要写明轮径、轮距、frame、Topic、时间基准、未发布 TF、误差来源和恢复路径。', detail:'下一模块路径规划会依赖可信的位姿与速度；隐藏限制会把问题推到更难诊断的下游。'}
    ],
    chain:{before:'04.01–04.07 已分别完成输入、公式、积分、消息和可视化', current:'从干净状态证明整条自建里程计链可复现', next:'05.01 使用地图、Costmap 与规划接口生成路径', nodes:[
      {tag:'BUILD', title:'SOURCE + DEPENDENCIES', role:'代码与包描述可重建', detail:'py_compile、package.xml 与 colcon Summary 共同证明源码和依赖基线。', preview:'colcon build --packages-select ros2_exercises'},
      {tag:'INPUT', title:'SIM + JOINT STATES', role:'提供真实轮速与仿真时间', detail:'SIM 是数据根；/joint_states 和 /clock 缺一不可。', preview:'topic info /joint_states --verbose'},
      {tag:'COMPUTE', title:'ODOMETRY NODE', role:'执行运动学、积分和消息转换', detail:'RUN 日志与 node info 证明同一个进程拥有订阅和发布端。', preview:'ros2 node info /odometry_publisher'},
      {tag:'VERIFY', title:'TOPIC + BEHAVIOR', role:'验证消息与实际动作一致', detail:'静止、直行、旋转三组证据加上限制说明，构成最终交付。', preview:'/robot_odometry + trajectory'}
    ]},
    lab:{title:'完成端到端 Odometry Readiness 验收', intro:'严格按 BUILD → SIM → RUN → INSPECT → CONTROLLED TEST 顺序。页面不执行 ROS 命令，失败后保留第一条错误并停在当前层。', success:'干净构建成功，节点有正确订阅/发布，/robot_odometry 的 frame、Pose、Twist、Quaternion 有效，直行/旋转行为合理，停止后无遗留节点。', recovery:'Package/Import 查依赖与 overlay；无回调查 /joint_states；数值异常查单位/轮序；跳变查 dt；消息异常查字段映射；图形失败不伪装为核心算法失败。', steps:[
      {terminal:'BUILD · CLEAN CONTAINER TERMINAL', keep:'旧节点和旧 SIM 已停止', action:'检查最终源码与依赖声明', command:'cd /home/user/exercises_ws && python3 -m py_compile src/ros2_exercises/ros2_exercises/odometry_publisher.py && grep -E "sensor_msgs|nav_msgs|geometry_msgs|tf_transformations" src/ros2_exercises/package.xml', expected:'py_compile 无输出，grep 显示四项依赖。', recovery:'任何依赖缺失先修 package.xml；语法错误只按首个行号修当前文件。'},
      {terminal:'BUILD · SAME TERMINAL', keep:'源码检查已通过', action:'从基础层重建目标包并加载 Overlay', command:'source /opt/ros/humble/setup.bash && colcon build --symlink-install --packages-select ros2_exercises && source install/setup.bash', expected:'1 package finished、无 failed；ros2 pkg executables ros2_exercises 可列出 odometry_publisher。', recovery:'第一条 colcon ERROR 决定修复层；不要删除 src 或换包名。'},
      {terminal:'SIM · CLEAN CONTAINER TERMINAL · KEEP RUNNING', keep:'BUILD 成功', action:'启动唯一 Andino 仿真', command:'ros2 launch andino_gz andino_gz.launch.py', expected:'Gazebo/RViz 正常，/clock 与 /joint_states 开始发布。', recovery:'重复实例先回旧终端正常停止；图形/模型错误回模块 00 基线。', stop:'综合任务期间保持 SIM 运行。'},
      {terminal:'RUN · CLEAN CONTAINER TERMINAL · KEEP RUNNING', keep:'SIM 正常，使用同一工作空间', action:'加载 Overlay 并启动自建里程计', command:'cd /home/user/exercises_ws && source install/setup.bash && ros2 run ros2_exercises odometry_publisher --ros-args -p use_sim_time:=True', expected:'节点持续运行、绘图窗口出现或核心 Topic 正常，无 traceback。', recovery:'Import/Display 错误分开处理；若绘图 backend 阻塞，可先保存错误并临时禁用可视化验证核心 Topic，但必须在交付中说明。', stop:'保持 RUN 供 INSPECT 与动作验收。'},
      {terminal:'INSPECT · CLEAN CONTAINER TERMINAL', keep:'SIM 与 RUN 同时运行', action:'保存 Node 拓扑与 Topic 契约', command:'source /home/user/exercises_ws/install/setup.bash && ros2 node info /odometry_publisher && ros2 topic info /robot_odometry --verbose', expected:'Node 订阅 /joint_states、发布 /robot_odometry；Publisher count 至少为 1，类型为 nav_msgs/msg/Odometry。', recovery:'订阅缺失查 create_subscription；发布缺失查 create_publisher 与实际运行版本。'},
      {terminal:'INSPECT · SAME TERMINAL', keep:'机器人静止，RUN 继续', action:'验收一帧静止 Odometry', command:'ros2 topic echo /robot_odometry --once', expected:'frame 为 odom/base_link，四元数非全零且 norm 约 1，静止时 linear.x 与 angular.z 接近 0。', recovery:'字段错误按 Header→Pose→Twist 顺序回代码；有速度先检查 /joint_states 是否真为零。'},
      {terminal:'GAZEBO TELEOP + INSPECT', keep:'前方有空间，随时停止', action:'完成短直行、短旋转与停止验收', command:'低速直行约 2 秒并停止；低速原地旋转约 2 秒并停止；分别保存 /robot_odometry', expected:'直行主要改变位置，旋转主要改变 orientation/theta，停止后 Twist 回到接近 0；轨迹形状与行为一致。', recovery:'一旦行为不可解释立即停止。保存 JointState、v/w、dt/Pose、Odometry 五层证据，定位第一处异常后只修一层。', stop:'停止机器人，在 RUN 按 Ctrl+C；INSPECT 确认 /odometry_publisher 从 node list 消失。', manual:true}
    ]},
    scenario:{title:'综合故障：轮速正确、v/w 正确，但 Pose 每隔几秒跳变', symptom:'左右轮映射和运动学日志合理，跳变帧的 dt 明显大于正常回调周期。', question:'故障应归到哪一层，首先修什么？', options:['时间/积分层；检查 /clock、回调阻塞与异常 dt guard', '轮半径层；随机减小 0.033', '消息 frame 层；把 odom 改为 map'], correct:0, correctText:'正确。上游输入和运动学已经成立，直接证据指向时间间隔与积分保护。', wrongText:'参数和 frame 不能解释只在异常 dt 帧发生的跳变。'},
    checks:[
      {prompt:'完整里程计链的五层证据是什么？', answer:'JointState 输入、轮到机体运动学、dt 与 Pose 积分、Odometry 消息、真实运动/轨迹。'},
      {prompt:'为什么三组验收要包含静止、直行和原地旋转？', answer:'它们分别验证零输入、平均速度和轮速差，能清晰暴露漂移、轮序、符号和积分错误。'},
      {prompt:'最终交付必须明确哪些限制？', answer:'轮滑与编码器不可见运动、轮径/轮距误差、累计漂移、时间依赖、消息 frame 不会自动广播 TF。'}
    ],
    after:{title:'Odometry Readiness Packet', text:'整理最终源码、依赖、参数、终端拓扑、五层证据、两种动作轨迹、一次失败恢复和算法限制。', deliverable:'提交物：odometry_publisher.py、package.xml 关键依赖、wheel_radius/separation、Node/Topic 证据、静止/直行/旋转记录、一次单变量修复，以及“05.01 可以依赖什么”的说明。'},
    next:'05.01 · 路径规划：从 Costmap 与目标开始'
  }
};

window.module04Order = [
  'odometry_model',
  'joint_states',
  'differential_kinematics',
  'pose_integration',
  'odometry_message',
  'quaternion_frames',
  'path_validation',
  'odometry_delivery'
];

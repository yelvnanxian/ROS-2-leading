window.module03Lessons = {
  package_model: {
    code: '03.01',
    category: 'MENTAL MODEL / SOURCE TO EXECUTABLE',
    title: '先看懂功能包：代码怎样变成 ros2 run 能找到的程序',
    time: 34,
    intro: '功能包不是“随便建一个 Python 文件夹”。它把源码、依赖、安装规则和可执行入口装进一个可被 ROS 2 索引的交付单元。本节先把 Workspace、Package、Node 和 Executable 的关系讲清楚，再开始创建文件。',
    route: {
      learn: '区分工作空间、功能包、Python 模块、Node 和可执行入口',
      do: '确认 exercises_ws、ROS 2 Humble 与 Turtle Nest 都真实可用',
      after: '画出源码从 src 到 ros2 run 的五段路径'
    },
    prerequisite: '前置：完成 00.03，课程容器正在运行；在容器中使用 /home/user/exercises_ws，在 Ubuntu 宿主机使用 $HOME/exercises_ws。二者通过 src 目录挂载同步。若不确定自己在哪一层，先运行 pwd 和 whoami。',
    concepts: [
      {label:'WORKSPACE', title:'工作空间是建造车间', definition:'Workspace 用来一起管理一个或多个功能包，src 放源码，build 是构建中间产物，install 是 ROS 2 最终查找的覆盖层，log 保存构建记录。', detail:'初学者最常见的错误是在 src 内运行 colcon，或只看到源码就以为 ROS 2 已经认识它。构建要在 /home/user/exercises_ws 根目录进行。'},
      {label:'PACKAGE', title:'功能包是可交付零件盒', definition:'Package 把同一项功能所需的 Python 代码、依赖声明、资源索引和安装规则放在一起，名称在工作空间中必须唯一。', detail:'本课程创建 ros2_exercises。它以后会继续承载 odometry_publisher，而不是每节课重新建一个互不关联的文件夹。'},
      {label:'NODE + ENTRY', title:'Node 与入口不是同一件事', definition:'Node 是运行后加入 ROS Graph 的进程角色；console_scripts 入口告诉 ros2 run 应该调用哪个 Python main 函数。', detail:'文件存在不代表可运行。ros2 run ros2_exercises odometry_publisher 会先查包索引，再查可执行入口，最后才导入 ros2_exercises.odometry_publisher:main。'}
    ],
    chain: {
      before: '00.03 已建立挂载工作空间，01.02 已认识 Node',
      current: '建立从源码到可发现程序的完整模型',
      next: '03.02 用 Turtle Nest 生成标准 ament_python 骨架',
      nodes: [
        {tag:'SOURCE', title:'exercises_ws/src', role:'存放可编辑源码', detail:'宿主机与容器只同步 src。你在 IDE 中修改的功能包源码会出现在容器的 /home/user/exercises_ws/src。', preview:'ls -la /home/user/exercises_ws/src'},
        {tag:'PACKAGE', title:'ros2_exercises', role:'声明边界与依赖', detail:'package.xml 声明 ROS 元数据，setup.py 描述 Python 安装与入口；同名 Python 目录存放节点源码。', preview:'ros2 pkg create --build-type ament_python ...'},
        {tag:'BUILD', title:'colcon + install', role:'生成可被索引的覆盖层', detail:'colcon 读取功能包描述并把结果安装到 install。--symlink-install 会让 Python 源码通过符号链接生效，便于后续练习。', preview:'colcon build --symlink-install'},
        {tag:'DISCOVER', title:'source + ros2 run', role:'让当前终端找到入口', detail:'source install/setup.bash 只影响当前 Shell。它把新覆盖层加入环境，然后 ros2 run 才能找到包和 console_scripts。', preview:'ros2 run ros2_exercises odometry_publisher'}
      ]
    },
    lab: {
      title: '做创建前的四项预检',
      intro: '所有命令都在课程容器 PREP 终端执行。本节不创建功能包，只确认目录、发行版、基础覆盖层和创建工具，避免在向导中途才发现环境错误。',
      success: 'pwd 位于 /home/user/exercises_ws，src 可写，ROS_DISTRO 为 humble，turtle-nest 命令存在。',
      recovery: '任何一项不满足就停在本节。路径问题回到 00.03；命令或依赖缺失时先确认进入的是参考仓库构建出的课程容器。',
      steps: [
        {terminal:'PREP · CONTAINER', keep:'课程 Docker 容器保持 Running', action:'确认当前终端真的在课程工作空间', command:'cd /home/user/exercises_ws && pwd', expected:'输出严格为 /home/user/exercises_ws。', recovery:'No such file or directory 说明容器或镜像不是课程基线；先运行 whoami 和 ls /home/user，再回到 00.03 检查挂载。'},
        {terminal:'PREP · SAME TERMINAL', keep:'仍在 /home/user/exercises_ws', action:'确认源码目录存在且可写', command:'test -d src && test -w src && echo "src ready"', expected:'输出 src ready。', recovery:'无输出时分别运行 ls -ld src 和 mount | grep exercises_ws；宿主机先创建 $HOME/exercises_ws/src，再重新启动 Compose。'},
        {terminal:'PREP · SAME TERMINAL', keep:'保持当前 Shell', action:'确认 ROS 2 Humble 基础环境', command:'source /opt/ros/humble/setup.bash && echo "$ROS_DISTRO"', expected:'输出 humble。', recovery:'setup.bash 不存在说明镜像不正确；输出不是 humble 时不要混用其他发行版终端。'},
        {terminal:'PREP · SAME TERMINAL', keep:'已经 source Humble', action:'确认图形化功能包创建器已安装', command:'command -v turtle-nest', expected:'输出 turtle-nest 的可执行路径。', recovery:'没有输出时先确认使用参考仓库 docker/Dockerfile 构建的镜像；记录 ros-humble-turtle-nest 缺失证据，不要直接跳到无法完成的 GUI 步骤。'}
      ]
    },
    scenario: {
      title: '源码目录存在，但 ros2 run 还找不到任何自建程序',
      symptom: '/home/user/exercises_ws/src 可写，但目前还没有功能包、install 覆盖层或 console_scripts。',
      question: '为什么这时不能直接使用 ros2 run？',
      options: ['还没有完成“创建包 → 构建 → source → 查找入口”的链路', 'Gazebo 没有打开', 'RViz 的 Fixed Frame 不是 map'],
      correct: 0,
      correctText: '正确。ros2 run 依赖包索引与已安装入口，单有一个可写 src 目录还不构成可运行节点。',
      wrongText: '本模块创建普通 ROS 2 Python 节点，不依赖 Gazebo 或 RViz；问题发生在打包和发现链。'
    },
    checks: [
      {prompt:'为什么构建命令不应在 src 目录运行？', answer:'因为 colcon 要从工作空间根目录发现 src 中的包，并在同级生成 build、install 和 log。'},
      {prompt:'Python 文件、Node 和 console_scripts 分别负责什么？', answer:'Python 文件保存代码，Node 是运行后加入 ROS Graph 的角色，console_scripts 把可执行名称映射到 Python main 函数。'},
      {prompt:'宿主机与容器哪个目录会同步？', answer:'本课程 Compose 将宿主机 $HOME/exercises_ws/src 挂载到容器 /home/user/exercises_ws/src。'}
    ],
    after: {title:'源码到运行的五段路径图', text:'画出 src → package metadata → colcon → install overlay → ros2 run，并在每条箭头旁写出一个验证动作。', deliverable:'提交物：五个节点、四条箭头、四条验证命令，以及一句“source 为什么只影响当前终端”。'},
    next: '03.02 · 创建 ros2_exercises 功能包'
  },

  creator_preflight: {
    code: '03.02',
    category: 'PACKAGE CREATION / TURTLE NEST',
    title: '用 Turtle Nest 创建标准 Python 功能包',
    time: 40,
    intro: '这一节只做一件事：用参考仓库自带的 Turtle Nest 向导生成 ros2_exercises，并创建 odometry_publisher 节点骨架。每一个字段都解释用途，同时准备命令行替代路径，避免 GUI 无法启动时卡死。',
    route: {learn:'知道向导中的名称、目标路径、语言、Node 与许可证分别影响什么', do:'创建唯一的 ros2_exercises，并验收关键文件全部出现', after:'保存向导配置清单与功能包目录证据'},
    prerequisite: '前置：03.01 四项预检通过。先运行 test ! -e /home/user/exercises_ws/src/ros2_exercises；如果包已经存在，不要重复创建，直接检查它是否包含 package.xml、setup.py 和 odometry_publisher.py。',
    concepts: [
      {label:'AMENT_PYTHON', title:'选择 Python 构建类型', definition:'ament_python 是 ROS 2 对纯 Python 功能包的标准组织方式，配合 setuptools、package.xml 和 ament 资源索引。', detail:'向导中只保留 Python，取消 C++。同时选择两种语言会生成超出当前学习目标的结构，也会增加构建排错面。'},
      {label:'NAMING', title:'名称会贯穿整条链', definition:'ros2_exercises 同时出现在目录、package.xml、setup.py、Python 模块与 ros2 run 命令中；odometry_publisher 是节点文件和可执行入口名称。', detail:'ROS 2 包名使用小写字母、数字和下划线。名称不一致通常表现为 Package not found、No executable found 或 Python import 错误。'},
      {label:'SAFE CREATION', title:'创建前先防重复', definition:'向导只适合在目标目录不存在时创建。已经存在的同名目录要先检查内容，不能再次点击 Create 覆盖或混入第二套骨架。', detail:'如果之前创建失败，保存现场并检查目录。只有确认是无价值的半成品且完成备份后，才由学习者手动处理；本页面不会自动删除文件。'}
    ],
    chain: {
      before:'03.01 已确认 Workspace 与创建工具', current:'生成一个标准、唯一、可检查的 Python 功能包', next:'03.03 逐层读懂生成出的文件职责',
      nodes: [
        {tag:'LAUNCH', title:'turtle-nest', role:'启动创建向导', detail:'该 GUI 在课程容器中运行，通过 X11 显示到宿主机。窗口不出现时问题在图形显示或软件安装层。', preview:'turtle-nest'},
        {tag:'IDENTITY', title:'NAME + DESTINATION', role:'确定包名和源码位置', detail:'Package name 填 ros2_exercises；Destination 必须指向 /home/user/exercises_ws/src，而不是工作空间根目录。', preview:'ros2_exercises @ /home/user/exercises_ws/src'},
        {tag:'TEMPLATE', title:'PYTHON + NODE', role:'生成语言骨架与首个入口', detail:'只选 Python；Python Node Name 填 odometry_publisher。向导会生成 rclpy Node 类和 setup.py console_scripts。', preview:'Python / odometry_publisher'},
        {tag:'VERIFY', title:'PACKAGE FILES', role:'用文件证据验收', detail:'创建成功至少应看到 package.xml、setup.py、resource、同名 Python 目录以及 odometry_publisher.py。', preview:'find src/ros2_exercises -maxdepth 2 -type f'}
      ]
    },
    lab: {
      title:'完成一次防重复的向导创建',
      intro:'PREP 终端负责检查，GUI 负责创建。若 GUI 因 DISPLAY 无法启动，最后一步提供等价 CLI 替代，但两条路径只能选一条。',
      success:'src/ros2_exercises 只存在一份，package.xml、setup.py、resource 标记、Python 包目录和 odometry_publisher.py 均存在。',
      recovery:'窗口不出现先保存 turtle-nest 的错误；检查 DISPLAY 与 xhost。若改走 CLI，先确认目标目录不存在，绝不能在已创建目录上重复执行。',
      steps: [
        {terminal:'PREP · CONTAINER', keep:'工作空间挂载正常', action:'确认目标目录尚未存在', command:'test ! -e /home/user/exercises_ws/src/ros2_exercises && echo "safe to create"', expected:'首次创建应输出 safe to create。若无输出，说明目录已存在，必须先检查而不是继续。', recovery:'运行 find /home/user/exercises_ws/src/ros2_exercises -maxdepth 2 -type f | sort 判断是否已经创建成功；不要自动删除。'},
        {terminal:'GUI · FROM PREP TERMINAL', keep:'DISPLAY/X11 已在 00.02 验收', action:'启动 Turtle Nest', command:'turtle-nest', expected:'出现 ROS 2 Package Creator 窗口，可以进入 Package 与 Node 配置步骤。', recovery:'cannot open display 时回到 00.02 检查 echo $DISPLAY、xhost 与 Compose DISPLAY 转发；command not found 回到 03.01 镜像检查。', stop:'完成创建后可关闭向导。'},
        {terminal:'TURTLE NEST · GUI', keep:'目标目录仍不存在', action:'填写包名与目标目录', command:'Package name: ros2_exercises · Destination: /home/user/exercises_ws/src', expected:'向导接受名称与路径，并允许进入下一页。', recovery:'路径校验失败时不要改到任意目录；回 PREP 执行 ls -ld /home/user/exercises_ws/src 并确认可写。', manual:true},
        {terminal:'TURTLE NEST · GUI', keep:'沿用上一页设置', action:'只创建 Python 节点骨架', command:'Package Type: Python · 取消 C++ · Python Node Name: odometry_publisher · License: No license', expected:'最终预览显示 ros2_exercises 与 odometry_publisher，点击 Create 后提示成功。', recovery:'若提示目标已存在，停止创建并检查已有目录；不要改一个近似包名来绕过冲突。', manual:true},
        {terminal:'PREP · CONTAINER', keep:'向导已关闭或创建完成', action:'验收五类关键文件', command:'find /home/user/exercises_ws/src/ros2_exercises -maxdepth 2 -type f | sort', expected:'列表包含 package.xml、setup.py、setup.cfg、resource/ros2_exercises、ros2_exercises/__init__.py 与 ros2_exercises/odometry_publisher.py。', recovery:'缺 package.xml 或 setup.py 表示创建不完整；保留目录清单和向导错误。若 GUI 确实不可用且目标目录不存在，可使用：cd /home/user/exercises_ws/src && ros2 pkg create --build-type ament_python --node-name odometry_publisher ros2_exercises。'}
      ]
    },
    scenario: {title:'Turtle Nest 点击创建时提示目标目录已存在', symptom:'src/ros2_exercises 已经出现，但不知道是完整功能包还是上次失败留下的半成品。', question:'第一步应该做什么？', options:['停止创建，用 find 检查 package.xml、setup.py 和节点文件是否齐全', '换成 ros2_exercises_2 继续', '直接覆盖目录'], correct:0, correctText:'正确。先识别已有状态，才能决定继续使用还是人工恢复，避免产生两套名称。', wrongText:'改名或覆盖都会扩大命名和数据风险；当前需要的是只读检查。'},
    checks: [
      {prompt:'Destination 为什么必须是 exercises_ws/src？', answer:'colcon 从工作空间根目录发现 src 下的包，同时该目录已被挂载到宿主机以持久保存源码。'},
      {prompt:'为什么只选 Python？', answer:'本课程下一步使用 rclpy；单一构建类型让目录、依赖和故障范围更清晰。'},
      {prompt:'GUI 失败时可以直接执行 CLI 吗？', answer:'先确认目标目录不存在且 DISPLAY 或工具问题已记录，再选择 CLI 作为替代；两条创建路径不能叠加。'}
    ],
    after:{title:'功能包出生证明', text:'记录向导的四组输入，并把 find 输出按“元数据、安装规则、资源索引、Python 源码”分类。', deliverable:'提交物：包名、路径、语言、节点名、维护者/许可证选择和一份分类后的目录清单。'},
    next:'03.03 · 读懂功能包目录与元数据'
  },

  package_anatomy: {
    code:'03.03', category:'PACKAGE ANATOMY / METADATA', title:'读懂目录：每个文件为什么不能随便删', time:38,
    intro:'创建成功只是得到骨架。现在要知道 package.xml、setup.py、resource 标记、同名 Python 目录和 setup.cfg 分别被谁读取。以后遇到“包能构建但不能运行”，你才能沿正确文件排查。',
    route:{learn:'解释元数据、依赖、Python 安装和资源索引的分工', do:'读取真实文件并核对包名、依赖与 console_scripts', after:'制作一张“错误现象 → 应检查文件”对照表'},
    prerequisite:'前置：03.02 创建结果完整。不要在本节随意修改文件；先以只读方式观察真实内容。IDE 中的红色 import 波浪线不等于容器运行错误，最终以课程容器的 Python 与 colcon 证据为准。',
    concepts:[
      {label:'PACKAGE.XML', title:'ROS 2 身份证与依赖清单', definition:'package.xml 声明包名、版本、维护者、许可证、构建类型和运行/测试依赖，ament 与其他开发者用它理解这个包需要什么。', detail:'Python 代码 import rclpy 或 std_msgs 时，应在 package.xml 声明相应依赖。漏声明可能在本机侥幸运行，却无法在干净环境复现。'},
      {label:'SETUP.PY', title:'Python 安装与可执行入口', definition:'setup.py 告诉 setuptools 要安装哪些 Python 模块、资源文件，以及 console_scripts 名称应该调用哪个 module:main。', detail:'odometry_publisher = ros2_exercises.odometry_publisher:main 左边是 ros2 run 使用的可执行名，右边是 Python 导入路径与函数。'},
      {label:'RESOURCE + INIT', title:'索引标记与 Python 包标记', definition:'resource/ros2_exercises 让 ament 索引识别安装后的包；ros2_exercises/__init__.py 让同名目录成为可导入 Python 包。', detail:'这些文件可能几乎是空的，但“内容少”不等于“没有作用”。删除后会导致发现或导入阶段失败。'}
    ],
    chain:{before:'03.02 已生成标准骨架', current:'把目录结构映射到构建、发现和导入职责', next:'03.04 阅读并修改第一个 rclpy Node', nodes:[
      {tag:'ROS META', title:'package.xml', role:'声明名称、依赖与构建类型', detail:'colcon 和包管理工具读取它。包名与依赖不正确会影响发现和跨机器复现。', preview:'sed -n "1,220p" package.xml'},
      {tag:'PY INSTALL', title:'setup.py + setup.cfg', role:'安装模块和 console_scripts', detail:'setuptools 读取 setup.py；setup.cfg 确保脚本安装到 ros2 run 能查找的位置。', preview:'grep -n "console_scripts" -A 4 setup.py'},
      {tag:'AMENT INDEX', title:'resource marker', role:'注册安装后的功能包', detail:'data_files 把空标记文件安装到 ament_index 的 packages 目录。', preview:'ls -l resource/ros2_exercises'},
      {tag:'PY MODULE', title:'ros2_exercises/', role:'保存可导入节点源码', detail:'__init__.py 标记 Python 包，odometry_publisher.py 提供 main。内外两个同名目录职责不同。', preview:'find ros2_exercises -maxdepth 1 -type f'}
    ]},
    lab:{title:'从真实文件建立职责证据', intro:'STRUCTURE 终端只读检查。每一步都要能说出“这个输出证明了什么”，不要只扫一眼文件名。', success:'能指出包名、构建类型、rclpy/std_msgs 依赖、console_scripts 映射和资源标记位置。', recovery:'文件内容与预期不一致时先和 03.02 的创建字段核对；不要边看边批量修改。包名不一致需要逐处评估，不能只改一个字符串。', steps:[
      {terminal:'STRUCTURE · CONTAINER', keep:'ros2_exercises 源码存在', action:'获取两层目录全貌', command:'cd /home/user/exercises_ws/src/ros2_exercises && find . -maxdepth 2 -type f | sort', expected:'能把文件分成 ROS 元数据、Python 安装规则、ament 资源和节点源码四组。', recovery:'目录不存在回到 03.02；文件太少时保留输出并检查创建是否完整。'},
      {terminal:'STRUCTURE · SAME TERMINAL', keep:'仍在包根目录', action:'读取 ROS 元数据与依赖', command:'sed -n "1,220p" package.xml', expected:'看到 name=ros2_exercises、ament_python 构建类型，以及 rclpy、std_msgs 等生成节点所需依赖。', recovery:'包名不同先核对是否进入错误目录；缺依赖时记录 import 与 package.xml 的差异，后续修改后必须重建。'},
      {terminal:'STRUCTURE · SAME TERMINAL', keep:'仍在包根目录', action:'定位 ros2 run 的入口映射', command:'grep -n "console_scripts" -A 5 setup.py', expected:'看到 odometry_publisher = ros2_exercises.odometry_publisher:main。', recovery:'没有匹配时完整查看 setup.py；左侧入口名、右侧模块或 main 缺失都会导致 No executable found 或导入失败。'},
      {terminal:'STRUCTURE · SAME TERMINAL', keep:'仍在包根目录', action:'确认资源标记和 Python 包标记都存在', command:'test -f resource/ros2_exercises && test -f ros2_exercises/__init__.py && echo "index and import markers ready"', expected:'输出 index and import markers ready。', recovery:'任何文件缺失都回到目录清单定位；不要用同名普通文件夹替代标准结构。'}
    ]},
    scenario:{title:'colcon 能看到包，但 ros2 run 提示 No executable found', symptom:'package.xml 和 resource 存在，构建也完成，但可执行入口列表为空。', question:'最先检查哪个文件的哪一部分？', options:['setup.py 的 entry_points → console_scripts 映射', 'Gazebo world 文件', 'RViz Display'], correct:0, correctText:'正确。包已被发现，失败发生在可执行入口层，应检查 console_scripts。', wrongText:'当前问题与仿真和可视化无关，证据已经指向 Python 安装入口。'},
    checks:[
      {prompt:'package.xml 和 setup.py 都有包名，为什么不能只保留一个？', answer:'它们服务不同工具链：package.xml 描述 ROS 元数据与依赖，setup.py 描述 Python 安装、资源和入口。'},
      {prompt:'console_scripts 映射左右两边分别是什么？', answer:'左边是 ros2 run 使用的可执行名称，右边是 Python 模块路径和 main 函数。'},
      {prompt:'resource 标记文件是空的，可以删除吗？', answer:'不可以。它通过安装规则注册到 ament 资源索引，内容为空也承担发现职责。'}
    ],
    after:{title:'故障到文件的路由表', text:'为 Package not found、No executable found、ModuleNotFoundError、缺依赖四种现象分别写出第一检查文件。', deliverable:'提交物：四行对照表，每行包含现象、文件、关键字段和一条只读检查命令。'},
    next:'03.04 · 阅读并修改第一个 rclpy Node'
  },

  python_node: {
    code:'03.04', category:'RCLPY NODE / CODE READING', title:'读懂第一个 Node：init、spin 与 shutdown 在做什么', time:42,
    intro:'现在第一次进入 Python 源码。目标不是背模板，而是理解进程从初始化 ROS 2、创建 Node、进入事件循环，到 Ctrl+C 后清理资源的完整生命周期；然后只改一条日志，留下可验证的个人修改。',
    route:{learn:'解释 Node 继承、构造函数、logger、spin 与销毁顺序', do:'修改启动日志并先通过 Python 语法检查', after:'用生命周期图解释程序为什么会一直运行'},
    prerequisite:'前置：03.03 已找到 ros2_exercises/odometry_publisher.py 与 setup.py 入口。使用宿主机 IDE 或容器内编辑器修改挂载源码；本节只改日志文本，不提前编写里程计发布逻辑。',
    concepts:[
      {label:'RCLPY.INIT', title:'先初始化客户端库', definition:'rclpy.init(args=args) 建立 ROS 2 Python 客户端上下文，解析 ROS 参数并准备与中间件交互。', detail:'它不是创建具体 Node；真正的节点对象在 OdometryPublisher() 时产生。先 init、后创建、最后 shutdown 是生命周期边界。'},
      {label:'NODE + LOGGER', title:'类继承得到 ROS 能力', definition:'OdometryPublisher(Node) 继承 rclpy.node.Node；super().__init__("odometry_publisher") 注册节点名，get_logger().info 把带节点信息的日志送到终端。', detail:'类名、文件名、可执行名和运行时节点名可以不同，但初学阶段保持一致更容易排错。'},
      {label:'SPIN + CLEANUP', title:'事件循环与可控退出', definition:'rclpy.spin(node) 让进程持续处理回调；Ctrl+C 触发 KeyboardInterrupt，随后 destroy_node 和 try_shutdown 释放资源。', detail:'启动日志只打印一次后终端保持占用是正常现象，不是卡死。未来 Timer、订阅者和 Service 回调都依赖 spin 被调度。'}
    ],
    chain:{before:'03.03 已把 console_scripts 指向 module:main', current:'理解 main 创建和维持 Node 的运行生命周期', next:'03.05 构建并 source 覆盖层', nodes:[
      {tag:'IMPORT', title:'rclpy + Node', role:'引入客户端库与基类', detail:'import 成功取决于课程容器的 ROS 环境；宿主机 IDE 未配置解释器时出现红线不等于容器失败。', preview:'from rclpy.node import Node'},
      {tag:'CREATE', title:'OdometryPublisher()', role:'注册运行时节点', detail:'构造函数调用 super 并打印一次启动日志。此时节点才会出现在 ROS Graph。', preview:'super().__init__("odometry_publisher")'},
      {tag:'SPIN', title:'rclpy.spin(node)', role:'持续等待与执行回调', detail:'没有回调时它也会保持进程存活。之后里程计发布 Timer 才能由执行器周期调度。', preview:'rclpy.spin(odometry_publisher)'},
      {tag:'CLEAN', title:'destroy + shutdown', role:'释放节点与上下文', detail:'Ctrl+C 后按顺序退出，避免上下文仍被使用或资源异常残留。', preview:'destroy_node() → try_shutdown()'}
    ]},
    lab:{title:'完成一次最小、可验证的源码修改', intro:'CODE 终端用于只读和语法检查，IDE 用于编辑。不要把网页显示当作已经修改文件；必须在真实源码中保存。', success:'启动日志改为包含自己的标记，python3 -m py_compile 无输出且生成文件的 console_scripts 仍指向 main。', recovery:'语法检查失败只修当前 Python 文件，按错误行号检查引号、缩进和括号；不要通过删除 main 或 spin 来让错误消失。', steps:[
      {terminal:'CODE · CONTAINER', keep:'源码目录已挂载', action:'先完整阅读生成的节点源码', command:'sed -n "1,220p" /home/user/exercises_ws/src/ros2_exercises/ros2_exercises/odometry_publisher.py', expected:'看到 rclpy import、OdometryPublisher(Node)、main、rclpy.init、spin、destroy_node 和 try_shutdown。', recovery:'文件不存在回 03.02；内容不同则依据真实代码标记对应生命周期，不要盲目覆盖为截图。'},
      {terminal:'IDE · HOST OR CONTAINER', keep:'编辑的必须是挂载目录中的同一文件', action:'把启动日志改成可识别的个人证据', command:'将 get_logger().info(...) 的文字改为：odometry publisher ready - <你的名字或编号>', expected:'保存后 CODE 终端重新运行 grep 能看到新文本，其他生命周期代码未被删除。', recovery:'保存后容器看不到变化时运行 realpath 确认编辑路径，并回 00.03 检查宿主机到容器的 src 挂载。', manual:true},
      {terminal:'CODE · CONTAINER', keep:'IDE 已保存文件', action:'证明宿主机修改已经同步到容器', command:'grep -n "odometry publisher ready" /home/user/exercises_ws/src/ros2_exercises/ros2_exercises/odometry_publisher.py', expected:'输出日志所在行并包含你的标记。', recovery:'没有输出先检查编辑是否保存、大小写和路径，不要继续构建旧代码。'},
      {terminal:'CODE · SAME TERMINAL', keep:'已经看到修改文本', action:'在构建前做 Python 语法检查', command:'python3 -m py_compile /home/user/exercises_ws/src/ros2_exercises/ros2_exercises/odometry_publisher.py', expected:'命令无输出并返回到提示符，代表语法解析通过。', recovery:'SyntaxError 会给出行号和插入符；只修该行附近的缩进、引号或括号，保存后重跑同一命令。'}
    ]},
    scenario:{title:'IDE 标红 rclpy，但容器 py_compile 可以通过', symptom:'宿主机 IDE 使用普通 Python 解释器，无法解析 ROS 2 路径；课程容器中的语法检查没有错误。', question:'此时应该如何判断？', options:['把 IDE 红线记录为解释器配置问题，以容器运行证据继续，不要删除 rclpy import', '删除 rclpy 让红线消失', '重装 Gazebo'], correct:0, correctText:'正确。执行环境是课程容器；IDE 可后续配置容器解释器，但不能为消除提示破坏 ROS 代码。', wrongText:'rclpy 是节点必需依赖，Gazebo 与 Python import 提示无关。'},
    checks:[
      {prompt:'为什么日志打印一次后进程还不退出？', answer:'main 进入 rclpy.spin，进程持续等待和执行回调，直到 Ctrl+C 或上下文关闭。'},
      {prompt:'super().__init__("odometry_publisher") 做了什么？', answer:'初始化 Node 基类并注册运行时节点名，使对象具备 ROS Graph、日志和通信能力。'},
      {prompt:'为什么先 py_compile 再 colcon build？', answer:'它能更快、在更小范围内定位纯 Python 语法错误，避免把简单问题混入完整构建日志。'}
    ],
    after:{title:'Node 生命周期注释图', text:'用 init → construct → log → spin → Ctrl+C → destroy → shutdown 画流程，并写出每步由哪个函数负责。', deliverable:'提交物：七个生命周期节点、一张修改后日志行截图和一次 py_compile 成功证据。'},
    next:'03.05 · colcon 构建与 source 覆盖层'
  },

  build_overlay: {
    code:'03.05', category:'COLCON / OVERLAY', title:'构建与 source：让当前终端真正认识新功能包', time:38,
    intro:'源码和语法都正确后，仍然不能直接假设 ros2 run 能找到它。colcon 负责生成 install 覆盖层，source 负责把覆盖层加入当前 Shell。本节会明确“什么时候要重建、什么时候只要重新 source”。',
    route:{learn:'区分 build、install、log 与 Shell overlay', do:'只构建 ros2_exercises 并证明包和入口可发现', after:'制作一张构建/source 决策卡'},
    prerequisite:'前置：03.04 py_compile 通过。新开 BUILD 终端，在工作空间根目录执行；不要在运行节点的 RUN 终端同时构建。第一次构建前 source /opt/ros/humble/setup.bash。',
    concepts:[
      {label:'COLCON', title:'构建是读取描述并安装', definition:'colcon 扫描 src 中的 package.xml，按依赖顺序调用对应构建类型，并把可运行结果放入 install。', detail:'--packages-select ros2_exercises 把本节日志限制在目标包。成功摘要中的 Finished 不等于当前终端已 source。'},
      {label:'SYMLINK INSTALL', title:'Python 源码用符号链接迭代', definition:'--symlink-install 让 install 中的 Python 模块指向 src，后续只改 .py 通常不必重建；新增入口、依赖或安装资源仍要重建。', detail:'这不是“永远不构建”。setup.py、package.xml、launch、资源安装规则或新 console_scripts 变化都需要再次运行 colcon。'},
      {label:'OVERLAY', title:'source 只改变当前 Shell', definition:'source install/setup.bash 把这个工作空间叠加到 /opt/ros/humble 基础环境上，新的终端不会自动继承已打开终端的环境。', detail:'每次重开容器或新终端，都要 source 基础层和当前工作空间。Package not found 时先检查环境，而不是重新创建包。'}
    ],
    chain:{before:'03.04 源码语法已通过', current:'生成 install 覆盖层并注入当前 Shell', next:'03.06 运行节点并从另一终端观察 Graph', nodes:[
      {tag:'UNDERLAY', title:'/opt/ros/humble', role:'提供 rclpy 与基础工具', detail:'基础 ROS 2 是下层环境，必须先 source，工作空间才能在其上构建。', preview:'source /opt/ros/humble/setup.bash'},
      {tag:'DISCOVER', title:'colcon list', role:'证明源码包可被发现', detail:'构建前先看到 ros2_exercises 和 ament_python，可快速排除路径与 package.xml 问题。', preview:'colcon list | grep ros2_exercises'},
      {tag:'INSTALL', title:'colcon build', role:'生成工作空间覆盖层', detail:'成功后出现 install/ros2_exercises，并把 console_scripts 安装到 lib/ros2_exercises。', preview:'colcon build --symlink-install --packages-select ros2_exercises'},
      {tag:'OVERLAY', title:'install/setup.bash', role:'让当前 Shell 查到新包', detail:'source 后 ros2 pkg prefix 与 ros2 pkg executables 才应列出新功能包和入口。', preview:'source install/setup.bash'}
    ]},
    lab:{title:'完成一次可解释的构建与发现验收', intro:'BUILD 终端负责构建和 source；不要关闭它，下一节会另开 RUN 终端。构建警告与错误要区分：参考仓库截图中的部分 warning 可记录，但 Failed 必须处理。', success:'构建摘要无 Failed，ros2 pkg prefix 指向 /home/user/exercises_ws/install，executables 列出 odometry_publisher。', recovery:'失败时从日志第一条 ERROR 向上读取命令与文件；不要只看最后的 Aborted。修改后重跑同一个 packages-select 构建，再 source。', steps:[
      {terminal:'BUILD · NEW CONTAINER TERMINAL', keep:'源码与 03.04 修改已保存', action:'进入正确根目录并 source 基础层', command:'cd /home/user/exercises_ws && source /opt/ros/humble/setup.bash && pwd', expected:'输出 /home/user/exercises_ws。', recovery:'路径错误回 00.03；基础 setup 缺失说明容器镜像不正确。'},
      {terminal:'BUILD · SAME TERMINAL', keep:'仍在工作空间根目录', action:'构建前确认 colcon 能发现目标包', command:'colcon list | grep "^ros2_exercises"', expected:'输出 ros2_exercises、源码路径与 ament_python。', recovery:'无输出时检查 src/ros2_exercises/package.xml 的 name 与 build_type，并确认当前目录不是 src。'},
      {terminal:'BUILD · SAME TERMINAL', keep:'基础层已经 source', action:'仅构建目标 Python 功能包', command:'colcon build --symlink-install --packages-select ros2_exercises', expected:'看到 Starting/Finished ros2_exercises，Summary 中 1 package finished 且没有 failed。warning 可记录后继续。', recovery:'从第一条 ERROR 定位源码、setup.py、package.xml 或依赖；修复后重跑同一命令。不要删除整个工作空间。'},
      {terminal:'BUILD · SAME TERMINAL', keep:'构建已成功', action:'把新 install 覆盖层加入当前 Shell', command:'source install/setup.bash && ros2 pkg prefix ros2_exercises', expected:'输出位于 /home/user/exercises_ws/install/ros2_exercises 的路径。', recovery:'Package not found 时确认 source 的是当前工作空间 install/setup.bash，并运行 echo $AMENT_PREFIX_PATH 检查覆盖层顺序。'},
      {terminal:'BUILD · SAME TERMINAL', keep:'当前 Shell 已 source overlay', action:'确认 odometry_publisher 入口已安装', command:'ros2 pkg executables ros2_exercises', expected:'列表包含 ros2_exercises odometry_publisher。', recovery:'包可发现但入口缺失时回 03.03 检查 setup.py console_scripts，重建并重新 source。'}
    ]},
    scenario:{title:'构建成功，新终端却提示 Package not found', symptom:'BUILD 终端能找到 ros2_exercises，但刚打开的 RUN 终端不能。', question:'最可能缺少哪一步？', options:['在 RUN 终端 source /home/user/exercises_ws/install/setup.bash', '重新创建功能包', '启动 slam_toolbox'], correct:0, correctText:'正确。source 是 Shell 局部状态，新终端必须再次加载 overlay。', wrongText:'功能包已经构建成功，问题是新 Shell 未加载环境，与 SLAM 无关。'},
    checks:[
      {prompt:'构建成功为什么不等于所有终端都能 ros2 run？', answer:'构建生成 install，但每个 Shell 必须单独 source 覆盖层才能把它加入查找路径。'},
      {prompt:'只改 .py 日志后为什么通常不必重建？', answer:'--symlink-install 让安装层 Python 模块链接到源码；但入口、依赖和安装规则变化仍需重建。'},
      {prompt:'构建失败时为什么先找第一条 ERROR？', answer:'后面的 Aborted 或 Summary 往往只是上游失败的结果，第一条具体错误更接近根因。'}
    ],
    after:{title:'构建与 source 决策卡', text:'分别写出修改 .py、修改 setup.py、新开终端、重启容器四种情况下一步做什么。', deliverable:'提交物：四行决策表、一次成功 Summary、pkg prefix 与 executables 三条证据。'},
    next:'03.06 · 运行节点并观察 ROS Graph'
  },

  run_inspect: {
    code:'03.06', category:'ROS2 RUN / GRAPH EVIDENCE', title:'运行并观察：证明你的代码真的成为了 ROS 2 Node', time:36,
    intro:'最后把功能包入口运行起来，但不能只看到一句日志就结束。你要在 RUN 终端维持节点，在 INSPECT 终端重新 source 后检查节点列表和节点信息，再用 Ctrl+C 观察干净退出。',
    route:{learn:'解释 ros2 run 的包查找、入口加载和运行时注册', do:'启动 odometry_publisher 并收集日志与 Graph 双重证据', after:'写一份两终端复现说明'},
    prerequisite:'前置：03.05 executables 已列出 odometry_publisher。准备 RUN 与 INSPECT 两个新容器终端；二者都要 source /home/user/exercises_ws/install/setup.bash。此节点不依赖 Gazebo、RViz 或 Andino 仿真。',
    concepts:[
      {label:'ROS2 RUN', title:'从包索引加载入口', definition:'ros2 run 接收包名和可执行名，在已 source 的 ament 索引中查包，再执行 setup.py 安装出的 console_scripts。', detail:'Package not found、No executable found 和 Python traceback 是三个不同层：覆盖层、入口、代码导入。错误类型决定下一项检查。'},
      {label:'GRAPH EVIDENCE', title:'日志与 Graph 证明不同事实', definition:'启动日志证明 main 和构造函数已经执行；ros2 node list/info 证明 Node 正在运行并加入 ROS Graph。', detail:'只保存终端日志不能说明观察时节点仍存活；只看到节点名也不能证明运行的是你刚修改的源码。两类证据要配对。'},
      {label:'CTRL+C', title:'主动结束是生命周期的一部分', definition:'Ctrl+C 触发 KeyboardInterrupt，模板捕获后销毁 Node 并关闭 rclpy 上下文，让终端回到提示符。', detail:'如果使用 kill -9，就无法验证清理路径。正常练习优先 Ctrl+C，并在 INSPECT 中确认节点从列表消失。'}
    ],
    chain:{before:'03.05 已构建并发现 console_scripts', current:'把安装入口变成真实运行节点与可观察证据', next:'03.07 综合交付并掌握常见失败恢复', nodes:[
      {tag:'RESOLVE', title:'PACKAGE + EXECUTABLE', role:'定位安装入口', detail:'RUN 终端的 overlay 决定命令解析到哪个功能包版本。', preview:'ros2 pkg executables ros2_exercises'},
      {tag:'IMPORT', title:'module:main', role:'加载 Python 模块', detail:'console_scripts 导入 ros2_exercises.odometry_publisher 并调用 main。导入错误会直接显示 Python traceback。', preview:'ros2_exercises.odometry_publisher:main'},
      {tag:'REGISTER', title:'/odometry_publisher', role:'加入 ROS Graph', detail:'构造 Node 后，其他 source 同一 ROS_DOMAIN_ID 的终端可通过发现机制看到它。', preview:'ros2 node list'},
      {tag:'STOP', title:'CTRL+C + CLEANUP', role:'从 Graph 干净离开', detail:'停止后节点名应消失，RUN 终端回到 Shell，不留下重复实例。', preview:'Ctrl+C → ros2 node list'}
    ]},
    lab:{title:'完成两终端运行与观察验收', intro:'RUN 是长运行终端，INSPECT 只做查询。每个新终端都单独 source；不要在同一个终端启动节点后试图继续输入检查命令。', success:'RUN 显示个人日志并保持运行，INSPECT 能看到 /odometry_publisher；Ctrl+C 后节点消失且无持续 traceback。', recovery:'按错误层恢复：Package not found 查 source，No executable 查 setup.py 与重建，ModuleNotFoundError 查模块路径/依赖，重复节点先停止旧 RUN。', steps:[
      {terminal:'RUN · NEW CONTAINER TERMINAL · KEEP RUNNING', keep:'03.05 构建成功', action:'加载 overlay 并再次确认入口', command:'cd /home/user/exercises_ws && source install/setup.bash && ros2 pkg executables ros2_exercises', expected:'列出 ros2_exercises odometry_publisher。', recovery:'Package not found 先核对 pwd 与 install/setup.bash；入口缺失回 03.05 重建。'},
      {terminal:'RUN · SAME TERMINAL · KEEP RUNNING', keep:'当前 Shell 已 source', action:'启动你的第一个 ROS 2 Python 节点', command:'ros2 run ros2_exercises odometry_publisher', expected:'打印包含 odometry publisher ready 与你的标记的 INFO，随后终端保持占用且没有 traceback。', recovery:'No executable found 查 console_scripts；ModuleNotFoundError 查右侧模块路径和依赖；旧日志说明未编辑正确源码或 overlay 指向其他工作空间。', stop:'保持运行，等 INSPECT 完成后再按 Ctrl+C。'},
      {terminal:'INSPECT · NEW CONTAINER TERMINAL', keep:'RUN 必须继续运行', action:'为查询终端加载同一覆盖层', command:'cd /home/user/exercises_ws && source install/setup.bash && ros2 node list', expected:'列表包含 /odometry_publisher。', recovery:'看不到节点时先确认 RUN 没退出，再比较 echo $ROS_DOMAIN_ID；同机课程默认应在同一发现域。'},
      {terminal:'INSPECT · SAME TERMINAL', keep:'RUN 继续运行', action:'读取运行时节点信息', command:'ros2 node info /odometry_publisher', expected:'输出节点名及 Publishers、Subscribers、Service Servers 等分区；当前骨架没有里程计发布器是正常的。', recovery:'Unknown node 说明节点已退出或发现域不同；回 RUN 看 traceback，不要伪造节点名。'},
      {terminal:'RUN + INSPECT', keep:'已经保存日志和 node info', action:'验证干净停止和 Graph 更新', command:'RUN 按 Ctrl+C；随后 INSPECT 再运行 ros2 node list', expected:'RUN 回到提示符且没有持续异常；/odometry_publisher 从列表消失。', recovery:'仍存在时检查是否有另一个同名 RUN；用 ps -ef | grep odometry_publisher 只读定位进程，再回对应终端正常停止。', manual:true}
    ]},
    scenario:{title:'ros2 run 打印正确日志，但 INSPECT 看不到节点', symptom:'RUN 终端似乎仍在占用，INSPECT 的 node list 没有 /odometry_publisher。', question:'第一组检查是什么？', options:['确认 RUN 没有 traceback/已退出，并比较两个终端的 ROS_DOMAIN_ID 与 overlay', '修改 RViz Fixed Frame', '重新保存 SLAM 地图'], correct:0, correctText:'正确。运行状态和发现域直接决定 Graph 可见性，应先检查这两个证据。', wrongText:'这个独立 Python 节点不依赖 RViz 或地图，当前问题发生在进程和 DDS 发现层。'},
    checks:[
      {prompt:'启动日志和 ros2 node list 分别证明什么？', answer:'日志证明代码执行到构造函数；node list 证明节点在观察时仍运行并加入 ROS Graph。'},
      {prompt:'为什么 INSPECT 也要 source？', answer:'它需要同一 ROS 2 环境和工作空间工具上下文；新 Shell 不继承 RUN 的 source 状态。'},
      {prompt:'为什么当前 node info 没有里程计 Topic 也是正常的？', answer:'本章只生成 Node 骨架和日志，真正的 Odometry Publisher 会在下一模块实现。'}
    ],
    after:{title:'两终端复现卡', text:'写出 RUN 与 INSPECT 的准备、命令、应看到的证据、停止方式和失败分支，让另一位新手独立复现。', deliverable:'提交物：正确日志、node list、node info、停止后列表和一张双终端职责表。'},
    next:'03.07 · 构建失败恢复与模块交付'
  },

  field_delivery: {
    code:'03.07', category:'FIELD CHECK / PACKAGE DELIVERY', title:'综合交付：从干净终端重建、运行并定位一次故障', time:50,
    intro:'模块最后不再告诉你每个按钮填什么。你要从干净终端证明源码位置、包描述、构建、source、入口、运行和 Graph 全部成立，并把常见错误路由到正确层。最终成果将直接作为下一模块编写里程计节点的起点。',
    route:{learn:'用错误文本把故障归类到发现、入口、导入、依赖或运行层', do:'从干净 Shell 完成构建到停止的端到端验收', after:'提交 Package Readiness Packet'},
    prerequisite:'前置：03.01–03.06 已学习，ros2_exercises 源码已持久化。开始前停止旧 odometry_publisher；新开 BUILD、RUN、INSPECT 三个容器终端，不依赖之前终端残留的 source。',
    concepts:[
      {label:'CLEAN SHELL', title:'干净终端暴露隐藏依赖', definition:'新 Shell 没有旧命令、工作目录或 overlay 状态，能验证记录是否真的足够让别人复现。', detail:'如果流程只在一个用过很久的终端成功，就可能依赖未记录的 source、环境变量或旧构建产物。'},
      {label:'ERROR ROUTING', title:'先按错误文字分层', definition:'Package not found 查 overlay；No executable found 查 console_scripts/重建；ModuleNotFoundError 查模块路径或依赖；SyntaxError 查源码行号。', detail:'不同错误不应使用同一种“重启容器”疗法。先保留原始错误，再做一次最小修复并重跑同一命令。'},
      {label:'HANDOFF', title:'交付的是可继续开发的基线', definition:'完整成果包含源码、元数据、构建证据、运行证据、终端职责和恢复记录，下一模块会在同一 odometry_publisher.py 中实现真正里程计。', detail:'不要为了让本章显得完成而伪造 Odometry Topic。本章验收的是功能包与 Node 生命周期。'}
    ],
    chain:{before:'03.01–03.06 已分别验证创建、结构、代码、构建与运行', current:'从干净状态完成可交接的功能包验收', next:'04.01 在同一功能包中实现轮式里程计', nodes:[
      {tag:'SOURCE', title:'PERSISTED PACKAGE', role:'源码与元数据完整', detail:'src/ros2_exercises 是宿主机持久化资产，包含个人日志修改。', preview:'find src/ros2_exercises -maxdepth 2 -type f'},
      {tag:'BUILD', title:'FRESH COLCON', role:'从基础层生成 overlay', detail:'干净 BUILD 终端只选择目标包，Summary 必须无 Failed。', preview:'colcon build --symlink-install --packages-select ros2_exercises'},
      {tag:'RUN + GRAPH', title:'NODE EVIDENCE', role:'入口和运行时都成立', detail:'RUN 日志与 INSPECT Graph 配对证明 console_scripts、import、main、Node 初始化和发现都正常。', preview:'ros2 run + ros2 node info'},
      {tag:'HANDOFF', title:'READINESS PACKET', role:'支持下一位学习者复现', detail:'记录一次失败、唯一修复和回归，说明下一模块从哪个文件继续。', preview:'Package Readiness Packet'}
    ]},
    lab:{title:'完成端到端功能包验收', intro:'严格按 BUILD → RUN → INSPECT 顺序。页面不会验证你的真实终端；只有输出符合说明才确认。任一步失败就停在当前层。', success:'从干净 Shell 构建成功、入口可见、节点运行、Graph 可查、Ctrl+C 后消失，并完成一次错误分层说明。', recovery:'不删除源码、不换近似包名、不一次改多个文件。保存原始错误，按错误层执行一项检查，修复后重跑同一失败命令。', steps:[
      {terminal:'BUILD · CLEAN CONTAINER TERMINAL', keep:'旧节点已经停止', action:'证明源码包与个人修改仍持久存在', command:'cd /home/user/exercises_ws && grep -n "odometry publisher ready" src/ros2_exercises/ros2_exercises/odometry_publisher.py', expected:'输出包含个人标记的日志行。', recovery:'文件不存在查宿主机挂载；文本不存在回 03.04，不要继续构建错误版本。'},
      {terminal:'BUILD · SAME TERMINAL', keep:'源码证据成立', action:'从基础层重新构建目标包', command:'source /opt/ros/humble/setup.bash && colcon build --symlink-install --packages-select ros2_exercises', expected:'1 package finished，无 failed。', recovery:'找到第一条 ERROR，按文件和行号处理；完成唯一修复后重跑同一命令。'},
      {terminal:'BUILD · SAME TERMINAL', keep:'构建已完成', action:'加载 overlay 并证明入口存在', command:'source install/setup.bash && ros2 pkg executables ros2_exercises', expected:'列出 odometry_publisher。', recovery:'Package not found 查 source；入口缺失查 setup.py、重建和重新 source。'},
      {terminal:'RUN · CLEAN CONTAINER TERMINAL · KEEP RUNNING', keep:'BUILD 成功', action:'在独立终端启动节点', command:'cd /home/user/exercises_ws && source install/setup.bash && ros2 run ros2_exercises odometry_publisher', expected:'出现个人日志，随后保持运行且无 traceback。', recovery:'根据完整错误区分 Package、Executable、Module、Dependency 或 Syntax 层，只处理第一处根因。', stop:'保持运行到 INSPECT 验收完成。'},
      {terminal:'INSPECT · CLEAN CONTAINER TERMINAL', keep:'RUN 继续运行', action:'保存运行时 Graph 证据', command:'source /home/user/exercises_ws/install/setup.bash && ros2 node info /odometry_publisher', expected:'成功输出节点信息，证明节点此刻存在。', recovery:'Unknown node 回 RUN 看进程是否退出，再比较 ROS_DOMAIN_ID；不要把旧截图当当前证据。'},
      {terminal:'RUN + INSPECT', keep:'已保存 node info', action:'停止节点并证明无遗留实例', command:'RUN 按 Ctrl+C；INSPECT 执行 ros2 node list', expected:'/odometry_publisher 不再出现，RUN 回到提示符。', recovery:'仍出现说明还有同名实例；使用 ps -ef | grep odometry_publisher 定位对应终端并正常停止。', manual:true}
    ]},
    scenario:{title:'综合故障：包可发现，但可执行入口不存在', symptom:'ros2 pkg prefix ros2_exercises 成功；ros2 pkg executables ros2_exercises 没有 odometry_publisher。', question:'证据已经把问题缩小到哪里？', options:['setup.py console_scripts、构建结果与重新 source 的入口安装层', 'DDS 的 ROS_DOMAIN_ID', 'Gazebo DiffDrive'], correct:0, correctText:'正确。包索引已正常，失败发生在入口声明或安装更新层。', wrongText:'当前还没启动节点，DDS 与 Gazebo 都不是入口列表为空的原因。'},
    checks:[
      {prompt:'Package not found 与 No executable found 为什么不能用同一修复？', answer:'前者发生在包/overlay 发现层，后者表示包可能已发现但 console_scripts 入口未声明或未重新安装。'},
      {prompt:'怎样证明这套流程不依赖旧终端状态？', answer:'在干净 BUILD、RUN、INSPECT Shell 中分别显式 source，并从源码到停止重新收集证据。'},
      {prompt:'下一模块会复用哪些成果？', answer:'ros2_exercises 功能包、odometry_publisher.py、rclpy 生命周期、console_scripts、colcon 与双终端观察流程。'}
    ],
    after:{title:'Package Readiness Packet', text:'整理源码目录、关键元数据、修改后的 Node、构建摘要、入口、Graph、停止证据与一次失败恢复。', deliverable:'提交物：功能包目录清单、package.xml/setup.py 关键行、个人日志、五段运行证据、一条故障路由和“04.01 从哪里继续”的说明。'},
    next:'04.01 · 轮式里程计：从编码器到 nav_msgs/Odometry'
  }
};

window.module03Order = [
  'package_model',
  'creator_preflight',
  'package_anatomy',
  'python_node',
  'build_overlay',
  'run_inspect',
  'field_delivery'
];

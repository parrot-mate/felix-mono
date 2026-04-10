# PMate Playbook Test Cases

#### Test Case / 测试用例: 用户可以通过树状导航定位核心能力

- Scenario / 场景: 对应 happy path，用户进入 Playbook 后，通过左侧导航定位到目标能力。
- Preconditions / 前置条件: `apps/playbook/` 已启动，首批内容数据已加载。
- Steps / 步骤:
  1. 打开 Playbook 首页。
  2. 在左侧导航展开 `Capabilities`。
  3. 点击 `Auth` 或 `SDK` 节点。
- Expected Result / 预期结果:
  - 详情区切换到目标能力。
  - 页面展示用途、推荐入口、repo 和相关能力。

#### Test Case / 测试用例: 用户可以通过搜索快速定位能力

- Scenario / 场景: 对应 happy path，用户知道关键词，但不知道能力挂在哪个分类下。
- Preconditions / 前置条件: 页面已正常渲染。
- Steps / 步骤:
  1. 在搜索框输入 `account sdk` 或 `pmate deploy`。
  2. 查看匹配结果。
  3. 点击命中的能力节点。
- Expected Result / 预期结果:
  - 搜索结果能正确命中目标能力。
  - 详情区展示匹配能力，而不是保留旧节点。

#### Test Case / 测试用例: 用户可以通过关联能力继续理解上下游关系

- Scenario / 场景: 对应 happy path，用户从一个节点继续跳转到相邻能力。
- Preconditions / 前置条件: 当前节点存在 related capabilities。
- Steps / 步骤:
  1. 打开 `Repo Map` 节点。
  2. 在详情区点击 `Deploy` 关联卡片。
- Expected Result / 预期结果:
  - 页面切换到 `Deploy` 节点。
  - 详情区、选中态和相关说明保持一致。

#### Test Case / 测试用例: 内容未完整录入时显示占位说明

- Scenario / 场景: 对应 edge case，用户打开首版仍为 `partial` 的节点。
- Preconditions / 前置条件: `Deploy` 节点保持 `partial` 状态。
- Steps / 步骤:
  1. 在导航中打开 `Deploy`。
  2. 查看详情区状态和覆盖说明。
- Expected Result / 预期结果:
  - 页面显示 `Partial` 状态。
  - 页面展示当前覆盖范围和待补充说明。

#### Test Case / 测试用例: 无匹配结果时给出明确失败提示

- Scenario / 场景: 对应 failure case，用户输入一个当前未收录的关键词。
- Preconditions / 前置条件: 页面已正常渲染。
- Steps / 步骤:
  1. 在搜索框输入 `missing capability`。
  2. 观察侧边栏状态。
- Expected Result / 预期结果:
  - 页面显示 `No matching capabilities`。
  - 页面建议用户更换关键词或回到分类浏览。

#### Test Case / 测试用例: 首页默认态可以解释 Playbook 是什么

- Scenario / 场景: 用户首次打开页面，尚未开始搜索或切换节点。
- Preconditions / 前置条件: 页面可正常访问。
- Steps / 步骤:
  1. 打开 Playbook 首页。
  2. 观察 hero 区和默认详情区。
- Expected Result / 预期结果:
  - 页面解释 PMate Playbook 是平台地图，而不是普通文档列表。
  - 页面显示默认选中的平台概览节点，并给出下一步浏览方向。

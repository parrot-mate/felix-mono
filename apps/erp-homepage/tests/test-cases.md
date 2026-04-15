# ERP Homepage MVP Test Cases

## Background / 背景

这组测试用例服务于 `apps/erp-homepage` 当前阶段实现，目标是验证统一导航首页已经接入真实 SSO/profile 语义，并且本地 v1 管理后台已经具备最小 CRUD 能力。

当前阶段仍不覆盖收藏置顶、点击埋点和统计报表，但已经开始覆盖管理后台 CRUD。

#### Test Case / 测试用例: 员工登录后看到至少 8 个可见导航项

- Scenario / 场景: MVP Happy Path。
- Preconditions / 前置条件: 使用 `mockAuth=1` 或真实登录身份访问首页；静态导航 JSON 已加载。
- Steps / 步骤:
  1. 打开首页。
  2. 观察首屏卡片网格与可见导航项数量。
- Expected Result / 预期结果:
  - 首页成功渲染。
  - 可见导航项数量不少于 8。
  - 导航按分组展示。

#### Test Case / 测试用例: 搜索可以过滤导航项

- Scenario / 场景: 员工需要快速定位目标系统。
- Preconditions / 前置条件: 首页已正常加载。
- Steps / 步骤:
  1. 在搜索框输入关键字 `知识`。
  2. 观察页面结果。
- Expected Result / 预期结果:
  - `知识库` 卡片可见。
  - 无关卡片被过滤。

#### Test Case / 测试用例: 权限过滤对不同角色生效

- Scenario / 场景: 不同角色/部门的员工访问同一首页。
- Preconditions / 前置条件: 使用查询参数模拟身份。
- Steps / 步骤:
  1. 使用 `mockAuth=1&businessRole=employee&department=ops` 打开首页。
  2. 记录可见卡片。
  3. 使用 `mockAuth=1&businessRole=manager&department=sales` 再次打开首页。
- Expected Result / 预期结果:
  - 普通员工看不到 `销售 CRM`。
  - 销售经理可以看到 `销售 CRM`。

#### Test Case / 测试用例: 新窗口打开链接具备安全属性

- Scenario / 场景: 外部网站导航。
- Preconditions / 前置条件: 页面已加载。
- Steps / 步骤:
  1. 找到 `企业官网` 卡片。
  2. 检查链接属性。
- Expected Result / 预期结果:
  - 链接使用 `_blank` 打开。
  - 同时具备 `rel="noopener noreferrer"`。

#### Test Case / 测试用例: 管理台可以新增导航项并同步到首页

- Scenario / 场景: v1 管理后台最小 CRUD。
- Preconditions / 前置条件: 使用 `mockAuth=1` 或真实登录进入 `/admin`；本地持久化可用。
- Steps / 步骤:
  1. 进入管理台。
  2. 点击“新增导航项”。
  3. 填写名称、描述、链接、分组、图标、可见角色和可见部门。
  4. 保存后回到首页。
- Expected Result / 预期结果:
  - 导航项保存成功。
  - 首页可以立即看到新入口。
  - 新入口遵守配置的可见性规则。

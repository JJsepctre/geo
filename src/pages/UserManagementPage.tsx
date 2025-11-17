import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Space,
  Modal,
  Form,
  Message,
  Select,
  Popconfirm,
  Tag,
  Typography,
  Tabs,
  Grid
} from '@arco-design/web-react';
import {
  IconPlus,
  IconSearch,
  IconEdit,
  IconDelete,
  IconRefresh,
  IconSync,
  IconUserAdd
} from '@arco-design/web-react/icon';

const { Title } = Typography;
const FormItem = Form.Item;
const Option = Select.Option;
const TabPane = Tabs.TabPane;
const Row = Grid.Row;
const Col = Grid.Col;

// 用户数据类型
interface User {
  id: string;
  username: string;
  realName: string;
  phone: string;
  email: string;
  department: string;
  position: string;
  role: string;
  status: 'active' | 'inactive';
  createTime: string;
}

// 角色选项
const ROLES = [
  { label: '系统管理员', value: 'admin', color: 'red' },
  { label: '项目经理', value: 'manager', color: 'orange' },
  { label: '技术人员', value: 'engineer', color: 'blue' },
  { label: '普通用户', value: 'user', color: 'green' }
];

// 状态选项
const STATUS_OPTIONS = [
  { label: '启用', value: 'active', color: 'green' },
  { label: '禁用', value: 'inactive', color: 'red' }
];

function UserManagementPage() {
  const [activeTab, setActiveTab] = useState('user-list');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchForm] = Form.useForm();
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  // 模拟数据
  const mockUsers: User[] = [
    {
      id: '1',
      username: 'admin',
      realName: '张三',
      phone: '13800138000',
      email: 'zhangsan@example.com',
      department: '技术部',
      position: '技术总监',
      role: 'admin',
      status: 'active',
      createTime: '2024-01-01 10:00:00'
    },
    {
      id: '2',
      username: 'manager01',
      realName: '李四',
      phone: '13900139000',
      email: 'lisi@example.com',
      department: '工程部',
      position: '项目经理',
      role: 'manager',
      status: 'active',
      createTime: '2024-01-02 11:00:00'
    },
    {
      id: '3',
      username: 'engineer01',
      realName: '王五',
      phone: '13700137000',
      email: 'wangwu@example.com',
      department: '技术部',
      position: '工程师',
      role: 'engineer',
      status: 'active',
      createTime: '2024-01-03 09:00:00'
    },
    {
      id: '4',
      username: 'user01',
      realName: '赵六',
      phone: '13600136000',
      email: 'zhaoliu@example.com',
      department: '业务部',
      position: '业务员',
      role: 'user',
      status: 'inactive',
      createTime: '2024-01-04 14:00:00'
    }
  ];

  // 加载用户列表
  const loadUsers = async (params?: any) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let filteredUsers = [...mockUsers];
      if (params?.username) {
        filteredUsers = filteredUsers.filter(u => 
          u.username.includes(params.username) || u.realName.includes(params.username)
        );
      }
      if (params?.role) {
        filteredUsers = filteredUsers.filter(u => u.role === params.role);
      }
      if (params?.status) {
        filteredUsers = filteredUsers.filter(u => u.status === params.status);
      }

      setUsers(filteredUsers);
      setPagination({
        ...pagination,
        total: filteredUsers.length
      });
    } catch (error) {
      Message.error('加载用户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // 搜索
  const handleSearch = () => {
    const values = searchForm.getFieldsValue();
    loadUsers(values);
  };

  // 重置搜索
  const handleReset = () => {
    searchForm.resetFields();
    loadUsers();
  };

  // 打开对话框
  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      form.setFieldsValue(user);
    } else {
      setEditingUser(null);
      form.resetFields();
    }
    setVisible(true);
  };

  // 关闭对话框
  const handleCloseModal = () => {
    setVisible(false);
    setEditingUser(null);
    form.resetFields();
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validate();
      
      if (editingUser) {
        Message.success('更新用户成功');
      } else {
        Message.success('创建用户成功');
      }
      
      handleCloseModal();
      loadUsers();
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  // 删除用户
  const handleDelete = async (id: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      Message.success('删除用户成功');
      loadUsers();
    } catch (error) {
      Message.error('删除用户失败');
    }
  };

  // 批量同步员工
  const handleBatchSync = () => {
    Message.info('批量同步员工功能开发中...');
  };

  // 表格列定义
  const columns = [
    {
      title: '姓名',
      dataIndex: 'realName',
      width: 200
    },
    {
      title: '账号/邮箱',
      dataIndex: 'email',
      width: 300
    },
    {
      title: '操作',
      width: 250,
      render: (_: any, record: User) => (
        <Space>
          <Button
            type="text"
            size="small"
            style={{ color: '#165DFF' }}
            onClick={() => handleOpenModal(record)}
          >
            编辑信息
          </Button>
          <Button
            type="text"
            size="small"
            style={{ color: '#165DFF' }}
          >
            修改密码
          </Button>
          <Popconfirm
            title="确定要删除该用户吗？"
            onOk={() => handleDelete(record.id)}
          >
            <Button
              type="text"
              size="small"
              style={{ color: '#F53F3F' }}
            >
              删除信息
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // 人员信息管理页面内容
  const renderUserList = () => (
    <div>
      <Title heading={5} style={{ marginBottom: 20 }}>人员信息管理</Title>
      
      {/* 搜索表单 */}
      <Form
        form={searchForm}
        layout="inline"
        style={{ marginBottom: 20, background: '#fff', padding: '20px', borderRadius: '4px' }}
      >
        <Row gutter={16} style={{ width: '100%' }}>
          <Col span={6}>
            <FormItem label="姓名" field="realName" style={{ marginBottom: 16 }}>
              <Input placeholder="" allowClear />
            </FormItem>
          </Col>
          <Col span={6}>
            <FormItem label="手机" field="phone" style={{ marginBottom: 16 }}>
              <Input placeholder="" allowClear />
            </FormItem>
          </Col>
          <Col span={6}>
            <FormItem label="邮箱" field="email" style={{ marginBottom: 16 }}>
              <Input placeholder="" allowClear />
            </FormItem>
          </Col>
          <Col span={6}>
            <FormItem label="部门" field="department" style={{ marginBottom: 16 }}>
              <Input placeholder="" allowClear />
            </FormItem>
          </Col>
        </Row>
        <Row>
          <Col span={24} style={{ textAlign: 'right' }}>
            <Space>
              <Button
                type="primary"
                onClick={handleSearch}
              >
                查询
              </Button>
            </Space>
          </Col>
        </Row>
      </Form>

      {/* 操作按钮 */}
      <div style={{ marginBottom: 16, textAlign: 'right' }}>
        <Space>
          <Button
            type="primary"
            onClick={() => handleOpenModal()}
          >
            增加人员信息
          </Button>
          <Button
            type="primary"
            onClick={handleBatchSync}
          >
            批量同步人员
          </Button>
        </Space>
      </div>

      {/* 数据表格 */}
      <Table
        columns={columns}
        data={users}
        loading={loading}
        pagination={{
          ...pagination,
          showTotal: true,
          sizeCanChange: true,
          onChange: (current, pageSize) => {
            setPagination({ ...pagination, current, pageSize });
          }
        }}
        border
        style={{ background: '#fff' }}
      />
    </div>
  );

  // 批量同步员工页面内容
  const renderBatchSync = () => (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <IconSync style={{ fontSize: 64, color: '#165DFF', marginBottom: 20 }} />
      <Title heading={4}>批量同步员工</Title>
      <p style={{ color: '#86909C', marginBottom: 30 }}>
        从其他系统批量同步员工信息到本系统
      </p>
      <Button type="primary" size="large" icon={<IconSync />}>
        开始同步
      </Button>
    </div>
  );

  // 标段数据类型
  interface Section {
    id: string;
    code: string;
    name: string;
  }

  // 模拟标段数据
  const mockSections: Section[] = [
    { id: '1', code: 'CQJZQ-2', name: 'CQJZQ-2' },
    { id: '2', code: 'PXZQ-4', name: 'PXZQ-4' },
    { id: '3', code: 'CQJZQ-8', name: 'CQJZQ-8' },
    { id: '4', code: 'CQJZQ-7', name: 'CQJZQ-7' },
    { id: '5', code: 'GSJXZQ-4标（中铁三局）', name: 'GSJXZQ-4标（中铁三局）' },
    { id: '6', code: 'DRRBTJ-2标', name: 'DRRBTJ-2标' },
    { id: '7', code: 'YXZQ-SG2', name: 'YXZQ-SG2' },
    { id: '8', code: 'CQJZQ-13', name: 'CQJZQ-13' },
    { id: '9', code: 'CQJZQ-12', name: 'CQJZQ-12' }
  ];

  // 同步人员名单
  const handleSyncStaff = (section: Section) => {
    Message.info(`正在同步 ${section.name} 的人员名单...`);
    // TODO: 调用后端API进行同步
  };

  // 同步设计人员
  const handleSyncDesigner = (section: Section) => {
    Message.info(`正在同步 ${section.name} 的设计人员...`);
    // TODO: 调用后端API进行同步
  };

  // 标段同步员工页面内容
  const renderSectionSync = () => (
    <div>
      <Title heading={5} style={{ marginBottom: 20 }}>标段同步员工</Title>
      
      <div style={{ background: '#fff', padding: '20px', borderRadius: '4px' }}>
        {/* 标段列表 */}
        {mockSections.map((section) => (
          <div
            key={section.id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid #E5E6EB',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F7F8FA';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {/* 左侧：标段名称 */}
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '14px', color: '#1D2129' }}>
                {section.name}
              </span>
            </div>

            {/* 右侧：操作按钮 */}
            <Space size="medium">
              <Button
                type="primary"
                icon={<IconSync />}
                onClick={() => handleSyncStaff(section)}
                style={{
                  background: '#6366F1',
                  borderColor: '#6366F1'
                }}
              >
                同步人员名单
              </Button>
              <Button
                type="primary"
                icon={<IconSync />}
                onClick={() => handleSyncDesigner(section)}
                style={{
                  background: '#6366F1',
                  borderColor: '#6366F1'
                }}
              >
                同步设计人员
              </Button>
            </Space>
          </div>
        ))}
      </div>
    </div>
  );

  // 工点数据类型
  interface WorkPoint {
    id: string;
    name: string;
    tunnelId: string;
    createTime: string;
    startMileage: string;
    endMileage: string;
  }

  // 模拟工点数据
  const mockWorkPoints: WorkPoint[] = [
    {
      id: '364708',
      name: '那邑2#斜井进山口工区',
      tunnelId: '364708',
      createTime: '2025-11-16 03:00:14',
      startMileage: 'D1K281+512.0',
      endMileage: '281+275.0'
    },
    {
      id: '364570',
      name: '长坡隧道斜风道',
      tunnelId: '364570',
      createTime: '2025-11-14 03:00:23',
      startMileage: 'ZFDK0+169.368',
      endMileage: 'ZFDK0+000'
    },
    {
      id: '364569',
      name: '地中隧道进口明洞段',
      tunnelId: '364569',
      createTime: '2025-11-14 03:00:21',
      startMileage: 'DK183+129.8',
      endMileage: 'DK183+138.9'
    },
    {
      id: '364390',
      name: '长坡隧道进口端',
      tunnelId: '364390',
      createTime: '2025-11-08 03:00:21',
      startMileage: 'YFDK0.000',
      endMileage: 'YFDK0+57.38'
    },
    {
      id: '364384',
      name: '长坡隧道2#斜井',
      tunnelId: '364384',
      createTime: '2025-11-08 03:00:19',
      startMileage: 'BDK0+58.75',
      endMileage: 'BDK0.000'
    },
    {
      id: '364283',
      name: '2#竖井工区明洞进洞口工程',
      tunnelId: '364283',
      createTime: '2025-11-07 03:00:12',
      startMileage: 'D1K211+726',
      endMileage: 'D1K211+800'
    },
    {
      id: '362929',
      name: '2#竖井5#横洞进洞进洞口工程',
      tunnelId: '362929',
      createTime: '2025-11-07 03:00:10',
      startMileage: 'D1K213+356',
      endMileage: 'D1K213+580'
    },
    {
      id: '364282',
      name: '2#竖井5#横洞进洞进洞口工程',
      tunnelId: '364282',
      createTime: '2025-11-07 03:00:09',
      startMileage: 'D1K213+356',
      endMileage: 'D1K213+200'
    },
    {
      id: '363421',
      name: '2#竖井工区5#横洞进洞口工程',
      tunnelId: '363421',
      createTime: '2025-11-07 03:00:07',
      startMileage: 'D1K211+726',
      endMileage: 'D1K208+715'
    },
    {
      id: '362908',
      name: '1#竖井40#横洞进洞进洞口区',
      tunnelId: '362908',
      createTime: '2025-11-07 03:00:05',
      startMileage: 'D1K206+395',
      endMileage: 'D1K206+250'
    }
  ];

  // 工点搜索状态
  const [workPointSearchForm] = Form.useForm();
  const [workPoints, setWorkPoints] = useState<WorkPoint[]>(mockWorkPoints);
  const [workPointLoading, setWorkPointLoading] = useState(false);
  const [workPointPagination, setWorkPointPagination] = useState({
    current: 1,
    pageSize: 10,
    total: mockWorkPoints.length
  });

  // 搜索工点
  const handleSearchWorkPoint = () => {
    const values = workPointSearchForm.getFieldsValue();
    setWorkPointLoading(true);
    
    setTimeout(() => {
      let filtered = [...mockWorkPoints];
      if (values.name) {
        filtered = filtered.filter(wp => wp.name.includes(values.name));
      }
      setWorkPoints(filtered);
      setWorkPointPagination({
        ...workPointPagination,
        total: filtered.length,
        current: 1
      });
      setWorkPointLoading(false);
    }, 300);
  };

  // 同步工点信息
  const handleSyncWorkPoints = () => {
    Message.loading('正在同步工点信息...');
    setTimeout(() => {
      Message.success('工点信息同步成功！');
    }, 1500);
  };

  // 工点表格列定义
  const workPointColumns = [
    {
      title: '工点名称',
      dataIndex: 'name',
      width: 250
    },
    {
      title: '掌ID',
      dataIndex: 'tunnelId',
      width: 120
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 180
    },
    {
      title: '开始里程',
      dataIndex: 'startMileage',
      width: 150
    },
    {
      title: '结束里程',
      dataIndex: 'endMileage',
      width: 150
    },
    {
      title: '操作',
      width: 100,
      render: () => (
        <Button type="text" size="small" style={{ color: '#165DFF' }}>
          详情
        </Button>
      )
    }
  ];

  // 同步工作组页面内容（改为工点信息管理）
  const renderWorkGroupSync = () => (
    <div>
      <Title heading={5} style={{ marginBottom: 20 }}>工点信息管理</Title>
      
      {/* 搜索栏 */}
      <div style={{ 
        background: '#fff', 
        padding: '20px', 
        borderRadius: '4px',
        marginBottom: '16px'
      }}>
        <Form
          form={workPointSearchForm}
          layout="inline"
          style={{ width: '100%' }}
        >
          <Row gutter={16} style={{ width: '100%' }}>
            <Col span={6}>
              <FormItem label="工点名称:" field="name" style={{ marginBottom: 0 }}>
                <Input placeholder="" allowClear />
              </FormItem>
            </Col>
            <Col span={18} style={{ textAlign: 'right' }}>
              <Space>
                <Button
                  type="primary"
                  icon={<IconSync />}
                  onClick={handleSyncWorkPoints}
                  style={{
                    background: '#6366F1',
                    borderColor: '#6366F1'
                  }}
                >
                  同步工点信息
                </Button>
                <Button
                  type="primary"
                  icon={<IconSearch />}
                  onClick={handleSearchWorkPoint}
                >
                  查询
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </div>

      {/* 工点列表表格 */}
      <Table
        columns={workPointColumns}
        data={workPoints}
        loading={workPointLoading}
        pagination={{
          ...workPointPagination,
          showTotal: true,
          sizeCanChange: true,
          pageSizeChangeResetCurrent: true,
          onChange: (current, pageSize) => {
            setWorkPointPagination({ 
              ...workPointPagination, 
              current, 
              pageSize 
            });
          }
        }}
        border
        style={{ background: '#fff' }}
      />
    </div>
  );

  // 角色管理页面内容
  const renderRoleManagement = () => (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <IconUserAdd style={{ fontSize: 64, color: '#165DFF', marginBottom: 20 }} />
      <Title heading={4}>角色管理</Title>
      <p style={{ color: '#86909C', marginBottom: 30 }}>
        管理系统角色和权限
      </p>
      <Button type="primary" size="large" icon={<IconPlus />}>
        新增角色
      </Button>
    </div>
  );

  // 审计管理页面内容
  const renderAuditManagement = () => (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <IconSearch style={{ fontSize: 64, color: '#165DFF', marginBottom: 20 }} />
      <Title heading={4}>审计管理</Title>
      <p style={{ color: '#86909C', marginBottom: 30 }}>
        查看系统操作日志和审计记录
      </p>
      <Button type="primary" size="large" icon={<IconSearch />}>
        查看审计日志
      </Button>
    </div>
  );

  // 表单管理页面内容
  const renderFormManagement = () => (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <IconEdit style={{ fontSize: 64, color: '#165DFF', marginBottom: 20 }} />
      <Title heading={4}>表单管理</Title>
      <p style={{ color: '#86909C', marginBottom: 30 }}>
        管理系统表单配置
      </p>
      <Button type="primary" size="large" icon={<IconPlus />}>
        新增表单
      </Button>
    </div>
  );

  // 阈值管理页面内容
  const renderThresholdManagement = () => (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <IconRefresh style={{ fontSize: 64, color: '#165DFF', marginBottom: 20 }} />
      <Title heading={4}>阈值管理</Title>
      <p style={{ color: '#86909C', marginBottom: 30 }}>
        配置系统预警阈值
      </p>
      <Button type="primary" size="large" icon={<IconPlus />}>
        新增阈值配置
      </Button>
    </div>
  );

  // 数据字典页面内容
  const renderDataDictionary = () => (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <IconSearch style={{ fontSize: 64, color: '#165DFF', marginBottom: 20 }} />
      <Title heading={4}>数据字典</Title>
      <p style={{ color: '#86909C', marginBottom: 30 }}>
        管理系统数据字典配置
      </p>
      <Button type="primary" size="large" icon={<IconPlus />}>
        新增字典项
      </Button>
    </div>
  );

  return (
    <div style={{ padding: '20px', background: '#f7f8fa', minHeight: '100vh' }}>
      <Card bordered={false}>
        {/* 顶部选项卡 */}
        <Tabs
          activeTab={activeTab}
          onChange={setActiveTab}
          type="card"
          style={{ marginBottom: 0 }}
        >
          <TabPane key="user-list" title="人员信息管理">
            {renderUserList()}
          </TabPane>
          <TabPane key="batch-sync-user" title="批量同步员工">
            {renderBatchSync()}
          </TabPane>
          <TabPane key="section-sync-user" title="标段同步员工">
            {renderSectionSync()}
          </TabPane>
          <TabPane key="work-group" title="工点信息管理">
            {renderWorkGroupSync()}
          </TabPane>
          <TabPane key="role-management" title="角色管理">
            {renderRoleManagement()}
          </TabPane>
          <TabPane key="audit-management" title="审计管理">
            {renderAuditManagement()}
          </TabPane>
          <TabPane key="form-management" title="表单管理">
            {renderFormManagement()}
          </TabPane>
          <TabPane key="threshold-management" title="阈值管理">
            {renderThresholdManagement()}
          </TabPane>
          <TabPane key="data-dictionary" title="数据字典">
            {renderDataDictionary()}
          </TabPane>
        </Tabs>
      </Card>

      {/* 新增/编辑对话框 */}
      <Modal
        title={editingUser ? '编辑用户信息' : '新增用户信息'}
        visible={visible}
        onOk={handleSubmit}
        onCancel={handleCloseModal}
        style={{ width: 600 }}
      >
        <Form
          form={form}
          layout="vertical"
          autoComplete="off"
        >
          <FormItem
            label="用户名"
            field="username"
            rules={[
              { required: true, message: '请输入用户名' },
              { minLength: 3, message: '用户名至少3个字符' }
            ]}
          >
            <Input
              placeholder="请输入用户名"
              disabled={!!editingUser}
            />
          </FormItem>

          {!editingUser && (
            <FormItem
              label="密码"
              field="password"
              rules={[
                { required: true, message: '请输入密码' },
                { minLength: 6, message: '密码至少6个字符' }
              ]}
            >
              <Input.Password placeholder="请输入密码" />
            </FormItem>
          )}

          <FormItem
            label="姓名"
            field="realName"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </FormItem>

          <FormItem
            label="手机号"
            field="phone"
            rules={[
              { required: true, message: '请输入手机号' },
              { 
                match: /^1[3-9]\d{9}$/, 
                message: '请输入正确的手机号' 
              }
            ]}
          >
            <Input placeholder="请输入手机号" />
          </FormItem>

          <FormItem
            label="邮箱"
            field="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { 
                match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 
                message: '请输入正确的邮箱格式' 
              }
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </FormItem>

          <FormItem
            label="部门"
            field="department"
            rules={[{ required: true, message: '请输入部门' }]}
          >
            <Input placeholder="请输入部门" />
          </FormItem>

          <FormItem
            label="职位"
            field="position"
            rules={[{ required: true, message: '请输入职位' }]}
          >
            <Input placeholder="请输入职位" />
          </FormItem>

          <FormItem
            label="角色"
            field="role"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              {ROLES.map(role => (
                <Option key={role.value} value={role.value}>
                  {role.label}
                </Option>
              ))}
            </Select>
          </FormItem>

          <FormItem
            label="状态"
            field="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              {STATUS_OPTIONS.map(status => (
                <Option key={status.value} value={status.value}>
                  {status.label}
                </Option>
              ))}
            </Select>
          </FormItem>
        </Form>
      </Modal>
    </div>
  );
}

export default UserManagementPage;

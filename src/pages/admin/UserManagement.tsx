import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Modal, 
  Form, 
  Select, 
  Message,
  Input,
  Tag
} from '@arco-design/web-react'
import { IconRefresh, IconSearch } from '@arco-design/web-react/icon'
import http from '../../utils/http'

interface User {
  userPk: number
  userAccount: string
  userName?: string
  email?: string
  phone?: string
  status?: number
  gmtCreate?: string
  roles?: Role[]
}

interface Role {
  rolePk: number
  roleName: string
  roleCode?: string
}

function UserManagement() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchKeyword, setSearchKeyword] = useState('')
  
  // 角色分配弹窗
  const [roleModalVisible, setRoleModalVisible] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [roleList, setRoleList] = useState<Role[]>([])
  const [selectedRolePk, setSelectedRolePk] = useState<number | undefined>()
  
  // 重置密码弹窗
  const [resetModalVisible, setResetModalVisible] = useState(false)

  // 获取用户列表
  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await http.get('/api/admin/user/list', {
        params: { pageNum: page, pageSize }
      })
      console.log('📋 [Admin] 用户列表:', res)
      if (res.resultcode === 0 && res.data) {
        setData(res.data.records || [])
        setTotal(res.data.total || 0)
      }
    } catch (error) {
      console.error('获取用户列表失败:', error)
      Message.error('获取用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 获取角色列表
  const fetchRoles = async () => {
    try {
      const res = await http.get('/api/admin/role/list', {
        params: { pageNum: 1, pageSize: 100 }
      })
      if (res.resultcode === 0 && res.data) {
        setRoleList(res.data.records || [])
      }
    } catch (error) {
      console.error('获取角色列表失败:', error)
    }
  }

  // 获取用户角色
  const fetchUserRole = async (userPk: number) => {
    try {
      const res = await http.get(`/api/admin/role/${userPk}`)
      if (res.resultcode === 0 && res.data && res.data.length > 0) {
        setSelectedRolePk(res.data[0].rolePk)
      }
    } catch (error) {
      console.error('获取用户角色失败:', error)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchRoles()
  }, [page, pageSize])

  // 打开角色分配弹窗
  const handleAssignRole = async (user: User) => {
    setSelectedUser(user)
    setSelectedRolePk(undefined)
    await fetchUserRole(user.userPk)
    setRoleModalVisible(true)
  }

  // 提交角色分配
  const handleRoleSubmit = async () => {
    if (!selectedUser || !selectedRolePk) {
      Message.warning('请选择角色')
      return
    }
    try {
      const res = await http.put(`/api/admin/role/${selectedUser.userPk}`, null, {
        params: { rolePk: selectedRolePk }
      })
      if (res.resultcode === 0) {
        Message.success('角色分配成功')
        setRoleModalVisible(false)
        fetchUsers()
      } else {
        Message.error(res.message || '角色分配失败')
      }
    } catch (error) {
      console.error('角色分配失败:', error)
      Message.error('角色分配失败')
    }
  }

  // 打开重置密码弹窗
  const handleResetPassword = (user: User) => {
    setSelectedUser(user)
    setResetModalVisible(true)
  }

  // 提交重置密码
  const handleResetSubmit = async () => {
    if (!selectedUser) return
    try {
      const res = await http.post('/api/admin/user/reset-password', {
        userPk: selectedUser.userPk
      })
      if (res.resultcode === 0) {
        Message.success('密码已重置为初始密码')
        setResetModalVisible(false)
      } else {
        Message.error(res.message || '重置密码失败')
      }
    } catch (error) {
      console.error('重置密码失败:', error)
      Message.error('重置密码失败')
    }
  }

  const columns = [
    { title: '用户ID', dataIndex: 'userPk', width: 80 },
    { title: '账号', dataIndex: 'userAccount', width: 150 },
    { title: '用户名', dataIndex: 'userName', width: 120, render: (v: string) => v || '-' },
    { title: '邮箱', dataIndex: 'email', width: 180, render: (v: string) => v || '-' },
    { title: '手机号', dataIndex: 'phone', width: 130, render: (v: string) => v || '-' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      width: 80,
      render: (v: number) => (
        <Tag color={v === 1 ? 'green' : 'red'}>
          {v === 1 ? '启用' : '禁用'}
        </Tag>
      )
    },
    { 
      title: '创建时间', 
      dataIndex: 'gmtCreate', 
      width: 170,
      render: (v: string) => v ? v.replace('T', ' ').substring(0, 19) : '-'
    },
    {
      title: '操作',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, record: User) => (
        <Space>
          <Button type="primary" size="small" onClick={() => handleAssignRole(record)}>
            分配角色
          </Button>
          <Button size="small" status="warning" onClick={() => handleResetPassword(record)}>
            重置密码
          </Button>
        </Space>
      )
    }
  ]

  return (
    <Card>
      {/* 搜索栏 */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Input.Search
            placeholder="搜索用户账号"
            value={searchKeyword}
            onChange={setSearchKeyword}
            style={{ width: 250 }}
          />
          <Button type="primary" icon={<IconSearch />} onClick={fetchUsers}>
            查询
          </Button>
        </Space>
        <Button icon={<IconRefresh />} onClick={fetchUsers}>
          刷新
        </Button>
      </div>

      {/* 用户表格 */}
      <Table
        loading={loading}
        columns={columns}
        data={data}
        rowKey="userPk"
        pagination={{
          current: page,
          pageSize,
          total,
          showTotal: true,
          onChange: (p, ps) => { setPage(p); setPageSize(ps) }
        }}
        scroll={{ x: 1200 }}
      />

      {/* 角色分配弹窗 */}
      <Modal
        title={`分配角色 - ${selectedUser?.userAccount}`}
        visible={roleModalVisible}
        onOk={handleRoleSubmit}
        onCancel={() => setRoleModalVisible(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form layout="vertical">
          <Form.Item label="选择角色" required>
            <Select
              placeholder="请选择角色"
              value={selectedRolePk}
              onChange={setSelectedRolePk}
              style={{ width: '100%' }}
            >
              {roleList.map(role => (
                <Select.Option key={role.rolePk} value={role.rolePk}>
                  {role.roleName}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 重置密码确认弹窗 */}
      <Modal
        title="重置密码"
        visible={resetModalVisible}
        onOk={handleResetSubmit}
        onCancel={() => setResetModalVisible(false)}
        okText="确定重置"
        cancelText="取消"
        okButtonProps={{ status: 'warning' }}
      >
        <p>确定要将用户 <strong>{selectedUser?.userAccount}</strong> 的密码重置为初始密码吗？</p>
      </Modal>
    </Card>
  )
}

export default UserManagement

import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Tag, Message } from '@arco-design/web-react'
import { IconRefresh } from '@arco-design/web-react/icon'
import http from '../../utils/http'

interface Role {
  rolePk: number
  roleName: string
  roleCode?: string
  description?: string
  gmtCreate?: string
}

function RoleManagement() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<Role[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const fetchRoles = async () => {
    setLoading(true)
    try {
      const res = await http.get('/api/admin/role/list', {
        params: { pageNum: page, pageSize }
      })
      console.log('📋 [Admin] 角色列表:', res)
      if ((res.resultcode === 0 || res.resultcode === 200) && res.data) {
        setData(res.data.records || [])
        setTotal(res.data.total || 0)
      }
    } catch (error) {
      console.error('获取角色列表失败:', error)
      Message.error('获取角色列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoles()
  }, [page, pageSize])

  const columns = [
    { title: '角色ID', dataIndex: 'rolePk', width: 80 },
    { title: '角色名称', dataIndex: 'roleName', width: 150 },
    { 
      title: '角色编码', 
      dataIndex: 'roleCode', 
      width: 150,
      render: (v: string) => v ? <Tag color="blue">{v}</Tag> : '-'
    },
    { title: '描述', dataIndex: 'description', width: 250, render: (v: string) => v || '-' },
    { 
      title: '创建时间', 
      dataIndex: 'gmtCreate', 
      width: 170,
      render: (v: string) => v ? v.replace('T', ' ').substring(0, 19) : '-'
    }
  ]

  return (
    <Card>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button icon={<IconRefresh />} onClick={fetchRoles}>
          刷新
        </Button>
      </div>

      <Table
        loading={loading}
        columns={columns}
        data={data}
        rowKey="rolePk"
        pagination={{
          current: page,
          pageSize,
          total,
          showTotal: true,
          onChange: (p, ps) => { setPage(p); setPageSize(ps) }
        }}
      />
    </Card>
  )
}

export default RoleManagement

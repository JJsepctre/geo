import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Message,
  Select,
  Spin,
  Empty,
  Checkbox,
  Divider
} from '@arco-design/web-react'
import { IconRefresh, IconSettings } from '@arco-design/web-react/icon'
import http from '../../utils/http'

interface User {
  userPk: number
  userAccount: string
  userName?: string
}

interface UserResourcePermission {
  userResourcePermissionPk: number
  userPk: number
  resourceType: string
  resourcePath: string
  gmtCreate?: string
  gmtModified?: string
}

// 工点信息
interface SiteInfoVO {
  sitename: string
  sitecode: string
  siteId: string
  startKilo: string
  stopKilo: string
  useflag: string
}

// 工作面信息
interface GzwInfoVO {
  gzwname: string
  gzwID: string
  gzwStartKilo: string
  gzwStopKilo: string
  gzwInfoVO: SiteInfoVO[]
}

// 标段-工点信息
interface BdAndGdVO {
  bdId: string
  jsdanwei: string
  sgdanwei: string
  jldanwei: string
  bdStartKilo: string
  bdStopKilo: string
  bdInfoVO: GzwInfoVO[]
}

function PermissionManagement() {
  const [loading, setLoading] = useState(false)
  const [userList, setUserList] = useState<User[]>([])
  const [selectedUserPk, setSelectedUserPk] = useState<number | undefined>()

  // 用户权限列表
  const [permLoading, setPermLoading] = useState(false)
  const [userPermissions, setUserPermissions] = useState<UserResourcePermission[]>([])

  // 配置权限弹窗
  const [configModalVisible, setConfigModalVisible] = useState(false)
  const [bdGdList, setBdGdList] = useState<BdAndGdVO[]>([])
  const [bdGdLoading, setBdGdLoading] = useState(false)
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  // 获取用户列表
  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await http.get('/api/admin/user/list', {
        params: { pageNum: 1, pageSize: 100 }
      })
      if (res.resultcode === 0 && res.data) {
        setUserList(res.data.records || [])
      }
    } catch (error) {
      console.error('获取用户列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 获取用户权限
  const fetchUserPermissions = async (userPk: number) => {
    setPermLoading(true)
    try {
      const res = await http.get(`/api/admin/user/${userPk}/bd-gd/permission`)
      console.log('📋 [Admin] 用户权限:', res)
      if (res.resultcode === 0) {
        setUserPermissions(res.data || [])
      }
    } catch (error) {
      console.error('获取用户权限失败:', error)
      Message.error('获取用户权限失败')
    } finally {
      setPermLoading(false)
    }
  }

  // 获取标段-工点列表
  const fetchBdGdList = async () => {
    setBdGdLoading(true)
    try {
      const res = await http.get('/api/admin/bd-gd/list', {
        params: { pageNum: 1, pageSize: 100 }
      })
      console.log('📋 [Admin] 标段-工点列表:', res)
      if (res.resultcode === 0 && res.data) {
        setBdGdList(res.data.records || [])
      }
    } catch (error) {
      console.error('获取标段-工点列表失败:', error)
    } finally {
      setBdGdLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // 选择用户后获取权限
  const handleUserChange = (userPk: number) => {
    setSelectedUserPk(userPk)
    if (userPk) {
      fetchUserPermissions(userPk)
    } else {
      setUserPermissions([])
    }
  }

  // 打开配置权限弹窗
  const handleConfigPermission = async () => {
    if (!selectedUserPk) {
      Message.warning('请先选择用户')
      return
    }
    
    // 获取标段-工点列表
    await fetchBdGdList()
    
    // 初始化已选权限（从当前用户权限中提取）
    const perms = new Set<string>()
    userPermissions.forEach(p => {
      if (p.resourcePath) {
        perms.add(p.resourcePath)
      }
    })
    setSelectedPermissions(perms)
    
    setConfigModalVisible(true)
  }

  // 切换权限选择
  const togglePermission = (resourcePath: string) => {
    const newPerms = new Set(selectedPermissions)
    if (newPerms.has(resourcePath)) {
      newPerms.delete(resourcePath)
    } else {
      newPerms.add(resourcePath)
    }
    setSelectedPermissions(newPerms)
  }

  // 全选/取消全选标段下的所有工点
  const toggleBdPermissions = (bd: BdAndGdVO, checked: boolean) => {
    const newPerms = new Set(selectedPermissions)
    const bdPath = `/bd/${bd.bdId}`
    
    if (checked) {
      newPerms.add(bdPath)
      // 添加所有工作面和工点
      bd.bdInfoVO?.forEach(gzw => {
        const gzwPath = `/gzw/${gzw.gzwID}`
        newPerms.add(gzwPath)
        gzw.gzwInfoVO?.forEach(site => {
          newPerms.add(`/site/${site.siteId}`)
        })
      })
    } else {
      newPerms.delete(bdPath)
      // 移除所有工作面和工点
      bd.bdInfoVO?.forEach(gzw => {
        newPerms.delete(`/gzw/${gzw.gzwID}`)
        gzw.gzwInfoVO?.forEach(site => {
          newPerms.delete(`/site/${site.siteId}`)
        })
      })
    }
    setSelectedPermissions(newPerms)
  }

  // 检查标段是否全选
  const isBdAllSelected = (bd: BdAndGdVO): boolean => {
    if (!bd.bdInfoVO || bd.bdInfoVO.length === 0) return false
    return bd.bdInfoVO.every(gzw => 
      gzw.gzwInfoVO?.every(site => selectedPermissions.has(`/site/${site.siteId}`))
    )
  }

  // 检查标段是否部分选中
  const isBdIndeterminate = (bd: BdAndGdVO): boolean => {
    if (!bd.bdInfoVO || bd.bdInfoVO.length === 0) return false
    const allSites: string[] = []
    bd.bdInfoVO.forEach(gzw => {
      gzw.gzwInfoVO?.forEach(site => {
        allSites.push(`/site/${site.siteId}`)
      })
    })
    const selectedCount = allSites.filter(path => selectedPermissions.has(path)).length
    return selectedCount > 0 && selectedCount < allSites.length
  }

  // 提交权限配置
  const handleSavePermissions = async () => {
    if (!selectedUserPk) return
    
    setSaving(true)
    try {
      // 构建权限数据
      const permissions = Array.from(selectedPermissions).map(resourcePath => {
        // 根据路径判断资源类型
        let resourceType = 'site'
        if (resourcePath.startsWith('/bd/')) {
          resourceType = 'bd'
        } else if (resourcePath.startsWith('/gzw/')) {
          resourceType = 'gzw'
        }
        
        return {
          userPk: selectedUserPk,
          resourceType,
          resourcePath
        }
      })

      console.log('📤 [Admin] 提交权限:', permissions)
      
      const res = await http.post(`/api/admin/user/${selectedUserPk}/bd-gd/permission`, permissions)
      if (res.resultcode === 0) {
        Message.success('权限配置成功')
        setConfigModalVisible(false)
        fetchUserPermissions(selectedUserPk)
      } else {
        Message.error(res.message || '权限配置失败')
      }
    } catch (error) {
      console.error('权限配置失败:', error)
      Message.error('权限配置失败')
    } finally {
      setSaving(false)
    }
  }

  // 权限表格列
  const permColumns = [
    { title: '权限ID', dataIndex: 'userResourcePermissionPk', width: 100 },
    { title: '资源类型', dataIndex: 'resourceType', width: 120, render: (v: string) => v || '-' },
    { title: '资源路径', dataIndex: 'resourcePath', width: 250, render: (v: string) => v || '-' },
    {
      title: '创建时间',
      dataIndex: 'gmtCreate',
      width: 170,
      render: (v: string) => v ? v.replace('T', ' ').substring(0, 19) : '-'
    }
  ]

  return (
    <Card>
      <div style={{ marginBottom: 24 }}>
        <Space size="large">
          <div>
            <span style={{ marginRight: 8 }}>选择用户：</span>
            <Select
              placeholder="请选择用户"
              value={selectedUserPk}
              onChange={handleUserChange}
              style={{ width: 250 }}
              showSearch
              allowClear
            >
              {userList.map(user => (
                <Select.Option key={user.userPk} value={user.userPk}>
                  {user.userAccount} {user.userName ? `(${user.userName})` : ''}
                </Select.Option>
              ))}
            </Select>
          </div>
          <Button type="primary" icon={<IconSettings />} onClick={handleConfigPermission} disabled={!selectedUserPk}>
            配置权限
          </Button>
          <Button icon={<IconRefresh />} onClick={() => selectedUserPk && fetchUserPermissions(selectedUserPk)}>
            刷新
          </Button>
        </Space>
      </div>

      {selectedUserPk ? (
        <Spin loading={permLoading}>
          {userPermissions.length === 0 ? (
            <Empty description="该用户暂无权限配置" />
          ) : (
            <Table
              columns={permColumns}
              data={userPermissions}
              rowKey="userResourcePermissionPk"
              pagination={false}
            />
          )}
        </Spin>
      ) : (
        <div style={{ padding: 48, backgroundColor: '#f7f8fa', borderRadius: 8, textAlign: 'center' }}>
          <p style={{ color: '#86909c', marginBottom: 8 }}>请选择用户查看权限配置</p>
          <p style={{ color: '#c9cdd4', fontSize: 12 }}>选择用户后可以查看和管理该用户的标段-工点访问权限</p>
        </div>
      )}

      {/* 配置权限弹窗 */}
      <Modal
        title={`配置权限 - ${userList.find(u => u.userPk === selectedUserPk)?.userAccount || ''}`}
        visible={configModalVisible}
        onOk={handleSavePermissions}
        onCancel={() => setConfigModalVisible(false)}
        okText="保存"
        cancelText="取消"
        confirmLoading={saving}
        style={{ width: 800 }}
      >
        <Spin loading={bdGdLoading}>
          {bdGdList.length === 0 ? (
            <Empty description="暂无标段-工点数据" />
          ) : (
            <div style={{ maxHeight: 500, overflow: 'auto' }}>
              <p style={{ color: '#86909c', marginBottom: 16 }}>
                勾选需要授权的标段和工点，保存后生效
              </p>
              
              {bdGdList.map((bd, bdIndex) => (
                <div key={bd.bdId || bdIndex} style={{ marginBottom: 20 }}>
                  {/* 标段 */}
                  <div style={{ 
                    padding: '10px 12px',
                    backgroundColor: '#f2f3f5',
                    borderRadius: 4,
                    marginBottom: 8
                  }}>
                    <Checkbox
                      checked={isBdAllSelected(bd)}
                      indeterminate={isBdIndeterminate(bd)}
                      onChange={(checked) => toggleBdPermissions(bd, checked)}
                    >
                      <span style={{ fontWeight: 500 }}>标段: {bd.bdId || '-'}</span>
                      <span style={{ color: '#86909c', marginLeft: 16, fontSize: 12 }}>
                        {bd.bdStartKilo || '-'} ~ {bd.bdStopKilo || '-'}
                      </span>
                    </Checkbox>
                  </div>
                  
                  {/* 工作面和工点 */}
                  {bd.bdInfoVO?.map((gzw, gzwIndex) => (
                    <div key={gzw.gzwID || gzwIndex} style={{ marginLeft: 24, marginBottom: 12 }}>
                      <div style={{ 
                        padding: '6px 12px',
                        backgroundColor: '#e8f3ff',
                        borderRadius: 4,
                        marginBottom: 6
                      }}>
                        <span style={{ fontWeight: 500, color: '#165dff' }}>
                          工作面: {gzw.gzwname || '-'}
                        </span>
                        <span style={{ color: '#86909c', marginLeft: 12, fontSize: 12 }}>
                          {gzw.gzwStartKilo || '-'} ~ {gzw.gzwStopKilo || '-'}
                        </span>
                      </div>
                      
                      {/* 工点列表 */}
                      <div style={{ marginLeft: 24, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {gzw.gzwInfoVO?.map((site, siteIndex) => (
                          <Checkbox
                            key={site.siteId || siteIndex}
                            checked={selectedPermissions.has(`/site/${site.siteId}`)}
                            onChange={() => togglePermission(`/site/${site.siteId}`)}
                            style={{ marginRight: 0 }}
                          >
                            {site.sitename || site.siteId}
                          </Checkbox>
                        ))}
                        {(!gzw.gzwInfoVO || gzw.gzwInfoVO.length === 0) && (
                          <span style={{ color: '#c9cdd4', fontSize: 12 }}>暂无工点</span>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {(!bd.bdInfoVO || bd.bdInfoVO.length === 0) && (
                    <div style={{ marginLeft: 24, color: '#c9cdd4', fontSize: 12 }}>暂无工作面数据</div>
                  )}
                  
                  {bdIndex < bdGdList.length - 1 && <Divider style={{ margin: '16px 0' }} />}
                </div>
              ))}
            </div>
          )}
        </Spin>
      </Modal>
    </Card>
  )
}

export default PermissionManagement

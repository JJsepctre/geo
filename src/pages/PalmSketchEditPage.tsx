import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom'
import {
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Button,
  Message,
  Tabs,
  Grid,
  Spin,
  Space,
  Upload,
  Table
} from '@arco-design/web-react'
import { IconLeft, IconSave, IconPlus } from '@arco-design/web-react/icon'
import apiAdapter from '../services/apiAdapter'
import SegmentModal, { SegmentData } from '../components/SegmentModal'

const { TextArea } = Input
const TabPane = Tabs.TabPane
const { Row, Col } = Grid

function PalmSketchEditPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  
  const siteId = searchParams.get('siteId')
  
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('basic')
  const [segmentList, setSegmentList] = useState<any[]>([])
  const [originalData, setOriginalData] = useState<any>(null) // 保存原始数据
  
  // 分段信息弹窗相关状态
  const [segmentModalVisible, setSegmentModalVisible] = useState(false)
  const [editingSegment, setEditingSegment] = useState<SegmentData | null>(null)

  // 打开新增分段弹窗
  const handleOpenSegmentModal = () => {
    setEditingSegment(null)
    setSegmentModalVisible(true)
  }

  // 打开编辑分段弹窗
  const handleEditSegment = (index: number) => {
    setEditingSegment({ ...segmentList[index], _index: index } as any)
    setSegmentModalVisible(true)
  }

  // 确认添加/编辑分段
  const handleConfirmSegment = (data: SegmentData) => {
    const segmentWithIndex = editingSegment as any
    if (segmentWithIndex && segmentWithIndex._index !== undefined) {
      // 编辑模式
      const newSegments = [...segmentList]
      newSegments[segmentWithIndex._index] = data
      setSegmentList(newSegments)
    } else {
      // 新增模式
      setSegmentList([...segmentList, data])
    }
    setSegmentModalVisible(false)
  }

  // 删除分段
  const handleDeleteSegment = (index: number) => {
    const newSegments = [...segmentList]
    newSegments.splice(index, 1)
    setSegmentList(newSegments)
  }

  // 获取详情数据
  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return
      
      setLoading(true)
      try {
        // 尝试从路由状态获取
        if (location.state?.record) {
          const data = location.state.record
          form.setFieldsValue(data)
          setOriginalData(data)
        }
        
        // 调用详情接口 - 使用真实API
        const detail = await apiAdapter.getPalmSketchDetail(id)
        if (detail) {
          // 里程拆分：将 dkilo 拆分为 dkiloKm 和 dkiloM
          let dkiloKm, dkiloM;
          if (detail.dkilo !== undefined && detail.dkilo !== null) {
            dkiloKm = Math.floor(detail.dkilo / 1000);
            dkiloM = detail.dkilo % 1000;
          }
          const formData = { ...detail, dkiloKm, dkiloM };
          form.setFieldsValue(formData)
          setOriginalData(detail) // 保存原始数据
          console.log('✅ 掌子面素描详情数据:', detail)
          
          // 设置分段信息列表
          if (detail.ybjgVOList) {
            setSegmentList(detail.ybjgVOList)
            console.log('📊 分段信息数据:', detail.ybjgVOList)
          }
        }
      } catch (error) {
        console.error('❌ 获取详情失败:', error)
        Message.error('获取详情数据失败')
      } finally {
        setLoading(false)
      }
    }
    
    fetchDetail()
  }, [id, location.state, form])

  const handleBack = () => {
    if (siteId) {
      navigate(`/forecast/geology/${siteId}`)
    } else {
      navigate(-1)
    }
  }

  const handleSave = async () => {
    try {
      await form.validate()
      const values = form.getFieldsValue()
      
      setSaving(true)
      
      const isNew = id === 'new'
      
      // 里程合并：将 dkiloKm 和 dkiloM 合并为 dkilo
      const dkilo = (values.dkiloKm || 0) * 1000 + (values.dkiloM || 0);
      
      // 合并原始数据和表单修改的数据，确保未修改的字段保留原值
      const submitData = {
        ...originalData,  // 先用原始数据
        ...values,        // 再用表单值覆盖（用户修改的部分）
        dkilo,            // 使用合并后的里程值
        ybPk: null,       // 临时设置为null，后端修复后改回
        siteId: siteId || originalData?.siteId,
        method: 7,        // 掌子面素描的method为7
      }
      // 清理临时字段
      delete submitData.dkiloKm;
      delete submitData.dkiloM;
      
      console.log('📤 [掌子面素描] 提交数据:', submitData, '是否新增:', isNew)
      
      let result
      if (isNew) {
        // 新增模式调用create接口
        result = await apiAdapter.createPalmSketch(submitData)
      } else {
        // 编辑模式调用update接口
        result = await apiAdapter.updatePalmSketch(id!, submitData)
      }
      
      if (result?.success) {
        Message.success(isNew ? '新增成功' : '保存成功')
        handleBack()
      } else {
        Message.error(result?.message || (isNew ? '新增失败' : '保存失败'))
      }
    } catch (error) {
      console.error('❌ 保存失败:', error)
      Message.error('保存失败，请检查表单')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* 顶部信息栏 */}
      <div style={{ 
        height: 48,
        background: '#E6E8EB',
        borderRadius: '4px 4px 0 0',
        marginBottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        color: '#1D2129',
        fontSize: '14px',
        fontWeight: 500,
        borderBottom: '1px solid #C9CDD4'
      }}>
        <span>掌子面素描编辑</span>
        <Button 
          type="text" 
          icon={<IconLeft style={{ fontSize: 18 }} />} 
          style={{ color: '#1D2129' }}
          onClick={handleBack}
        />
      </div>

      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '0 0 4px 4px' }}>
        <Spin loading={loading} style={{ width: '100%' }}>
          <Tabs activeTab={activeTab} onChange={setActiveTab} type="card">
            {/* 基本信息其他信息 Tab */}
            <TabPane key="basic" title="基本信息其他信息">
              <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
                <div style={{ 
                  textAlign: 'center', 
                  fontSize: 16, 
                  fontWeight: 600, 
                  marginBottom: 24,
                  padding: '12px 0',
                  backgroundColor: '#f7f8fa',
                  borderRadius: 4
                }}>
                  基本信息
                </div>
                
                <Row gutter={24}>
                  <Col span={8}>
                    <Form.Item label="预报时间" field="monitordate" rules={[{ required: true, message: '请选择预报时间' }]}>
                      <DatePicker showTime style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={4}>
                    <Form.Item label="里程冠号" field="dkname" rules={[{ required: true, message: '请输入里程冠号' }]}>
                      <Input placeholder="DK" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="掌子面里程" required>
                      <Space>
                        <Form.Item field="dkiloKm" noStyle rules={[{ required: true, message: '请输入' }]}>
                          <InputNumber placeholder="180" style={{ width: 100 }} precision={0} min={0} />
                        </Form.Item>
                        <span>+</span>
                        <Form.Item field="dkiloM" noStyle rules={[{ required: true, message: '请输入' }]}>
                          <InputNumber placeholder="972" style={{ width: 100 }} precision={0} min={0} max={999} />
                        </Form.Item>
                      </Space>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={24}>
                  <Col span={8}>
                    <Form.Item label="检测人" field="testname" rules={[{ required: true, message: '请输入检测人' }]}>
                      <Input placeholder="请输入检测人" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="检测人身份证" field="testno" rules={[{ required: true, message: '请输入检测人身份证' }]}>
                      <Input placeholder="请输入检测人身份证" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="检测人电话" field="testtel">
                      <Input placeholder="请输入检测人电话" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={24}>
                  <Col span={8}>
                    <Form.Item label="复核人" field="monitorname" rules={[{ required: true, message: '请输入复核人' }]}>
                      <Input placeholder="请输入复核人" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="复核人身份证" field="monitorno" rules={[{ required: true, message: '请输入复核人身份证' }]}>
                      <Input placeholder="请输入复核人身份证" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="复核人电话" field="monitortel">
                      <Input placeholder="请输入复核人电话" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={24}>
                  <Col span={8}>
                    <Form.Item label="监理工程师" field="supervisorname" rules={[{ required: true, message: '请输入监理工程师' }]}>
                      <Input placeholder="请输入监理工程师" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="监理身份证" field="supervisorno" rules={[{ required: true, message: '请输入监理身份证' }]}>
                      <Input placeholder="请输入监理身份证" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="监理电话" field="supervisortel">
                      <Input placeholder="请输入监理电话" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={24}>
                  <Col span={8}>
                    <Form.Item label="开挖分区" field="kwfs">
                      <Select placeholder="请选择开挖分区">
                        <Select.Option value={1}>全断面法</Select.Option>
                        <Select.Option value={2}>台阶法</Select.Option>
                        <Select.Option value={3}>CD法</Select.Option>
                        <Select.Option value={4}>双侧壁导坑法</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                {/* 掌子面图示 */}
                <Row gutter={24}>
                  <Col span={24}>
                    <Form.Item label="掌子面位置">
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '20px',
                        border: '1px solid #e5e6eb',
                        borderRadius: 4,
                        backgroundColor: '#f7f8fa'
                      }}>
                        {/* 这里可以放置掌子面示意图 */}
                        <div style={{ fontSize: 14, color: '#86909c' }}>掌子面位置示意图</div>
                      </div>
                    </Form.Item>
                  </Col>
                </Row>

                <div style={{ 
                  textAlign: 'center', 
                  fontSize: 16, 
                  fontWeight: 600, 
                  margin: '32px 0 24px',
                  padding: '12px 0',
                  backgroundColor: '#f7f8fa',
                  borderRadius: 4
                }}>
                  开挖方式及水平
                </div>

                <Row gutter={24}>
                  <Col span={8}>
                    <Form.Item label="拱顶围岩级别" field="basicwylevel">
                      <Select placeholder="请选择围岩级别">
                        <Select.Option value={1}>Ⅰ</Select.Option>
                        <Select.Option value={2}>Ⅱ</Select.Option>
                        <Select.Option value={3}>Ⅲ</Select.Option>
                        <Select.Option value={4}>Ⅳ</Select.Option>
                        <Select.Option value={5}>Ⅴ</Select.Option>
                        <Select.Option value={6}>Ⅵ</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item 
                      label="开挖高度" 
                      field="kwgd"
                      extra="单位：m，保留2位小数，整数位不超过3位"
                    >
                      <InputNumber placeholder="请输入" style={{ width: '100%' }} precision={2} min={0} max={999.99} suffix="m" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item 
                      label="开挖宽度" 
                      field="kwkd"
                      extra="单位：m，保留2位小数，整数位不超过3位"
                    >
                      <InputNumber placeholder="请输入" style={{ width: '100%' }} precision={2} min={0} max={999.99} suffix="m" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={24}>
                  <Col span={8}>
                    <Form.Item 
                      label="距洞口距离" 
                      field="jdkjl"
                      extra="单位：m，保留2位小数，掌子面距开挖洞口当前的距离"
                    >
                      <InputNumber placeholder="请输入" style={{ width: '100%' }} precision={2} min={0} suffix="m" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item 
                      label="开挖面积" 
                      field="kwmj"
                      extra="单位：m²，保留2位小数，整数位不超过6位"
                    >
                      <InputNumber placeholder="请输入" style={{ width: '100%' }} precision={2} min={0} max={999999.99} suffix="m²" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="爆破数" field="bwnum">
                      <InputNumber placeholder="请输入爆破数" style={{ width: '100%' }} min={0} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="掌子面状态" field="zzmzt">
                      <Select placeholder="请选择">
                        <Select.Option value="稳定">稳定</Select.Option>
                        <Select.Option value="较稳定">较稳定</Select.Option>
                        <Select.Option value="不稳定">不稳定</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={24}>
                  <Col span={24}>
                    <Form.Item label="掌子面状态描述" field="zzmms">
                      <TextArea 
                        placeholder="请输入掌子面状态描述" 
                        maxLength={512}
                        showWordLimit
                        style={{ minHeight: 100 }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </TabPane>

            {/* 其他信息及岩土体数据信息 Tab */}
            <TabPane key="rocksoil" title="其他信息及岩土体数据信息">
              <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
                <div style={{ 
                  textAlign: 'center', 
                  fontSize: 16, 
                  fontWeight: 600, 
                  marginBottom: 24,
                  padding: '12px 0',
                  backgroundColor: '#f7f8fa',
                  borderRadius: 4
                }}>
                  其他信息
                </div>

                <Row gutter={24}>
                  <Col span={8}>
                    <Form.Item label="预报分段结论" field="conclusionyb">
                      <TextArea 
                        placeholder="如：掘进性一般，掌子面无水，实际围岩情况与设计相符。" 
                        maxLength={512}
                        showWordLimit
                        style={{ minHeight: 100 }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="后续建议" field="suggestion">
                      <TextArea 
                        placeholder="该段岩溶裂隙发育，加强加深炮孔探测，超前支护，初期支护增强，做好防排水措施，防止掉块，和围岩失稳，确保..." 
                        maxLength={512}
                        showWordLimit
                        style={{ minHeight: 100 }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="实际采取措施" field="solution">
                      <TextArea 
                        placeholder="无" 
                        maxLength={512}
                        showWordLimit
                        style={{ minHeight: 100 }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={24}>
                  <Col span={24}>
                    <Form.Item label="备注" field="remark">
                      <TextArea 
                        placeholder="该段岩溶裂隙发育，九隧加深炮孔探测，超前支护，初期支护增强，做好防排水措施，防止掉块，和围岩失稳，确保..." 
                        maxLength={512}
                        showWordLimit
                        style={{ minHeight: 80 }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={24}>
                  <Col span={8}>
                    <Form.Item label="岩土特征类别" field="zzmsmType" rules={[{ required: true, message: '请选择岩土特征类别' }]}>
                      <Select placeholder="请选择">
                        <Select.Option value={1}>岩体</Select.Option>
                        <Select.Option value={2}>土体</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                {/* 岩体数据 - 当zzmsmType=1时显示 */}
                <div style={{ 
                  textAlign: 'center', 
                  fontSize: 16, 
                  fontWeight: 600, 
                  margin: '32px 0 24px',
                  padding: '12px 0',
                  backgroundColor: '#f7f8fa',
                  borderRadius: 4
                }}>
                  岩体数据
                </div>

                <Row gutter={24}>
                  <Col span={8}>
                    <Form.Item label="岩体类型" field="ytlx">
                      <Input placeholder="如：花岗岩、石灰岩" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="内聚力" field="njl" extra="单位：MPa，最多2位小数">
                      <InputNumber placeholder="请输入" style={{ width: '100%' }} precision={2} min={0} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="内摩擦角" field="nfcj" extra="单位：°，最多2位小数">
                      <InputNumber placeholder="请输入" style={{ width: '100%' }} precision={2} min={0} max={90} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={24}>
                  <Col span={8}>
                    <Form.Item label="单轴饱和抗压强度" field="dzbhkyqd" extra="单位：MPa，最多2位小数">
                      <InputNumber placeholder="请输入" style={{ width: '100%' }} precision={2} min={0} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="点荷载强度指数" field="dhzqdjx" extra="单位：MPa，最多2位小数">
                      <InputNumber placeholder="请输入" style={{ width: '100%' }} precision={2} min={0} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="变形模量" field="bxml" extra="单位：GPa，最多2位小数">
                      <InputNumber placeholder="请输入" style={{ width: '100%' }} precision={2} min={0} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={24}>
                  <Col span={8}>
                    <Form.Item label="泊松比" field="bsb" extra="最多2位小数">
                      <InputNumber placeholder="请输入" style={{ width: '100%' }} precision={2} min={0} max={0.5} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="天然重度" field="trzd" extra="单位：kN/m³，最多2位小数">
                      <InputNumber placeholder="请输入" style={{ width: '100%' }} precision={2} min={0} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="岩性组别其他" field="yxzbqt">
                      <Input placeholder="请输入" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={24}>
                  <Col span={8}>
                    <Form.Item label="岩性组别评定" field="yxzbpd">
                      <Select placeholder="请选择">
                        <Select.Option value={1}>坚硬岩</Select.Option>
                        <Select.Option value={2}>较坚硬岩</Select.Option>
                        <Select.Option value={3}>较软岩</Select.Option>
                        <Select.Option value={4}>软岩</Select.Option>
                        <Select.Option value={5}>极软岩</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="地质构造影响程度" field="dzgzyxcd">
                      <Select placeholder="请选择">
                        <Select.Option value={1}>轻微</Select.Option>
                        <Select.Option value={2}>较重</Select.Option>
                        <Select.Option value={3}>严重</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="结构面组数" field="jgmzs">
                      <InputNumber placeholder="请输入" style={{ width: '100%' }} min={0} precision={0} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={24}>
                  <Col span={8}>
                    <Form.Item label="平均间距" field="pjjj" extra="单位：m，最多2位小数">
                      <InputNumber placeholder="请输入" style={{ width: '100%' }} precision={2} min={0} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="主要结构面产状" field="zyjgmcz">
                      <Input placeholder="如：120°∠60°" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="其他结构面产状" field="qtjgmcz">
                      <Input placeholder="如：45°∠75°" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={24}>
                  <Col span={8}>
                    <Form.Item label="延伸性" field="ysx">
                      <Select placeholder="请选择">
                        <Select.Option value={1}>极短</Select.Option>
                        <Select.Option value={2}>短</Select.Option>
                        <Select.Option value={3}>中等</Select.Option>
                        <Select.Option value={4}>长</Select.Option>
                        <Select.Option value={5}>极长</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="粗糙度" field="ccd">
                      <Select placeholder="请选择">
                        <Select.Option value={1}>光滑</Select.Option>
                        <Select.Option value={2}>较光滑</Select.Option>
                        <Select.Option value={3}>较粗糙</Select.Option>
                        <Select.Option value={4}>粗糙</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="张开度" field="zkd" extra="单位：mm，最多2位小数">
                      <InputNumber placeholder="请输入" style={{ width: '100%' }} precision={2} min={0} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={24}>
                  <Col span={8}>
                    <Form.Item label="填充及胶结" field="tchjz">
                      <Input placeholder="如：无填充、泥质填充" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="风化程度" field="fxcd">
                      <Select placeholder="请选择">
                        <Select.Option value={1}>未风化</Select.Option>
                        <Select.Option value={2}>微风化</Select.Option>
                        <Select.Option value={3}>中等风化</Select.Option>
                        <Select.Option value={4}>强风化</Select.Option>
                        <Select.Option value={5}>全风化</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="岩体完整状态评定" field="ytwzztpd">
                      <Select placeholder="请选择">
                        <Select.Option value={1}>完整</Select.Option>
                        <Select.Option value={2}>较完整</Select.Option>
                        <Select.Option value={3}>较破碎</Select.Option>
                        <Select.Option value={4}>破碎</Select.Option>
                        <Select.Option value={5}>极破碎</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={24}>
                  <Col span={24}>
                    <Form.Item label="岩体完整性描述" field="ytwzsm">
                      <TextArea placeholder="请输入岩体完整性描述" maxLength={512} showWordLimit style={{ minHeight: 80 }} />
                    </Form.Item>
                  </Col>
                </Row>

                {/* 土体数据 - 当zzmsmType=2时显示 */}
                <div style={{ 
                  textAlign: 'center', 
                  fontSize: 16, 
                  fontWeight: 600, 
                  margin: '32px 0 24px',
                  padding: '12px 0',
                  backgroundColor: '#f7f8fa',
                  borderRadius: 4
                }}>
                  土体数据
                </div>

                <Row gutter={24}>
                  <Col span={8}>
                    <Form.Item label="土名称" field="soilname">
                      <Select placeholder="请选择土名称">
                        <Select.Option value={1}>粘性土</Select.Option>
                        <Select.Option value={2}>粉土</Select.Option>
                        <Select.Option value={3}>砂土</Select.Option>
                        <Select.Option value={4}>粗粒土</Select.Option>
                        <Select.Option value={5}>其他</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="土名称补充" field="soilname2">
                      <Input placeholder="如：粘土、砂质粘土" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="地质年代" field="dznd">
                      <InputNumber placeholder="请输入" style={{ width: '100%' }} precision={0} min={0} />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={24}>
                  <Col span={8}>
                    <Form.Item label="地质成因" field="dzcy">
                      <Input placeholder="如：沉积、冲积" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="土体其他信息" field="ttqtxx">
                      <Input placeholder="如：含砾石" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="状态" field="zt">
                      <Select placeholder="请选择状态">
                        <Select.Option value="硬塑">硬塑</Select.Option>
                        <Select.Option value="可塑">可塑</Select.Option>
                        <Select.Option value="软塑">软塑</Select.Option>
                        <Select.Option value="流塑">流塑</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={24}>
                  <Col span={8}>
                    <Form.Item label="湿度" field="sd" extra="最多2位小数">
                      <InputNumber 
                        placeholder="请输入" 
                        style={{ width: '100%' }} 
                        precision={2}
                        min={0}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="密实度" field="msd" extra="最多2位小数">
                      <InputNumber 
                        placeholder="请输入" 
                        style={{ width: '100%' }} 
                        precision={2}
                        min={0}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="级配" field="jp">
                      <Input placeholder="如：良好、不良" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={24}>
                  <Col span={8}>
                    <Form.Item label="密度" field="md" extra="单位：g/cm³，最多2位小数">
                      <InputNumber 
                        placeholder="请输入" 
                        style={{ width: '100%' }} 
                        precision={2}
                        min={0}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="含水量" field="hsl" extra="单位：%，最多2位小数" rules={[{ required: true, message: '请输入含水量' }]}>
                      <InputNumber 
                        placeholder="请输入" 
                        style={{ width: '100%' }} 
                        precision={2}
                        min={0}
                        max={100}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="压缩模量" field="ysml" extra="单位：MPa，最多2位小数" rules={[{ required: true, message: '请输入压缩模量' }]}>
                      <InputNumber 
                        placeholder="请输入" 
                        style={{ width: '100%' }} 
                        precision={2}
                        min={0}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={24}>
                  <Col span={8}>
                    <Form.Item label="纵波波速" field="zbbs" extra="单位：km/s，最多2位小数">
                      <InputNumber 
                        placeholder="请输入" 
                        style={{ width: '100%' }} 
                        precision={2}
                        min={0}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </TabPane>

            {/* 掌子面数据 Tab */}
            <TabPane key="facedata" title="掌子面数据">
              <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
                <div style={{ 
                  textAlign: 'center', 
                  fontSize: 16, 
                  fontWeight: 600, 
                  marginBottom: 24,
                  padding: '12px 0',
                  backgroundColor: '#f7f8fa',
                  borderRadius: 4
                }}>
                  掌子面三维数据
                </div>

                <Row gutter={24}>
                  <Col span={8}>
                    <Form.Item 
                      label="围岩基本分级" 
                      field="basicwylevel"
                      extra="岩体时Ⅰ至Ⅵ可用；土体时Ⅳ至Ⅵ可用"
                    >
                      <Select placeholder="请选择围岩基本分级">
                        <Select.Option value={1} disabled={form.getFieldValue('zzmsmType') === 2}>Ⅰ</Select.Option>
                        <Select.Option value={2} disabled={form.getFieldValue('zzmsmType') === 2}>Ⅱ</Select.Option>
                        <Select.Option value={3} disabled={form.getFieldValue('zzmsmType') === 2}>Ⅲ</Select.Option>
                        <Select.Option value={4}>Ⅳ</Select.Option>
                        <Select.Option value={5}>Ⅴ</Select.Option>
                        <Select.Option value={6}>Ⅵ</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item 
                      label="埋深H" 
                      field="ms"
                      extra="单位：m，保留2位小数，整数位不超过4位"
                    >
                      <InputNumber 
                        placeholder="请输入埋深" 
                        style={{ width: '100%' }} 
                        precision={2}
                        min={0}
                        max={9999.99}
                        suffix="m"
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item 
                      label="渗水量" 
                      field="shenshuiliang"
                      extra="单位：L/(min·10m)，不超过3位整数"
                    >
                      <InputNumber 
                        placeholder="请输入渗水量" 
                        style={{ width: '100%' }} 
                        min={0}
                        max={999}
                        suffix="L/(min·10m)"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={24}>
                  <Col span={8}>
                    <Form.Item 
                      label="评估基准Rc/σmax" 
                      field="pgjz"
                      extra="不超过3位整数"
                    >
                      <InputNumber 
                        placeholder="请输入评估基准" 
                        style={{ width: '100%' }} 
                        min={0}
                        max={999}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="地下水评定" field="dxspd">
                      <Select placeholder="请选择地下水评定">
                        <Select.Option value={1}>无地下水</Select.Option>
                        <Select.Option value={2}>潮湿或点滴状出水</Select.Option>
                        <Select.Option value={3}>淋雨状或线流状出水</Select.Option>
                        <Select.Option value={4}>涌流状出水</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item 
                      label="修正后围岩级别" 
                      field="fixwylevel"
                      extra="岩体时Ⅰ至Ⅵ可用；土体时Ⅳ至Ⅵ可用"
                    >
                      <Select placeholder="请选择修正后围岩级别">
                        <Select.Option value={1} disabled={form.getFieldValue('zzmsmType') === 2}>Ⅰ</Select.Option>
                        <Select.Option value={2} disabled={form.getFieldValue('zzmsmType') === 2}>Ⅱ</Select.Option>
                        <Select.Option value={3} disabled={form.getFieldValue('zzmsmType') === 2}>Ⅲ</Select.Option>
                        <Select.Option value={4}>Ⅳ</Select.Option>
                        <Select.Option value={5}>Ⅴ</Select.Option>
                        <Select.Option value={6}>Ⅵ</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={24}>
                  <Col span={8}>
                    <Form.Item label="初始地应力评定" field="csdylpd">
                      <Input placeholder="请输入初始地应力评定" />
                    </Form.Item>
                  </Col>
                  <Col span={16}>
                    <Form.Item label="地质构造应力" field="dzgzyl">
                      <TextArea 
                        placeholder="请输入地质构造应力描述" 
                        maxLength={512}
                        showWordLimit
                        style={{ minHeight: 80 }}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={24}>
                  <Col span={24}>
                    <Form.Item label="掌子面描述" field="zzmms">
                      <TextArea 
                        placeholder="请输入掌子面描述" 
                        maxLength={512}
                        showWordLimit
                        style={{ minHeight: 120 }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </TabPane>

            {/* 分段信息及下次超前 Tab */}
            <TabPane key="segment" title="分段信息及下次超前">
              <div style={{ marginTop: 20 }}>
                <div style={{ 
                  textAlign: 'center', 
                  fontSize: 16, 
                  fontWeight: 600, 
                  marginBottom: 24,
                  padding: '12px 0',
                  backgroundColor: '#f7f8fa',
                  borderRadius: 4
                }}>
                  分段信息
                </div>

                <div style={{ marginBottom: 16 }}>
                  <Button type="primary" icon={<IconPlus />} onClick={handleOpenSegmentModal}>
                    添加
                  </Button>
                </div>
                
                <Table
                  columns={[
                    { title: '序号', dataIndex: 'index', width: 80, render: (_: any, __: any, index: number) => index + 1 },
                    { title: '里程起点', dataIndex: 'dkname', width: 100 },
                    { title: '开始里程值', dataIndex: 'sdkilo', width: 120 },
                    { title: '结束里程值', dataIndex: 'edkilo', width: 120 },
                    { 
                      title: '生成时间', 
                      dataIndex: 'ybjgTime', 
                      width: 160,
                      render: (time: string) => time ? time.replace('T', ' ').substring(0, 16) : '-'
                    },
                    { 
                      title: '风险类别', 
                      dataIndex: 'risklevel', 
                      width: 100,
                      align: 'center' as const,
                      render: (val: string) => {
                        const riskMap: Record<string, string> = { '1': '低风险', '2': '中风险', '3': '高风险', '4': '极高风险' }
                        const riskText = riskMap[val] || val || '-'
                        const colorMap: Record<string, string> = { '低风险': '#00b42a', '中风险': '#ff7d00', '高风险': '#f53f3f', '极高风险': '#d91ad9' }
                        const color = colorMap[riskText] || '#1d2129'
                        return <span style={{ color, fontWeight: 500 }}>{riskText}</span>
                      }
                    },
                    { 
                      title: '地质类型', 
                      dataIndex: 'dzjb', 
                      width: 100,
                      render: (val: string) => {
                        const colorMap: Record<string, { bg: string; text: string; label: string }> = {
                          'green': { bg: '#52c41a', text: '#fff', label: '绿色' },
                          'yellow': { bg: '#faad14', text: '#fff', label: '黄色' },
                          'red': { bg: '#ff4d4f', text: '#fff', label: '红色' },
                        }
                        const config = colorMap[val]
                        if (config) {
                          return <span style={{ backgroundColor: config.bg, color: config.text, padding: '2px 8px', borderRadius: 4 }}>{config.label}</span>
                        }
                        return val || '-'
                      }
                    },
                    { 
                      title: '围岩等级', 
                      dataIndex: 'wylevel', 
                      width: 110,
                      align: 'center' as const,
                      render: (val: number, record: any) => {
                        if (val) {
                          const rockGradeMap = ['Ⅰ', 'Ⅱ', 'Ⅲ', 'Ⅳ', 'Ⅴ', 'Ⅵ']
                          const grade = rockGradeMap[val - 1] || val
                          const subGrade = record.grade ? `-${record.grade}` : ''
                          return `围岩${grade}${subGrade}`
                        }
                        return '-'
                      }
                    },
                    { title: '预报动态', dataIndex: 'jlresult', ellipsis: true, width: 200 },
                    {
                      title: '操作',
                      width: 120,
                      render: (_: any, __: any, index: number) => (
                        <Space>
                          <Button type="text" size="small" style={{ color: '#165DFF' }} onClick={() => handleEditSegment(index)}>编辑</Button>
                          <Button type="text" size="small" status="danger" onClick={() => handleDeleteSegment(index)}>删除</Button>
                        </Space>
                      ),
                    }
                  ]}
                  data={segmentList}
                  rowKey={(record: any, index?: number) => record.ybjgPk || String(index)}
                  pagination={false}
                  border
                />

                {/* 底部搜索过滤区域 */}
                <div style={{ 
                  marginTop: 24, 
                  padding: '16px 20px', 
                  backgroundColor: '#f7f8fa', 
                  borderRadius: 4,
                  border: '1px solid #e5e6eb'
                }}>
                  <div style={{ 
                    fontSize: 14, 
                    fontWeight: 600, 
                    marginBottom: 16,
                    color: '#1d2129'
                  }}>
                    下次超前地质预报
                  </div>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item label="下次超前预报方法" style={{ marginBottom: 0 }}>
                        <Select placeholder="请选择预报方法" style={{ width: '100%' }}>
                          <Select.Option value="1">地震波反射</Select.Option>
                          <Select.Option value="2">水平声波剖面</Select.Option>
                          <Select.Option value="3">陆地声呐</Select.Option>
                          <Select.Option value="4">电磁波反射</Select.Option>
                          <Select.Option value="5">高分辨直流电</Select.Option>
                          <Select.Option value="6">瞬变电磁</Select.Option>
                          <Select.Option value="13">超前水平钻</Select.Option>
                          <Select.Option value="14">加深炮孔</Select.Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="预报时间日期" style={{ marginBottom: 0 }}>
                        <DatePicker style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              </div>
            </TabPane>

            {/* 附件及图片上传 Tab */}
            <TabPane key="upload" title="附件及图片上传">
              <div style={{ marginTop: 20 }}>
                <div style={{ 
                  textAlign: 'center', 
                  fontSize: 16, 
                  fontWeight: 600, 
                  marginBottom: 24,
                  padding: '12px 0',
                  backgroundColor: '#f7f8fa',
                  borderRadius: 4
                }}>
                  附件及图片管理
                </div>

                <Row gutter={24}>
                  {/* 附件（word/pdf） */}
                  <Col span={8}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ marginBottom: 12, fontWeight: 500 }}>附件（word/pdf）</div>
                      <Upload
                        action="/api/v1/zzmsm/file"
                        accept=".doc,.docx,.pdf"
                        listType="picture-card"
                        limit={1}
                        onChange={(fileList) => {
                          console.log('附件上传:', fileList)
                        }}
                      >
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 20, color: '#86909c' }}>+</div>
                          <div style={{ fontSize: 12, color: '#86909c', marginTop: 8 }}>上传</div>
                        </div>
                      </Upload>
                    </div>
                  </Col>

                  {/* 掌子面照片 */}
                  <Col span={8}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ marginBottom: 12, fontWeight: 500 }}>掌子面照片</div>
                      <Upload
                        action="/api/v1/zzmsm/file"
                        accept="image/*"
                        listType="picture-card"
                        limit={1}
                        onChange={(fileList) => {
                          console.log('掌子面照片上传:', fileList)
                        }}
                      >
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 20, color: '#86909c' }}>+</div>
                          <div style={{ fontSize: 12, color: '#86909c', marginTop: 8 }}>上传</div>
                        </div>
                      </Upload>
                    </div>
                  </Col>

                  {/* 综合照片图片 */}
                  <Col span={8}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ marginBottom: 12, fontWeight: 500 }}>综合照片图片</div>
                      <Upload
                        action="/api/v1/zzmsm/file"
                        accept="image/*"
                        listType="picture-card"
                        limit={1}
                        onChange={(fileList) => {
                          console.log('综合照片图片上传:', fileList)
                        }}
                      >
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 20, color: '#86909c' }}>+</div>
                          <div style={{ fontSize: 12, color: '#86909c', marginTop: 8 }}>上传</div>
                        </div>
                      </Upload>
                    </div>
                  </Col>
                </Row>
              </div>
            </TabPane>
          </Tabs>

          {/* 底部按钮 */}
          <div style={{ marginTop: 24, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleBack}>取消</Button>
              <Button type="primary" icon={<IconSave />} loading={saving} onClick={handleSave}>
                保存
              </Button>
            </Space>
          </div>
        </Spin>
      </div>

      {/* 分段信息新增/编辑弹窗 */}
      <SegmentModal
        visible={segmentModalVisible}
        onCancel={() => setSegmentModalVisible(false)}
        onOk={handleConfirmSegment}
        editingData={editingSegment}
        defaultDkname={form.getFieldValue('dkname') || 'DK'}
      />
    </div>
  )
}

export default PalmSketchEditPage

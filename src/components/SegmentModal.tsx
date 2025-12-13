import React, { useState, useEffect } from 'react'
import {
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Tag,
  Grid
} from '@arco-design/web-react'

const { TextArea } = Input
const { Row, Col } = Grid

// 风险类别选项
export const RISK_LEVEL_OPTIONS = [
  { value: '破碎带', label: '破碎带' },
  { value: '岩溶', label: '岩溶' },
  { value: '瓦斯', label: '瓦斯' },
  { value: '涌水', label: '涌水' },
  { value: '突泥', label: '突泥' },
  { value: '地应力', label: '地应力' },
  { value: '采空区', label: '采空区' },
  { value: '岩爆', label: '岩爆' },
  { value: '其他', label: '其他' },
]

// 围岩等级选项
export const WYLEVEL_OPTIONS = [
  { value: 1, label: 'Ⅰ' },
  { value: 2, label: 'Ⅱ' },
  { value: 3, label: 'Ⅲ' },
  { value: 4, label: 'Ⅳ' },
  { value: 5, label: 'Ⅴ' },
  { value: 6, label: 'Ⅵ' },
]

// 地质级别颜色选项
export const DZJB_OPTIONS = [
  { value: 'green', label: '绿色', color: 'green' },
  { value: 'yellow', label: '黄色', color: 'gold' },
  { value: 'red', label: '红色', color: 'red' },
]

export interface SegmentData {
  ybjgPk?: number
  ybjgId?: number
  ybPk?: number
  dkname?: string
  sdkilo?: number
  edkilo?: number
  sdkiloEnd?: number
  edkiloEnd?: number
  ybjgTime?: string
  risklevel?: string
  wylevel?: number
  grade?: number
  dzjb?: string
  jlresult?: string
}

interface SegmentModalProps {
  visible: boolean
  onCancel: () => void
  onOk: (data: SegmentData) => void
  editingData?: SegmentData | null
  defaultDkname?: string
}

function SegmentModal({ visible, onCancel, onOk, editingData, defaultDkname = 'X2DK' }: SegmentModalProps) {
  const [form] = Form.useForm()
  const [selectedDzjb, setSelectedDzjb] = useState<string>('')

  // 当弹窗打开或编辑数据变化时，重置表单
  useEffect(() => {
    if (visible) {
      if (editingData) {
        form.setFieldsValue(editingData)
        setSelectedDzjb(editingData.dzjb || '')
      } else {
        form.resetFields()
        form.setFieldsValue({
          dkname: defaultDkname,
          wylevel: 1,
          ybjgTime: new Date().toISOString().replace('T', ' ').substring(0, 19)
        })
        setSelectedDzjb('')
      }
    }
  }, [visible, editingData, form, defaultDkname])

  const handleOk = async () => {
    try {
      await form.validate()
      const values = form.getFieldsValue()
      const dataWithDzjb = { ...values, dzjb: selectedDzjb }
      onOk(dataWithDzjb)
    } catch (e) {
      // 表单验证失败
    }
  }

  return (
    <Modal
      title={editingData ? '编辑分段信息' : '新增分段信息'}
      visible={visible}
      onOk={handleOk}
      onCancel={onCancel}
      style={{ width: 700 }}
      okText="确认"
      cancelText="取消"
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="里程冠号" field="dkname" rules={[{ required: true, message: '请输入里程冠号' }]}>
              <Input placeholder="X2DK" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="围岩等级" field="wylevel" rules={[{ required: true, message: '请选择围岩等级' }]}>
              <Select placeholder="请选择">
                {WYLEVEL_OPTIONS.map(opt => (
                  <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="开始里程" rules={[{ required: true, message: '请输入开始里程' }]}>
              <Input.Group>
                <Form.Item field="sdkilo" noStyle>
                  <InputNumber placeholder="713" min={0} step={1} precision={0} style={{ width: '45%' }} />
                </Form.Item>
                <span style={{ padding: '0 8px', lineHeight: '32px' }}>+</span>
                <Form.Item field="sdkiloEnd" noStyle>
                  <InputNumber placeholder="375" min={0} max={999} step={1} precision={0} style={{ width: '45%' }} />
                </Form.Item>
              </Input.Group>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="结束里程" rules={[{ required: true, message: '请输入结束里程' }]}>
              <Input.Group>
                <Form.Item field="edkilo" noStyle>
                  <InputNumber placeholder="713" min={0} step={1} precision={0} style={{ width: '45%' }} />
                </Form.Item>
                <span style={{ padding: '0 8px', lineHeight: '32px' }}>+</span>
                <Form.Item field="edkiloEnd" noStyle>
                  <InputNumber placeholder="400" min={0} max={999} step={1} precision={0} style={{ width: '45%' }} />
                </Form.Item>
              </Input.Group>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="产生时间" field="ybjgTime" rules={[{ required: true, message: '请选择时间' }]}>
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="风险类别" field="risklevel" rules={[{ required: true, message: '请选择风险类别' }]}>
              <Select placeholder="请选择风险类别">
                {RISK_LEVEL_OPTIONS.map(opt => (
                  <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="地质级别">
              <div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ marginRight: 8 }}>已选:</span>
                  {selectedDzjb && (
                    <Tag 
                      color={DZJB_OPTIONS.find(o => o.value === selectedDzjb)?.color || 'green'}
                      closable
                      onClose={() => setSelectedDzjb('')}
                    >
                      {DZJB_OPTIONS.find(o => o.value === selectedDzjb)?.label}
                    </Tag>
                  )}
                </div>
                <div>
                  <span style={{ marginRight: 8 }}>待选:</span>
                  {DZJB_OPTIONS.filter(o => o.value !== selectedDzjb).map(opt => (
                    <Tag 
                      key={opt.value}
                      color={opt.color} 
                      style={{ cursor: 'pointer', marginRight: 4 }} 
                      onClick={() => setSelectedDzjb(opt.value)}
                    >
                      {opt.label}
                    </Tag>
                  ))}
                </div>
              </div>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item label="预报结论" field="jlresult" rules={[{ required: true, message: '请输入预报结论' }]}>
              <TextArea 
                placeholder="文字描述" 
                maxLength={500}
                showWordLimit
                style={{ minHeight: 80 }}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  )
}

export default SegmentModal

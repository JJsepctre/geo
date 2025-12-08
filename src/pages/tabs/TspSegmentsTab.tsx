import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  InputNumber, 
  Select, 
  DatePicker, 
  Space, 
  Popconfirm, 
  Message,
  Grid
} from '@arco-design/web-react';
import { IconPlus, IconEdit, IconDelete } from '@arco-design/web-react/icon';
import dayjs from 'dayjs';

const FormItem = Form.Item;
const { Row, Col } = Grid;

// 风险等级映射
const RISK_LEVEL_OPTIONS = [
  { label: '无风险', value: '无风险' },
  { label: '低风险', value: '低风险' },
  { label: '中风险', value: '中风险' },
  { label: '高风险', value: '高风险' },
];

// 地质等级映射 (I-VI)
const GRADE_OPTIONS = [
  { label: 'I', value: 1 },
  { label: 'II', value: 2 },
  { label: 'III', value: 3 },
  { label: 'IV', value: 4 },
  { label: 'V', value: 5 },
  { label: 'VI', value: 6 },
];

// 围岩等级映射 (I-VI)
const WY_LEVEL_OPTIONS = [
  { label: 'I', value: 1 },
  { label: 'II', value: 2 },
  { label: 'III', value: 3 },
  { label: 'IV', value: 4 },
  { label: 'V', value: 5 },
  { label: 'VI', value: 6 },
];

// 预报方法映射 (用于底部下次预报)
const METHOD_OPTIONS = [
  { label: '地震波反射', value: 1 },
  { label: '水平声波剖面', value: 2 },
  { label: '陆地声呐', value: 3 },
  { label: '电磁波反射', value: 4 },
  { label: '高分辨直流电', value: 5 },
  { label: '瞬变电磁', value: 6 },
  { label: '超前水平钻', value: 13 },
  { label: '加深炮孔', value: 14 },
];

interface TspSegmentsTabProps {
  form: any; // 父组件的 form 实例
  ybjgList: any[]; // 分段列表数据
  onListChange: (list: any[]) => void; // 更新列表的回调
  onRemoteSave?: (partialData: any) => Promise<void>; // 远程保存回调
}

const TspSegmentsTab: React.FC<TspSegmentsTabProps> = ({ form, ybjgList = [], onListChange, onRemoteSave }) => {
  const [visible, setVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editForm] = Form.useForm();
  const [localList, setLocalList] = useState<any[]>(ybjgList);

  useEffect(() => {
    setLocalList(ybjgList || []);
  }, [ybjgList]);

  const columns = [
    {
      title: '序号',
      dataIndex: 'index',
      render: (_: any, __: any, index: number) => index + 1,
      width: 60,
    },
    {
      title: '里程冠号',
      dataIndex: 'dkname',
    },
    {
      title: '开始里程值',
      dataIndex: 'sdkilo',
    },
    {
      title: '结束里程值',
      dataIndex: 'edkilo',
    },
    {
      title: '生产时间',
      dataIndex: 'ybjgTime',
      render: (val: string) => val ? dayjs(val).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '风险类别',
      dataIndex: 'risklevel',
    },
    {
      title: '地质级别',
      dataIndex: 'grade',
      render: (val: number) => GRADE_OPTIONS.find(opt => opt.value === val)?.label || val,
    },
    {
      title: '围岩等级',
      dataIndex: 'wylevel',
      render: (val: number) => WY_LEVEL_OPTIONS.find(opt => opt.value === val)?.label || val,
    },
    {
      title: '预报结论',
      dataIndex: 'jlresult',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'operation',
      width: 120,
      render: (_: any, record: any, index: number) => (
        <Space>
          <Button 
            type="text" 
            size="small" 
            icon={<IconEdit />} 
            onClick={() => handleEdit(record, index)}
          />
          <Popconfirm
            title="确定要删除这条记录吗？"
            onOk={() => handleDelete(index)}
          >
            <Button 
              type="text" 
              status="danger" 
              size="small" 
              icon={<IconDelete />} 
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleAdd = () => {
    setEditingItem({ isNew: true });
    editForm.resetFields();
    // 默认值
    const now = new Date();
    // 简单的格式化 YYYY-MM-DD HH:mm:ss
    const timeStr = now.toISOString().replace('T', ' ').split('.')[0];
    
    editForm.setFieldsValue({
        dkname: form.getFieldValue('dkname') || 'DK',
        ybjgTime: timeStr
    });
    setVisible(true);
  };

  const handleEdit = (record: any, index: number) => {
    setEditingItem({ ...record, _index: index, isNew: false });
    editForm.setFieldsValue({
      ...record,
      // DatePicker 需要字符串或者 Date 对象? Arco 的 DatePicker 通常接受字符串
      ybjgTime: record.ybjgTime
    });
    setVisible(true);
  };

  const handleDelete = async (index: number) => {
    const newList = [...localList];
    newList.splice(index, 1);
    setLocalList(newList);
    onListChange(newList);
    if (onRemoteSave) await onRemoteSave({ ybjgDTOList: newList });
    Message.success('删除成功');
  };

  const handleModalOk = async () => {
    try {
      const values = await editForm.validate();
      // 格式化时间
      if (values.ybjgTime) {
          // 简单处理：如果包含 T，替换为空格
          if (typeof values.ybjgTime === 'string') {
              values.ybjgTime = values.ybjgTime.replace('T', ' ');
          }
      }

      let newList = [...localList];
      if (editingItem.isNew) {
        newList.push(values);
      } else {
        newList[editingItem._index] = { ...newList[editingItem._index], ...values };
      }

      setLocalList(newList);
      onListChange(newList);
      setVisible(false);
      if (onRemoteSave) await onRemoteSave({ ybjgDTOList: newList });
      Message.success(editingItem.isNew ? '添加成功' : '修改成功');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Button type="primary" icon={<IconPlus />} onClick={handleAdd}>新增</Button>
        <div style={{ fontWeight: 'bold', fontSize: 16 }}>分段列表</div>
      </div>

      <Table
        columns={columns}
        data={localList}
        pagination={{ pageSize: 5 }}
        rowKey={(record) => record.ybjgPk || Math.random()}
        borderCell
      />

      {/* 底部下次预报表单 */}
      <div style={{ marginTop: 24, borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
         <div style={{ fontWeight: 'bold', marginBottom: 16 }}>下次超前地质预报</div>
         <Row gutter={24}>
             <Col span={12}>
                 <FormItem label="下次预报方法" field="xcybff">
                     <Select placeholder="请选择" options={METHOD_OPTIONS} />
                 </FormItem>
             </Col>
             <Col span={12}>
                 <FormItem label="预报开始里程" field="xcybkslc">
                     <Input placeholder="请输入" />
                 </FormItem>
             </Col>
         </Row>
      </div>

      <Modal
        title={editingItem?.isNew ? '新增分段' : '编辑分段'}
        visible={visible}
        onOk={handleModalOk}
        onCancel={() => setVisible(false)}
        mountOnEnter={false}
        style={{ width: 700 }}
      >
        <Form form={editForm} layout="vertical">
          <Row gutter={24}>
            <Col span={12}>
              <FormItem label="里程冠号" field="dkname" rules={[{ required: true }]}>
                <Input placeholder="例如: DK" />
              </FormItem>
            </Col>
            <Col span={12}>
              <FormItem label="生产时间" field="ybjgTime">
                <DatePicker showTime style={{ width: '100%' }} />
              </FormItem>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <FormItem label="开始里程值" field="sdkilo" rules={[{ required: true, type: 'number' }]}>
                <InputNumber style={{ width: '100%' }} />
              </FormItem>
            </Col>
            <Col span={12}>
              <FormItem label="结束里程值" field="edkilo" rules={[{ required: true, type: 'number' }]}>
                <InputNumber style={{ width: '100%' }} />
              </FormItem>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={12}>
              <FormItem label="风险类别" field="risklevel">
                <Select options={RISK_LEVEL_OPTIONS} allowCreate />
              </FormItem>
            </Col>
            <Col span={12}>
               <FormItem label="地质级别" field="grade">
                 <Select options={GRADE_OPTIONS} />
               </FormItem>
            </Col>
          </Row>
          <Row gutter={24}>
             <Col span={12}>
               <FormItem label="围岩等级" field="wylevel">
                 <Select options={WY_LEVEL_OPTIONS} />
               </FormItem>
             </Col>
          </Row>
          <FormItem label="预报结论" field="jlresult">
             <Input.TextArea rows={4} />
          </FormItem>
        </Form>
      </Modal>
    </div>
  );
};

export default TspSegmentsTab;

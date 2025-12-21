import React, { useState } from 'react';
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  InputNumber, 
  Select, 
  Space, 
  Popconfirm, 
  Message 
} from '@arco-design/web-react';
import { IconPlus, IconEdit, IconDelete, IconDownload, IconImport } from '@arco-design/web-react/icon';

const FormItem = Form.Item;

// 波型映射
const BX_OPTIONS = [
  { label: 'P波', value: 1 },
  { label: 'SV波', value: 2 },
  { label: 'SH波', value: 3 },
];

interface TspParamsTabProps {
  pdList: any[];
  onPdListChange: (list: any[]) => void;
  bxList: any[];
  onBxListChange: (list: any[]) => void;
  onRemoteSave: (data: any) => Promise<void>;
}

const TspParamsTab: React.FC<TspParamsTabProps> = ({ 
  pdList = [], 
  onPdListChange, 
  bxList = [], 
  onBxListChange,
  onRemoteSave
}) => {
  // 炮点参数状态
  const [pdVisible, setPdVisible] = useState(false);
  const [pdEditingItem, setPdEditingItem] = useState<any>(null);
  const [pdForm] = Form.useForm();

  // 围岩参数状态
  const [bxVisible, setBxVisible] = useState(false);
  const [bxEditingItem, setBxEditingItem] = useState<any>(null);
  const [bxForm] = Form.useForm();

  // ==================== 炮点参数逻辑 ====================
  const pdColumns = [
    { title: '距离', dataIndex: 'pdjl' },
    { title: '深度', dataIndex: 'pdsd' },
    { title: '高度', dataIndex: 'height' },
    { title: '倾角', dataIndex: 'qj' },
    { title: '方位角', dataIndex: 'fwj' },
    { title: '药量', dataIndex: 'yl' },
    {
      title: '操作',
      key: 'operation',
      width: 120,
      render: (_: any, record: any, index: number) => (
        <Space>
          <Button type="text" size="small" icon={<IconEdit />} onClick={() => handlePdEdit(record, index)} />
          <Popconfirm title="确定删除?" onOk={() => handlePdDelete(index)}>
            <Button type="text" status="danger" size="small" icon={<IconDelete />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handlePdAdd = () => {
    setPdEditingItem({ isNew: true });
    pdForm.resetFields();
    setPdVisible(true);
  };

  const handlePdEdit = (record: any, index: number) => {
    setPdEditingItem({ ...record, _index: index, isNew: false });
    pdForm.setFieldsValue(record);
    setPdVisible(true);
  };

  const handlePdDelete = async (index: number) => {
    const newList = [...pdList];
    newList.splice(index, 1);
    onPdListChange(newList);
    if (onRemoteSave) await onRemoteSave({ tspPddataDTOList: newList });
  };

  const handlePdOk = async () => {
    try {
      const values = await pdForm.validate();
      const newList = [...pdList];
      if (pdEditingItem.isNew) {
        newList.push(values);
      } else {
        newList[pdEditingItem._index] = { ...newList[pdEditingItem._index], ...values };
      }
      onPdListChange(newList);
      setPdVisible(false);
      if (onRemoteSave) await onRemoteSave({ tspPddataDTOList: newList });
    } catch (e) { console.error(e); }
  };

  // ==================== 围岩参数逻辑 ====================
  const bxColumns = [
    { title: '地震波序号', dataIndex: 'jbxh' },
    { title: '检测器', dataIndex: 'jbq' },
    { 
      title: '类型', 
      dataIndex: 'bx',
      render: (val: number) => BX_OPTIONS.find(o => o.value === val)?.label || val
    },
    { title: '初至里程值', dataIndex: 'sdlcz' },
    { title: '波速', dataIndex: 'bs' },
    { title: 'VP/VS', dataIndex: 'vps' },
    { title: '泊松比', dataIndex: 'bsb' },
    { title: '密度', dataIndex: 'md' },
    {
      title: '操作',
      key: 'operation',
      width: 120,
      render: (_: any, record: any, index: number) => (
        <Space>
          <Button type="text" size="small" icon={<IconEdit />} onClick={() => handleBxEdit(record, index)} />
          <Popconfirm title="确定删除?" onOk={() => handleBxDelete(index)}>
            <Button type="text" status="danger" size="small" icon={<IconDelete />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleBxAdd = () => {
    setBxEditingItem({ isNew: true });
    bxForm.resetFields();
    setBxVisible(true);
  };

  const handleBxEdit = (record: any, index: number) => {
    setBxEditingItem({ ...record, _index: index, isNew: false });
    // 拆分 sdlcz 为 sdlczKm 和 sdlczM
    let sdlczKm, sdlczM;
    if (record.sdlcz !== undefined && record.sdlcz !== null) {
      sdlczKm = Math.floor(record.sdlcz / 1000);
      sdlczM = record.sdlcz % 1000;
    }
    bxForm.setFieldsValue({ ...record, sdlczKm, sdlczM });
    setBxVisible(true);
  };

  const handleBxDelete = async (index: number) => {
    const newList = [...bxList];
    newList.splice(index, 1);
    onBxListChange(newList);
    if (onRemoteSave) await onRemoteSave({ tspBxdataDTOList: newList });
  };

  const handleBxOk = async () => {
    try {
      const values = await bxForm.validate();
      // 合并 sdlczKm 和 sdlczM 为 sdlcz
      const sdlcz = (values.sdlczKm || 0) * 1000 + (values.sdlczM || 0);
      const submitValues = { ...values, sdlcz };
      delete submitValues.sdlczKm;
      delete submitValues.sdlczM;
      
      const newList = [...bxList];
      if (bxEditingItem.isNew) {
        newList.push(submitValues);
      } else {
        newList[bxEditingItem._index] = { ...newList[bxEditingItem._index], ...submitValues };
      }
      onBxListChange(newList);
      setBxVisible(false);
      if (onRemoteSave) await onRemoteSave({ tspBxdataDTOList: newList });
    } catch (e) { console.error(e); }
  };

  return (
    <div style={{ padding: 10 }}>
      {/* 炮点参数表格 */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', fontWeight: 'bold', textAlign: 'center' }}>
          炮点参数
        </div>
        <Space style={{ marginBottom: 10 }}>
           <Button type="primary" status="success" icon={<IconDownload />}>下载</Button>
           <Button type="primary" icon={<IconPlus />} onClick={handlePdAdd}>新增</Button>
           <Button type="primary" status="warning" icon={<IconImport />}>导入</Button>
        </Space>
        <Table 
          columns={pdColumns} 
          data={pdList} 
          pagination={{ pageSize: 5 }}
          rowKey={(r) => r.tspPddataPk || Math.random()}
          borderCell
        />
      </div>

      {/* 围岩参数表格 */}
      <div>
        <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', fontWeight: 'bold', textAlign: 'center' }}>
          围岩岩体物理学参数表
        </div>
        <Space style={{ marginBottom: 10 }}>
           <Button type="primary" status="success" icon={<IconDownload />}>下载</Button>
           <Button type="primary" icon={<IconPlus />} onClick={handleBxAdd}>新增</Button>
           <Button type="primary" status="warning" icon={<IconImport />}>导入</Button>
        </Space>
        <Table 
          columns={bxColumns} 
          data={bxList} 
          pagination={{ pageSize: 5 }}
          rowKey={(r) => r.tspBxdataPk || Math.random()}
          borderCell
        />
      </div>

      {/* 炮点弹窗 */}
      <Modal
        title={pdEditingItem?.isNew ? '新增炮点参数' : '编辑炮点参数'}
        visible={pdVisible}
        onOk={handlePdOk}
        onCancel={() => setPdVisible(false)}
      >
        <Form form={pdForm} layout="vertical">
           <FormItem 
             label="距离(m)" 
             field="pdjl" 
             rules={[{ type: 'number', required: true }]}
             extra="炮点到接收器的距离，保留1位小数，不可超过两位整数"
           >
             <InputNumber precision={1} max={99.9} min={0} style={{ width: '100%' }} />
           </FormItem>
           <FormItem 
             label="深度(m)" 
             field="pdsd" 
             rules={[{ type: 'number', required: true }]}
             extra="保留1位小数，不可超过两位整数"
           >
             <InputNumber precision={1} max={99.9} min={0} style={{ width: '100%' }} />
           </FormItem>
           <FormItem 
             label="高度(m)" 
             field="height" 
             rules={[{ type: 'number', required: true }]}
             extra="保留1位小数，不可超过两位整数"
           >
             <InputNumber precision={1} max={99.9} min={0} style={{ width: '100%' }} />
           </FormItem>
           <FormItem 
             label="倾角(°)" 
             field="qj" 
             rules={[{ type: 'number', required: true }]}
             extra="沿轴径向，向下为正，向上为负，保留1位小数，不可超过3位整数"
           >
             <InputNumber precision={1} max={999.9} min={-999.9} style={{ width: '100%' }} />
           </FormItem>
           <FormItem 
             label="方位角(°)" 
             field="fwj" 
             rules={[{ type: 'number', required: true }]}
             extra="孔洞方向的方位角，保留1位小数，不可超过3位整数"
           >
             <InputNumber precision={1} max={999.9} min={0} style={{ width: '100%' }} />
           </FormItem>
           <FormItem 
             label="药量(g)" 
             field="yl" 
             rules={[{ type: 'number', required: true }]}
             extra="不可超过5位数"
           >
             <InputNumber precision={0} max={99999} min={0} style={{ width: '100%' }} />
           </FormItem>
        </Form>
      </Modal>

      {/* 围岩弹窗 */}
      <Modal
        title={bxEditingItem?.isNew ? '新增围岩参数' : '编辑围岩参数'}
        visible={bxVisible}
        onOk={handleBxOk}
        onCancel={() => setBxVisible(false)}
      >
        <Form form={bxForm} layout="vertical">
           <FormItem label="地震波序号" field="jbxh">
             <Input />
           </FormItem>
           <FormItem label="检测器" field="jbq">
             <Input />
           </FormItem>
           <FormItem 
             label="波型" 
             field="bx"
             rules={[{ required: true, message: '请选择波型' }]}
           >
             <Select 
               options={BX_OPTIONS} 
               placeholder="请选择波型"
               showSearch
               style={{ width: '100%' }}
             />
           </FormItem>
           <FormItem 
             label="断面里程值" 
             extra="掌子面里程值为DK69+12，第一个框填写69，第二个框填写12"
           >
             <Space>
               <span>DK</span>
               <FormItem field="sdlczKm" noStyle rules={[{ type: 'number' }]}>
                 <InputNumber placeholder="69" style={{ width: 80 }} precision={0} min={0} />
               </FormItem>
               <span>+</span>
               <FormItem field="sdlczM" noStyle rules={[{ type: 'number' }]}>
                 <InputNumber placeholder="12" style={{ width: 80 }} precision={0} min={0} max={999} />
               </FormItem>
             </Space>
           </FormItem>
           <FormItem 
             label="速度(m/s)" 
             field="bs" 
             rules={[{ type: 'number' }]}
           >
             <InputNumber style={{ width: '100%' }} />
           </FormItem>
           <FormItem 
             label="Vp/Vs" 
             field="vps" 
             rules={[{ type: 'number' }]}
             extra="保留3位小数"
           >
             <InputNumber precision={3} style={{ width: '100%' }} />
           </FormItem>
           <FormItem 
             label="泊松比" 
             field="bsb" 
             rules={[{ type: 'number' }]}
             extra="保留2位小数"
           >
             <InputNumber precision={2} style={{ width: '100%' }} />
           </FormItem>
           <FormItem 
             label="密度(g/cm³)" 
             field="md" 
             rules={[{ type: 'number' }]}
             extra="保留2位小数"
           >
             <InputNumber precision={2} style={{ width: '100%' }} />
           </FormItem>
        </Form>
      </Modal>
    </div>
  );
};

export default TspParamsTab;

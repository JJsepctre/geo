import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  Popconfirm, 
  Message
} from '@arco-design/web-react';
import { IconPlus, IconEdit, IconDelete } from '@arco-design/web-react/icon';
import dayjs from 'dayjs';
import SegmentModal, { SegmentData, WYLEVEL_OPTIONS, DZJB_OPTIONS } from '../../components/SegmentModal';

// 地质等级映射 (I-VI)
const GRADE_OPTIONS = [
  { label: 'I', value: 1 },
  { label: 'II', value: 2 },
  { label: 'III', value: 3 },
  { label: 'IV', value: 4 },
  { label: 'V', value: 5 },
  { label: 'VI', value: 6 },
];

interface TspSegmentsTabProps {
  form: any; // 父组件的 form 实例
  ybjgList: any[]; // 分段列表数据
  onListChange: (list: any[]) => void; // 更新列表的回调
  onRemoteSave?: (partialData: any) => Promise<void>; // 远程保存回调
}

const TspSegmentsTab: React.FC<TspSegmentsTabProps> = ({ form, ybjgList = [], onListChange, onRemoteSave }) => {
  const [visible, setVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<SegmentData | null>(null);
  const [editingIndex, setEditingIndex] = useState<number>(-1);
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
      render: (val: number, record: any) => {
        if (record.sdkiloEnd !== undefined) {
          return `${val}+${record.sdkiloEnd}`;
        }
        return val;
      }
    },
    {
      title: '结束里程值',
      dataIndex: 'edkilo',
      render: (val: number, record: any) => {
        if (record.edkiloEnd !== undefined) {
          return `${val}+${record.edkiloEnd}`;
        }
        return val;
      }
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
      dataIndex: 'dzjb',
      render: (val: string) => {
        const opt = DZJB_OPTIONS.find(o => o.value === val);
        if (opt) {
          return <span style={{ color: opt.color === 'gold' ? '#faad14' : opt.color }}>{opt.label}</span>;
        }
        return val || '-';
      }
    },
    {
      title: '围岩等级',
      dataIndex: 'wylevel',
      render: (val: number) => WYLEVEL_OPTIONS.find(opt => opt.value === val)?.label || val,
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
    setEditingItem(null);
    setEditingIndex(-1);
    setVisible(true);
  };

  const handleEdit = (record: any, index: number) => {
    setEditingItem(record);
    setEditingIndex(index);
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

  const handleModalOk = async (data: SegmentData) => {
    let newList = [...localList];
    
    if (editingIndex >= 0) {
      // 编辑
      newList[editingIndex] = { ...newList[editingIndex], ...data };
    } else {
      // 新增
      newList.push(data);
    }

    setLocalList(newList);
    onListChange(newList);
    setVisible(false);
    
    if (onRemoteSave) {
      await onRemoteSave({ ybjgDTOList: newList });
    }
    
    Message.success(editingIndex >= 0 ? '修改成功' : '添加成功');
  };

  const handleModalCancel = () => {
    setVisible(false);
    setEditingItem(null);
    setEditingIndex(-1);
  };

  // 获取默认里程冠号
  const defaultDkname = form?.getFieldValue('dkname') || 'DK';

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
        rowKey={(record) => record.ybjgPk || record._tempId || Math.random()}
        borderCell
      />

      {/* 复用 SegmentModal 组件 */}
      <SegmentModal
        visible={visible}
        onCancel={handleModalCancel}
        onOk={handleModalOk}
        editingData={editingItem}
        defaultDkname={defaultDkname}
      />
    </div>
  );
};

export default TspSegmentsTab;

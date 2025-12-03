import React, { useState, useEffect } from 'react'
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
  Empty
} from '@arco-design/web-react'
import { IconLeft, IconSave } from '@arco-design/web-react/icon'
import apiAdapter from '../services/apiAdapter'
import TspSegmentsTab from './tabs/TspSegmentsTab'
import TspSystemTab from './tabs/TspSystemTab'
import TspParamsTab from './tabs/TspParamsTab'

const { TextArea } = Input
const TabPane = Tabs.TabPane

// 预报方法映射
const METHOD_MAP: Record<number, string> = {
  1: '地震波反射',
  2: '水平声波剖面',
  3: '陆地声呐',
  4: '电磁波反射',
  5: '高分辨直流电',
  6: '瞬变电磁',
  7: '掌子面素描',
  8: '洞身素描',
  12: '地表补充',
  13: '超前水平钻',
  14: '加深炮孔',
}

function GeologyForecastEditPage() {
  const navigate = useNavigate()
  const { type, id } = useParams<{ type: string; id: string }>()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const methodParam = searchParams.get('method')
  
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [record, setRecord] = useState<any>(null)
  const [ybjgList, setYbjgList] = useState<any[]>([])
  const [tspPdList, setTspPdList] = useState<any[]>([])
  const [tspBxList, setTspBxList] = useState<any[]>([])

  // 初始化数据
  useEffect(() => {
    const initData = async () => {
      if (!id || !type) return;
      
      setLoading(true);
      try {
        let data = null;
        
        // 尝试从路由状态获取（作为缓存/降级）
        if (location.state?.record) {
          data = location.state.record;
        }

        // 如果是 TSP (物探法 & method=1)，优先调用详情接口
        if (type === 'geophysical' && String(methodParam) === '1') {
          try {
            const detail = await apiAdapter.getTspDetail(id);
            console.log('📥 [编辑页面] TSP详情数据:', detail);
            if (detail) {
              console.log('🔑 [调试] TSP详情数据Keys:', Object.keys(detail));
              // 检查列表字段
              if (detail.tspPddataDTOList) console.log('📦 发现 tspPddataDTOList, 长度:', detail.tspPddataDTOList.length);
              if (detail.tspPddataVOList) console.log('📦 发现 tspPddataVOList, 长度:', detail.tspPddataVOList.length);
              data = detail;
            }
          } catch (e) {
            console.error('获取TSP详情失败，使用列表数据降级', e);
          }
        }
        
        // 如果是掌子面素描，调用详情接口
        if (type === 'palmSketch') {
           try {
             const detail = await apiAdapter.getPalmSketchDetail(id);
             console.log('📥 [编辑页面] 掌子面素描详情数据:', detail);
             if (detail) {
               data = detail;
             } else {
               console.error('❌ [编辑页面] 掌子面素描详情API返回null');
               Message.error('未找到掌子面素描数据');
               data = null;
             }
           } catch (e) {
             console.error('❌ [编辑页面] 获取掌子面素描详情失败:', e);
             Message.error('获取详情失败：' + (e instanceof Error ? e.message : '未知错误'));
             data = null;
           }
        }
        
        // 如果是洞身素描，调用详情接口
        if (type === 'tunnelSketch') {
           try {
             const detail = await apiAdapter.getTunnelSketchDetail(id);
             if (detail) {
               data = detail;
             }
           } catch (e) {
             console.error('获取洞身素描详情失败', e);
           }
        }

        if (data) {
          setRecord(data);
          // 初始化子列表数据
          if (data.ybjgVOList) {
            setYbjgList(data.ybjgVOList);
          } else if (data.ybjgDTOList) {
            setYbjgList(data.ybjgDTOList);
          }

          // 初始化 TSP 特有列表
          if (data.tspPddataDTOList) {
            setTspPdList(data.tspPddataDTOList);
          } else if (data.tspPddataVOList) {
            setTspPdList(data.tspPddataVOList);
          } else if (data.tspPddataList) {
            setTspPdList(data.tspPddataList);
          }
          
          if (data.tspBxdataDTOList) {
            setTspBxList(data.tspBxdataDTOList);
          } else if (data.tspBxdataVOList) {
            setTspBxList(data.tspBxdataVOList);
          } else if (data.tspBxdataList) {
            setTspBxList(data.tspBxdataList);
          }
          
          // 格式化日期
          const formattedDate = data.monitordate 
            ? new Date(data.monitordate).toISOString().replace('T', ' ').split('.')[0] 
            : undefined;
          
          const formData = {
            ...data,
            monitordate: formattedDate
          };
          
          console.log('📝 [编辑页面] 准备填充到表单的数据:', formData);
          console.log('📝 [编辑页面] 表单数据的所有键:', Object.keys(formData));
          
          form.setFieldsValue(formData);
          
          console.log('✅ [编辑页面] 表单数据已填充');
          console.log('🔍 [编辑页面] 当前表单值:', form.getFieldsValue());
        } else {
          console.error('❌ [编辑页面] 无数据可显示');
          // 数据为null，表单保持空白
        }
      } catch (error) {
        console.error('初始化数据失败:', error);
        Message.error('初始化数据失败');
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [id, type, methodParam, location.state]);

  const handleSave = async () => {
    try {
      const values = await form.validate();
      console.log('💾 URL参数 - type:', type, 'id:', id, 'method:', methodParam);
      
      if (!id || !type) {
        Message.warning('缺少必要参数');
        return;
      }

      setLoading(true);
      console.log('💾 保存数据 - 原始values:', values);
      console.log('💾 保存数据 - 原始record:', record);
      
      // 合并原始数据和表单数据，确保必填字段存在
      const submitData = {
        ...record,  // 保留原始数据中的所有字段
        ...values,  // 用表单数据覆盖
        ybjgDTOList: ybjgList, // 包含分段列表数据
        tspPddataDTOList: tspPdList, // 炮点数据
        tspBxdataDTOList: tspBxList, // 围岩数据
      };
      
      // 确保必填字段存在（如果record中没有，尝试从其他来源获取）
      if (!submitData.siteId) {
        // 尝试从URL或其他地方获取siteId
        const urlParams = new URLSearchParams(window.location.search);
        const siteIdFromUrl = urlParams.get('siteId');
        if (siteIdFromUrl) {
          submitData.siteId = siteIdFromUrl;
        } else {
          console.warn('⚠️ 缺少siteId字段，可能导致保存失败');
        }
      }
      
      console.log('💾 保存数据 - 合并后:', submitData);
      
      // 确定实际的记录ID（不同类型使用不同的主键）
      let actualId = id;
      if (type === 'geophysical' && submitData.ybPk) {
        // 物探法使用ybPk作为更新ID
        actualId = String(submitData.ybPk);
      } else if (type === 'palmSketch' && submitData.zzmsmPk) {
        actualId = String(submitData.zzmsmPk);
      } else if (type === 'tunnelSketch' && submitData.dssmPk) {
        actualId = String(submitData.dssmPk);
      } else if (type === 'drilling' && submitData.ztfPk) {
        actualId = String(submitData.ztfPk);
      }
      
      console.log('💾 使用的实际ID:', actualId);
      let result = null;

      switch (type) {
        case 'geophysical':
          // 物探法需要传递method参数以区分具体类型（TSP、HSP等）
          result = await apiAdapter.updateGeophysical(actualId, submitData, methodParam);
          break;
        case 'palmSketch':
          result = await apiAdapter.updatePalmSketch(id, values);
          break;
        case 'tunnelSketch':
          result = await apiAdapter.updateTunnelSketch(id, values);
          break;
        case 'drilling':
          result = await apiAdapter.updateDrilling(id, values);
          break;
        default:
          Message.error('不支持的类型');
          setLoading(false);
          return;
      }

      console.log('💾 保存结果:', result);
      if (result?.success) {
        Message.success('保存成功');
        navigate(-1); // 返回上一页
      } else {
        Message.error(result?.message || '保存失败，请检查数据格式');
      }
    } catch (error: any) {
      console.error('❌ 保存失败:', error);
      if (error?.message) {
        Message.error(`保存失败: ${error.message}`);
      } else {
        Message.error('表单验证失败，请检查必填项');
      }
    } finally {
      setLoading(false);
    }
  };

  // 处理局部保存（用于子列表即时更新）
  const handlePartialSave = async (partialData: any) => {
    if (!id || !type) return;
    
    try {
      // setLoading(true); // 局部保存可以不全屏loading，或者用轻量提示
      const values = form.getFieldsValue();
      
      // 合并数据 - 保留所有现有列表数据，只更新 partialData 中指定的部分
      const submitData = {
        ...record,
        ...values,
        // 关键修复：如果 partialData 中有列表，使用它；否则使用当前状态（而不是 record）
        ybjgDTOList: partialData.ybjgDTOList !== undefined ? partialData.ybjgDTOList : ybjgList,
        tspPddataDTOList: partialData.tspPddataDTOList !== undefined ? partialData.tspPddataDTOList : tspPdList,
        tspBxdataDTOList: partialData.tspBxdataDTOList !== undefined ? partialData.tspBxdataDTOList : tspBxList,
        ...partialData // 覆盖其他字段
      };
      
      // 同步更新本地状态
      if (partialData.tspPddataDTOList) {
        setTspPdList(partialData.tspPddataDTOList);
      }
      if (partialData.tspBxdataDTOList) {
        setTspBxList(partialData.tspBxdataDTOList);
      }
      if (partialData.ybjgDTOList) {
        setYbjgList(partialData.ybjgDTOList);
      }
      
      // 确定实际的记录ID（不同类型使用不同的主键）
      let actualId = id;
      if (type === 'geophysical' && submitData.ybPk) {
        actualId = String(submitData.ybPk);
      } else if (type === 'palmSketch' && submitData.zzmsmPk) {
        actualId = String(submitData.zzmsmPk);
      } else if (type === 'tunnelSketch' && submitData.dssmPk) {
        actualId = String(submitData.dssmPk);
      } else if (type === 'drilling' && submitData.ztfPk) {
        actualId = String(submitData.ztfPk);
      }
      
      console.log('💾 [局部保存] type:', type);
      console.log('💾 [局部保存] partialData:', partialData);
      console.log('💾 [局部保存] submitData 列表长度:', {
        ybjgDTOList: submitData.ybjgDTOList?.length,
        tspPddataDTOList: submitData.tspPddataDTOList?.length,
        tspBxdataDTOList: submitData.tspBxdataDTOList?.length
      });
      
      let result = null;
      switch (type) {
        case 'geophysical':
          result = await apiAdapter.updateGeophysical(actualId, submitData, methodParam);
          break;
        case 'palmSketch':
          result = await apiAdapter.updatePalmSketch(actualId, submitData);
          break;
        case 'tunnelSketch':
          result = await apiAdapter.updateTunnelSketch(actualId, submitData);
          break;
        case 'drilling':
          result = await apiAdapter.updateDrilling(actualId, submitData);
          break;
        default:
          Message.error('不支持的类型');
          return;
      }
      
      if (result?.success) {
        Message.success('更新已保存');
        setRecord(submitData); // 更新本地记录
      } else {
        Message.error(result?.message || '更新失败');
      }
    } catch (error: any) {
       console.error('局部保存失败:', error);
       Message.error('更新失败: ' + error.message);
    }
  };

  // 根据预报方法获取专用标签页标题
  const getMethodSpecificTabTitle = (method: string | null) => {
    switch(method) {
      case '1': return 'TSP观测系统及设备信息';
      case '2': return 'HSP观测系统及设备信息';
      case '3': return 'LDSN观测系统及设备信息';
      case '4': return 'DCBFS观测系统及设备信息';
      case '5': return 'GFBZLD观测系统及设备信息';
      case '6': return 'SBDC观测系统及设备信息';
      case '7': return 'WZJC观测系统及设备信息';
      default: return '观测系统及设备信息';
    }
  };

  // 根据预报方法渲染专用内容
  const renderMethodSpecificContent = (method: string | null) => {
    switch(method) {
      case '1': // TSP 地震波反射
        return <TspSystemTab />;
      case '2': // HSP 水平声波剖面
      case '3': // LDSN 陆地声呐
      case '4': // DCBFS 电磁波反射
      case '5': // GFBZLD 高分辨直流电
      case '6': // SBDC 瞬变电磁
      case '7': // WZJC 微震监测
        return (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <Empty description={`${METHOD_MAP[Number(method)] || '该方法'}的专用界面正在开发中`} />
          </div>
        );
      default:
        return (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <Empty description="请选择具体的预报方法" />
          </div>
        );
    }
  };

  // 根据类型和方法渲染不同的表单内容
  const renderFormContent = () => {
    console.log('🎯 [编辑页面] 渲染条件检查:', {
      type,
      methodParam,
      typeCheck: type === 'geophysical',
      shouldShowTabs: type === 'geophysical',
      methodName: METHOD_MAP[Number(methodParam)] || '未知方法'
    });
    
    // 掌子面素描的复杂表单
    if (type === 'palmSketch') {
      return (
        <Tabs type="line">
          <TabPane key="basic" title="基本信息">
             <div style={{ padding: '20px' }}>
               <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', fontWeight: 'bold' }}>基本信息</div>
               <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="预报时间" field="monitordate">
                       <DatePicker showTime style={{ width: '100%' }} />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="里程" field="dkname">
                       <Input placeholder="例如: DK" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="里程位置" field="dkilo">
                       <InputNumber style={{ width: '100%' }} placeholder="里程数值" />
                    </Form.Item>
                  </Grid.Col>
               </Grid.Row>
               <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="监测人" field="monitorname">
                       <Input placeholder="监测人" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="监测人编号" field="monitorno">
                       <Input placeholder="监测人编号" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="监测人电话" field="monitortel">
                       <Input placeholder="监测人电话" />
                    </Form.Item>
                  </Grid.Col>
               </Grid.Row>
               <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="检测人" field="testname">
                       <Input placeholder="检测人" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="检测人编号" field="testno">
                       <Input placeholder="检测人编号" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="检测人电话" field="testtel">
                       <Input placeholder="检测人电话" />
                    </Form.Item>
                  </Grid.Col>
               </Grid.Row>
               <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="监理人" field="supervisorname">
                       <Input placeholder="监理人" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="监理人编号" field="supervisorno">
                       <Input placeholder="监理人编号" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="监理人电话" field="supervisortel">
                       <Input placeholder="监理人电话" />
                    </Form.Item>
                  </Grid.Col>
               </Grid.Row>
               <Grid.Row gutter={24}>
                  <Grid.Col span={12}>
                    <Form.Item label="预报方式" field="method">
                       <Input placeholder="预报方式" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Form.Item label="掌子面状态" field="zzmzt">
                       <Input placeholder="掌子面状态" />
                    </Form.Item>
                  </Grid.Col>
               </Grid.Row>
               
               <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', marginTop: '20px', fontWeight: 'bold' }}>预报结论及位置</div>
               <Grid.Row gutter={24}>
                  <Grid.Col span={24}>
                    <Form.Item label="预报结论内容" field="conclusionyb">
                       <TextArea rows={4} placeholder="请输入预报结论内容" maxLength={500} showWordLimit />
                    </Form.Item>
                  </Grid.Col>
               </Grid.Row>
               
               <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', marginTop: '20px', fontWeight: 'bold' }}>掌子面素描图</div>
               <Grid.Row gutter={24}>
                  <Grid.Col span={24}>
                    <Form.Item label="掌子面素描图" field="zzmsmpic">
                       <Input placeholder="掌子面素描图文件路径或上传" />
                    </Form.Item>
                  </Grid.Col>
               </Grid.Row>
               
               <Grid.Row gutter={24}>
                  <Grid.Col span={8}>
                    <Form.Item label="围岩基本分级" field="basicwylevel">
                       <InputNumber style={{ width: '100%' }} min={1} max={6} placeholder="I-VI级" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="修正级别" field="fixwylevel">
                       <InputNumber style={{ width: '100%' }} min={1} max={6} placeholder="修正后级别" />
                    </Form.Item>
                  </Grid.Col>
                  <Grid.Col span={8}>
                    <Form.Item label="预报长度" field="ybLength">
                       <InputNumber style={{ width: '100%' }} placeholder="预报长度(m)" />
                    </Form.Item>
                  </Grid.Col>
               </Grid.Row>
               <Grid.Row gutter={24}>
                  <Grid.Col span={24}>
                    <Form.Item label="距洞口距离" field="jdkjl">
                       <InputNumber style={{ width: '100%' }} placeholder="距洞口距离(m)" />
                    </Form.Item>
                  </Grid.Col>
               </Grid.Row>
               
               <Grid.Row gutter={24}>
                  <Grid.Col span={24}>
                    <Form.Item label="处理措施" field="suggestion">
                       <TextArea rows={4} placeholder="请输入处理措施" maxLength={256} showWordLimit />
                    </Form.Item>
                  </Grid.Col>
               </Grid.Row>
             </div>
          </TabPane>
          <TabPane key="face_info" title="其他信息及基土体数据信息">
             <div style={{ padding: '20px' }}>
               <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '20px', fontWeight: 'bold' }}>掌子面信息</div>
               <Grid.Row gutter={24}>
                 <Grid.Col span={8}>
                   <Form.Item label="距洞口距离(m)" field="jdkjl">
                     <InputNumber style={{ width: '100%' }} placeholder="距洞口距离" />
                   </Form.Item>
                 </Grid.Col>
                 <Grid.Col span={8}>
                   <Form.Item label="开挖宽度(m)" field="kwkd">
                     <InputNumber style={{ width: '100%' }} placeholder="开挖宽度" />
                   </Form.Item>
                 </Grid.Col>
                 <Grid.Col span={8}>
                   <Form.Item label="开挖高度(m)" field="kwgd">
                     <InputNumber style={{ width: '100%' }} placeholder="开挖高度" />
                   </Form.Item>
                 </Grid.Col>
               </Grid.Row>
               <Grid.Row gutter={24}>
                 <Grid.Col span={8}>
                   <Form.Item label="开挖面积(m²)" field="kwmj">
                     <InputNumber style={{ width: '100%' }} placeholder="开挖面积" />
                   </Form.Item>
                 </Grid.Col>
                 <Grid.Col span={8}>
                   <Form.Item label="掌子面状态" field="zzmzt">
                     <Input placeholder="掌子面状态描述" />
                   </Form.Item>
                 </Grid.Col>
                 <Grid.Col span={8}>
                   <Form.Item label="开挖方式补充" field="kwfs2">
                     <Input placeholder="例如：全断面法" />
                   </Form.Item>
                 </Grid.Col>
               </Grid.Row>
               
               <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '20px', marginTop: '20px', fontWeight: 'bold' }}>围岩等级</div>
               <Grid.Row gutter={24}>
                 <Grid.Col span={12}>
                   <Form.Item label="围岩基本分级(I-VI)" field="basicwylevel">
                     <InputNumber style={{ width: '100%' }} min={1} max={6} placeholder="1-6" />
                   </Form.Item>
                 </Grid.Col>
                 <Grid.Col span={12}>
                   <Form.Item label="修正后围岩级别" field="fixwylevel">
                     <InputNumber style={{ width: '100%' }} min={1} max={6} placeholder="1-6" />
                   </Form.Item>
                 </Grid.Col>
               </Grid.Row>
               <Grid.Row gutter={24}>
                 <Grid.Col span={12}>
                   <Form.Item label="渗水量(L/(min·10m))" field="shenshuiliang">
                     <InputNumber style={{ width: '100%' }} placeholder="渗水量" />
                   </Form.Item>
                 </Grid.Col>
                 <Grid.Col span={12}>
                   <Form.Item label="地下水评定" field="dxspd">
                     <Select placeholder="请选择">
                       <Select.Option value={1}>潮湿</Select.Option>
                       <Select.Option value={2}>淋雨</Select.Option>
                       <Select.Option value={3}>涌流</Select.Option>
                     </Select>
                   </Form.Item>
                 </Grid.Col>
               </Grid.Row>
             </div>
          </TabPane>
          <TabPane key="rock_soil" title="掌子面数据">
             <div style={{ padding: '20px' }}>
               <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '20px', fontWeight: 'bold' }}>掌子面围岩信息</div>
               
               <Grid.Row gutter={24}>
                 <Grid.Col span={8}>
                   <Form.Item label="围岩基本分级" field="basicwylevel">
                     <Select placeholder="请选择">
                       <Select.Option value={1}>Ⅰ</Select.Option>
                       <Select.Option value={2}>Ⅱ</Select.Option>
                       <Select.Option value={3}>Ⅲ</Select.Option>
                       <Select.Option value={4}>Ⅳ</Select.Option>
                       <Select.Option value={5}>Ⅴ</Select.Option>
                       <Select.Option value={6}>Ⅵ</Select.Option>
                     </Select>
                   </Form.Item>
                 </Grid.Col>
                 <Grid.Col span={8}>
                   <Form.Item label="渗水量" field="shenshuiliang">
                     <InputNumber style={{ width: '100%' }} placeholder="渗水量" />
                   </Form.Item>
                 </Grid.Col>
                 <Grid.Col span={8}>
                   <Form.Item label="地下水评定" field="dxspd">
                     <Select placeholder="请选择">
                       <Select.Option value={1}>潮湿</Select.Option>
                       <Select.Option value={2}>点滴状出水</Select.Option>
                       <Select.Option value={3}>淋雨</Select.Option>
                       <Select.Option value={4}>涌流</Select.Option>
                     </Select>
                   </Form.Item>
                 </Grid.Col>
               </Grid.Row>
               
               <Grid.Row gutter={24}>
                 <Grid.Col span={8}>
                   <Form.Item label="埋深H" field="maishenH">
                     <InputNumber style={{ width: '100%' }} placeholder="埋深H" />
                   </Form.Item>
                 </Grid.Col>
                 <Grid.Col span={8}>
                   <Form.Item label="评估基准" field="pinggujijun">
                     <Input placeholder="评估基准" />
                   </Form.Item>
                 </Grid.Col>
                 <Grid.Col span={8}>
                   <Form.Item label="修正后围岩级别" field="fixwylevel">
                     <Select placeholder="请选择">
                       <Select.Option value={1}>Ⅰ</Select.Option>
                       <Select.Option value={2}>Ⅱ</Select.Option>
                       <Select.Option value={3}>Ⅲ</Select.Option>
                       <Select.Option value={4}>Ⅳ</Select.Option>
                       <Select.Option value={5}>Ⅴ</Select.Option>
                       <Select.Option value={6}>Ⅵ</Select.Option>
                     </Select>
                   </Form.Item>
                 </Grid.Col>
               </Grid.Row>
               
               <Grid.Row gutter={24}>
                 <Grid.Col span={8}>
                   <Form.Item label="初始地应力评定" field="csdylpd">
                     <Select placeholder="请选择">
                       <Select.Option value="一般地应力">一般地应力</Select.Option>
                       <Select.Option value="较高地应力">较高地应力</Select.Option>
                       <Select.Option value="高地应力">高地应力</Select.Option>
                     </Select>
                   </Form.Item>
                 </Grid.Col>
                 <Grid.Col span={8}>
                   <Form.Item label="地质构造应力状态" field="dzgzylzt">
                     <Input placeholder="地质构造应力状态" />
                   </Form.Item>
                 </Grid.Col>
                 <Grid.Col span={8}>
                   <Form.Item label="初始地应力其他描述" field="csdylqtms">
                     <Input placeholder="初始地应力其他描述" />
                   </Form.Item>
                 </Grid.Col>
               </Grid.Row>
               
               <Grid.Row gutter={24}>
                 <Grid.Col span={24}>
                   <Form.Item label="掌子面简要描述" field="zzmjyms">
                     <TextArea 
                       rows={6} 
                       placeholder="请输入掌子面简要描述..." 
                       maxLength={2000} 
                       showWordLimit 
                     />
                   </Form.Item>
                 </Grid.Col>
               </Grid.Row>
             </div>
          </TabPane>
          <TabPane key="segments" title="分段信息及灾下大趋向">
             <TspSegmentsTab 
                form={form} 
                ybjgList={ybjgList} 
                onListChange={setYbjgList} 
                onRemoteSave={handlePartialSave}
             />
          </TabPane>
          <TabPane key="attachments" title="附件及成果上传">
             <div style={{ padding: '20px' }}>
               <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '20px', fontWeight: 'bold' }}>预报成果图片</div>
               <Grid.Row gutter={24}>
                 <Grid.Col span={12}>
                   <Form.Item label="掌子面素描图" field="zzmsmpic">
                     <Input placeholder="掌子面素描图文件路径" />
                   </Form.Item>
                 </Grid.Col>
                 <Grid.Col span={12}>
                   <Form.Item label="其他图片" field="images">
                     <Input placeholder="其他图片文件路径" />
                   </Form.Item>
                 </Grid.Col>
               </Grid.Row>
               <Grid.Row gutter={24}>
                 <Grid.Col span={24}>
                   <Form.Item label="附件" field="addition">
                     <Input placeholder="附件文件路径" />
                   </Form.Item>
                 </Grid.Col>
               </Grid.Row>
             </div>
          </TabPane>
        </Tabs>
      );
    }
    
    // 物探法的复杂表单（包含所有物探方法：地震波反射、水平声波剖面、陆地声呐等）
    if (type === 'geophysical') {
      return (
        <Tabs type="line">
          <TabPane key="basic" title="基本信息及其他信息">
             <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', fontWeight: 'bold' }}>基本信息</div>
             <Grid.Row gutter={24}>
                <Grid.Col span={8}>
                  <Form.Item label="预报方法" field="method" disabled>
                     <Select placeholder="请选择">
                        {Object.entries(METHOD_MAP).map(([k, v]) => <Select.Option key={k} value={Number(k)}>{v}</Select.Option>)}
                     </Select>
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="预报时间" field="monitordate">
                     <DatePicker showTime style={{ width: '100%' }} />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="工点编号" field="siteId" disabled>
                     <Input placeholder="工点编号" />
                  </Form.Item>
                </Grid.Col>
             </Grid.Row>
             <Grid.Row gutter={24}>
                <Grid.Col span={8}>
                  <Form.Item label="里程冠号" field="dkname">
                     <Input placeholder="例如: DK" />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="掌子面里程" field="dkilo">
                     <InputNumber style={{ width: '100%' }} placeholder="里程数值" />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="预报长度" field="ybLength">
                     <InputNumber style={{ width: '100%' }} placeholder="预报长度(m)" />
                  </Form.Item>
                </Grid.Col>
             </Grid.Row>
             
             <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', marginTop: '20px', fontWeight: 'bold' }}>人员信息</div>
             <Grid.Row gutter={24}>
                <Grid.Col span={8}>
                  <Form.Item label="检测人员" field="testname">
                     <Input placeholder="检测人员姓名" />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="检测人员编号" field="testno">
                     <Input placeholder="检测人员编号" />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="检测人员电话" field="testtel">
                     <Input placeholder="检测人员电话" />
                  </Form.Item>
                </Grid.Col>
             </Grid.Row>
             <Grid.Row gutter={24}>
                <Grid.Col span={8}>
                  <Form.Item label="监测人员" field="monitorname">
                     <Input placeholder="监测人员姓名" />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="监测人员编号" field="monitorno">
                     <Input placeholder="监测人员编号" />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="监测人员电话" field="monitortel">
                     <Input placeholder="监测人员电话" />
                  </Form.Item>
                </Grid.Col>
             </Grid.Row>
             <Grid.Row gutter={24}>
                <Grid.Col span={8}>
                  <Form.Item label="监理人员" field="supervisorname">
                     <Input placeholder="监理人员姓名" />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="监理人员编号" field="supervisorno">
                     <Input placeholder="监理人员编号" />
                  </Form.Item>
                </Grid.Col>
                <Grid.Col span={8}>
                  <Form.Item label="监理人员电话" field="supervisortel">
                     <Input placeholder="监理人员电话" />
                  </Form.Item>
                </Grid.Col>
             </Grid.Row>
             
             <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '10px', marginTop: '20px', fontWeight: 'bold' }}>预报结论</div>
             <Grid.Row gutter={24}>
                <Grid.Col span={24}>
                  <Form.Item label="预报结论" field="conclusionyb">
                     <TextArea rows={4} placeholder="请输入预报结论" />
                  </Form.Item>
                </Grid.Col>
             </Grid.Row>
             <Grid.Row gutter={24}>
                <Grid.Col span={24}>
                  <Form.Item label="处理建议" field="suggestion">
                     <TextArea rows={4} placeholder="请输入处理建议" />
                  </Form.Item>
                </Grid.Col>
             </Grid.Row>
             <Grid.Row gutter={24}>
                <Grid.Col span={24}>
                  <Form.Item label="解决方案" field="solution">
                     <TextArea rows={3} placeholder="请输入解决方案" />
                  </Form.Item>
                </Grid.Col>
             </Grid.Row>
             <Grid.Row gutter={24}>
                <Grid.Col span={24}>
                  <Form.Item label="备注" field="remark">
                     <TextArea rows={3} placeholder="请输入备注信息" />
                  </Form.Item>
                </Grid.Col>
             </Grid.Row>
          </TabPane>
          <TabPane key="segments" title="分段信息">
             <TspSegmentsTab 
                form={form} 
                ybjgList={ybjgList} 
                onListChange={setYbjgList} 
                onRemoteSave={handlePartialSave}
             />
          </TabPane>
          <TabPane key="method_info" title={getMethodSpecificTabTitle(methodParam)}>
             {renderMethodSpecificContent(methodParam)}
          </TabPane>
          <TabPane key="params" title="炮点参数及围岩参数">
             <TspParamsTab 
               pdList={tspPdList}
               onPdListChange={setTspPdList}
               bxList={tspBxList}
               onBxListChange={setTspBxList}
               onRemoteSave={handlePartialSave}
             />
          </TabPane>
          <TabPane key="attachments" title="附件及成果信息">
             <div style={{ padding: '20px' }}>
               <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '20px', fontWeight: 'bold' }}>预报成果图片</div>
               <Grid.Row gutter={24}>
                 <Grid.Col span={12}>
                   <Form.Item label="图片1" field="pic1">
                     <Input placeholder="图片1文件路径" />
                   </Form.Item>
                 </Grid.Col>
                 <Grid.Col span={12}>
                   <Form.Item label="图片2" field="pic2">
                     <Input placeholder="图片2文件路径" />
                   </Form.Item>
                 </Grid.Col>
               </Grid.Row>
               <Grid.Row gutter={24}>
                 <Grid.Col span={12}>
                   <Form.Item label="图片3" field="pic3">
                     <Input placeholder="图片3文件路径" />
                   </Form.Item>
                 </Grid.Col>
                 <Grid.Col span={12}>
                   <Form.Item label="图片4" field="pic4">
                     <Input placeholder="图片4文件路径" />
                   </Form.Item>
                 </Grid.Col>
               </Grid.Row>
               <Grid.Row gutter={24}>
                 <Grid.Col span={12}>
                   <Form.Item label="图片5" field="pic5">
                     <Input placeholder="图片5文件路径" />
                   </Form.Item>
                 </Grid.Col>
                 <Grid.Col span={12}>
                   <Form.Item label="图片6" field="pic6">
                     <Input placeholder="图片6文件路径" />
                   </Form.Item>
                 </Grid.Col>
               </Grid.Row>
             </div>
          </TabPane>
        </Tabs>
      );
    }

    // 默认简单表单
    return (
      <div style={{ padding: '20px', background: '#fff' }}>
        <Form.Item label="里程" field="dkilo" rules={[{ required: true, message: '请输入里程' }]}>
          <Input placeholder="如 DK713+521.20" />
        </Form.Item>
        <Form.Item label="监测日期" field="monitordate">
          <Input placeholder="监测日期" />
        </Form.Item>
        <Form.Item label="备注" field="addition">
          <Input placeholder="备注信息" />
        </Form.Item>
      </div>
    );
  };

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
        <span>{record ? `编辑 - ${METHOD_MAP[record.method] || '地质预报'}` : '编辑地质预报'}</span>
        <Button 
          type="text" 
          icon={<IconLeft style={{ fontSize: 18 }} />} 
          style={{ color: '#1D2129' }}
          onClick={() => navigate(-1)}
        >
          返回
        </Button>
      </div>

      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '0 0 4px 4px' }}>
        <Spin loading={loading} style={{ width: '100%', minHeight: '200px' }}>
          <Form form={form} layout="vertical">
            {renderFormContent()}
            
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <Space size="large">
                <Button onClick={() => navigate(-1)}>取消</Button>
                <Button type="primary" icon={<IconSave />} onClick={handleSave}>
                  保存
                </Button>
              </Space>
            </div>
          </Form>
        </Spin>
      </div>
    </div>
  )
}

export default GeologyForecastEditPage

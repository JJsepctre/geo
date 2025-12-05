import React from 'react';
import { Card, Tabs, Table, Space, Button, Spin, Empty } from '@arco-design/web-react';
import DetectionChart from '../../../components/DetectionChart';

const TabPane = Tabs.TabPane;

interface WorkPointDetailProps {
  workPointId: string;
  isLoadingDetection: boolean;
  detectionData: any;
  isLoadingForecast: boolean;
  geophysicalData: any[];
  palmSketchData: any[];
  tunnelSketchData: any[];
  drillingData: any[];
  onNavigate: (path: string) => void;
}

const WorkPointDetail: React.FC<WorkPointDetailProps> = ({
  workPointId,
  isLoadingDetection,
  detectionData,
  isLoadingForecast,
  geophysicalData,
  palmSketchData,
  tunnelSketchData,
  drillingData,
  onNavigate
}) => {
  return (
    <div style={{ padding: '20px' }}>
      {/* 探测信息图表 */}
      <Card 
        title={<span style={{ fontSize: '16px', fontWeight: 500 }}>探测信息</span>}
        style={{ marginBottom: '20px' }}
        bodyStyle={{ padding: '24px' }}
      >
        <Spin loading={isLoadingDetection && !detectionData}> 
          {detectionData ? (
            <DetectionChart data={detectionData} />
          ) : (
            <Empty description="暂无探测数据" style={{ padding: '60px 0' }} />
          )}
        </Spin>
      </Card>

      {/* 五种预报方法选项卡 */}
      <Card bodyStyle={{ padding: 0 }}>
        <Spin loading={isLoadingForecast && geophysicalData.length === 0}>
          <Tabs defaultActiveTab="geophysical" type="card-gutter">
            <TabPane key="geophysical" title={`物探法 (${geophysicalData.length})`}>
              <div style={{ padding: '24px' }}>
                {geophysicalData.length > 0 ? (
                  <Table
                    columns={[
                      { title: 'ID', dataIndex: 'wtfPk', width: 80 },
                      { title: '方法', dataIndex: 'methodName', width: 120, render: (text, record) => text || record.method },
                      { title: '里程', dataIndex: 'dkilo', width: 120, render: (val) => `DK${val}` },
                      { title: '长度(m)', dataIndex: 'wtfLength', width: 100 },
                      { title: '监测日期', dataIndex: 'monitordate', width: 120 },
                      { title: '备注', dataIndex: 'addition' }
                    ]}
                    data={geophysicalData}
                    pagination={false}
                    rowKey="wtfPk"
                  />
                ) : (
                  <Empty description="暂无物探法数据" />
                )}
              </div>
            </TabPane>
            <TabPane key="palm-sketch" title={`掌子面素描 (${palmSketchData.length})`}>
              <div style={{ padding: '24px' }}>
                {palmSketchData.length > 0 ? (
                  <Table
                    columns={[
                      { title: 'ID', dataIndex: 'zzmsmPk', width: 80 },
                      { title: '里程', dataIndex: 'dkilo', width: 120, render: (val) => `DK${val}` },
                      { title: '围岩等级', dataIndex: 'rockGrade', width: 100 },
                      { title: '涌水情况', dataIndex: 'waterInflow', width: 100 },
                      { title: '监测日期', dataIndex: 'monitordate', width: 120 },
                      { title: '备注', dataIndex: 'addition' }
                    ]}
                    data={palmSketchData}
                    pagination={false}
                    rowKey="zzmsmPk"
                  />
                ) : (
                  <Empty description="暂无掌子面素描数据" />
                )}
              </div>
            </TabPane>
            <TabPane key="tunnel-sketch" title={`洞身素描 (${tunnelSketchData.length})`}>
              <div style={{ padding: '24px' }}>
                {tunnelSketchData.length > 0 ? (
                  <Table
                    columns={[
                      { title: 'ID', dataIndex: 'dssmPk', width: 80 },
                      { title: '里程', dataIndex: 'dkilo', width: 120, render: (val) => `DK${val}` },
                      { title: '衬砌厚度(cm)', dataIndex: 'liningThickness', width: 120 },
                      { title: '裂缝数量', dataIndex: 'crackCount', width: 100 },
                      { title: '监测日期', dataIndex: 'monitordate', width: 120 },
                      { title: '备注', dataIndex: 'addition' }
                    ]}
                    data={tunnelSketchData}
                    pagination={false}
                    rowKey="dssmPk"
                  />
                ) : (
                  <Empty description="暂无洞身素描数据" />
                )}
              </div>
            </TabPane>
            <TabPane key="drilling" title={`钻探法 (${drillingData.length})`}>
              <div style={{ padding: '24px' }}>
                {drillingData.length > 0 ? (
                  <Table
                    columns={[
                      { title: 'ID', dataIndex: 'ztfPk', width: 80 },
                      { title: '里程', dataIndex: 'dkilo', width: 120, render: (val) => `DK${val}` },
                      { title: '钻探深度(m)', dataIndex: 'drillDepth', width: 120 },
                      { title: '取芯长度(m)', dataIndex: 'coreLength', width: 120 },
                      { title: '岩石类型', dataIndex: 'rockType', width: 100 },
                      { title: '监测日期', dataIndex: 'monitordate', width: 120 },
                      { title: '备注', dataIndex: 'addition' }
                    ]}
                    data={drillingData}
                    pagination={false}
                    rowKey="ztfPk"
                  />
                ) : (
                  <Empty description="暂无钻探法数据" />
                )}
              </div>
            </TabPane>
            <TabPane key="surface" title="地表补充">
              <div style={{ padding: '24px' }}>
                <Empty description="暂无地表补充数据" />
              </div>
            </TabPane>
          </Tabs>
        </Spin>
      </Card>

      {/* 三个导航按钮 */}
      <Card bodyStyle={{ padding: '24px' }} style={{ marginTop: '20px' }}>
        <Space size="large">
          <Button
            type="primary"
            size="large"
            onClick={() => onNavigate('/forecast/design')}
          >
            设计信息
          </Button>
          <Button
            type="primary"
            size="large"
            onClick={() => onNavigate(`/forecast/geology/${workPointId}`)}
          >
            地质预报
          </Button>
          <Button 
            type="primary"
            size="large"
            onClick={() => onNavigate('/forecast/comprehensive')}
          >
            综合结论
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default WorkPointDetail;


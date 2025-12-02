import React from 'react';
import { Form, Input, InputNumber, Select, Grid, Divider } from '@arco-design/web-react';

const FormItem = Form.Item;
const { Row, Col } = Grid;

interface TspSystemTabProps {
  // 预留 props
}

const TspSystemTab: React.FC<TspSystemTabProps> = () => {
  return (
    <div style={{ padding: 10 }}>
      {/* 1. 地震波反射观测系统情况 */}
      <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '20px', fontWeight: 'bold' }}>
        地震波反射观测系统情况
      </div>
      
      <Row gutter={24}>
        <Col span={8}>
          <FormItem label="激发孔个数" field="jfpknum" rules={[{ required: true, type: 'number' }]}>
            <InputNumber placeholder="请输入" />
          </FormItem>
        </Col>
        <Col span={8}>
          <FormItem label="激发孔平均深度" field="jfpksd" rules={[{ required: true, type: 'number' }]}>
            <InputNumber placeholder="请输入" suffix="m" />
          </FormItem>
        </Col>
        <Col span={8}>
          <FormItem label="激发孔平均直径" field="jfpkzj" rules={[{ required: true, type: 'number' }]}>
            <InputNumber placeholder="请输入" suffix="mm" />
          </FormItem>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={8}>
          <FormItem label="激发孔距离平均高度" field="jfpkjdmgd" rules={[{ required: true, type: 'number' }]}>
             <InputNumber placeholder="请输入" suffix="m" />
          </FormItem>
        </Col>
        <Col span={8}>
          <FormItem label="激发孔间距" field="jfpkjj" rules={[{ required: true, type: 'number' }]}>
             <InputNumber placeholder="请输入" suffix="m" />
          </FormItem>
        </Col>
        <Col span={8}>
           <FormItem label="接收孔个数" field="jspknum" rules={[{ required: true, type: 'number' }]}>
             <InputNumber placeholder="请输入" />
           </FormItem>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={8}>
          <FormItem label="接收孔平均深度" field="jspksd" rules={[{ required: true, type: 'number' }]}>
             <InputNumber placeholder="请输入" suffix="m" />
          </FormItem>
        </Col>
        <Col span={8}>
          <FormItem label="接收孔平均直径" field="jspkzj" rules={[{ required: true, type: 'number' }]}>
             <InputNumber placeholder="请输入" suffix="mm" />
          </FormItem>
        </Col>
        <Col span={8}>
           <FormItem label="接收孔距离平均高度" field="jspkjdmgd" rules={[{ required: true, type: 'number' }]}>
             <InputNumber placeholder="请输入" suffix="m" />
           </FormItem>
        </Col>
      </Row>

      {/* 2. 设备信息 */}
      <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '20px', marginTop: '10px', fontWeight: 'bold' }}>
        设备信息
      </div>
      <Row gutter={24}>
        <Col span={24}>
          <FormItem label="设备名称" field="sbName">
            <Input placeholder="请输入设备名称" />
          </FormItem>
        </Col>
      </Row>

      {/* 3. 接收孔信息 */}
      <div style={{ backgroundColor: '#F7F8FA', padding: '10px', marginBottom: '20px', marginTop: '10px', fontWeight: 'bold' }}>
        接收孔信息
      </div>

      <Row gutter={24}>
        <Col span={8}>
           <FormItem label="炮孔布置" field="kwwz">
             <Select placeholder="请选择" options={[
                { label: '面向掌子面左边墙', value: 1 },
                { label: '面向掌子面右边墙', value: 2 },
             ]} />
           </FormItem>
        </Col>
        <Col span={8}>
           <FormItem label="左里端(m)" field="leftkilo" rules={[{ type: 'number' }]}>
             <InputNumber placeholder="请输入" />
           </FormItem>
        </Col>
        <Col span={8}>
           <FormItem label="右里端(m)" field="rightkilo" rules={[{ type: 'number' }]}>
             <InputNumber placeholder="请输入" />
           </FormItem>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={8}>
           <FormItem label="左距拱顶垂直距离" field="leftjgdczjl" rules={[{ type: 'number' }]}>
             <InputNumber placeholder="请输入" suffix="m" />
           </FormItem>
        </Col>
        <Col span={8}>
           <FormItem label="左距中线距离" field="leftzxjl" rules={[{ type: 'number' }]}>
             <InputNumber placeholder="请输入" suffix="m" />
           </FormItem>
        </Col>
        <Col span={8}>
           <FormItem label="左距地面高度" field="leftjdmgd" rules={[{ type: 'number' }]}>
             <InputNumber placeholder="请输入" suffix="m" />
           </FormItem>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={8}>
           <FormItem label="右距拱顶垂直距离" field="rightjgdczjl" rules={[{ type: 'number' }]}>
             <InputNumber placeholder="请输入" suffix="m" />
           </FormItem>
        </Col>
        <Col span={8}>
           <FormItem label="右距中线距离" field="rightzxjl" rules={[{ type: 'number' }]}>
             <InputNumber placeholder="请输入" suffix="m" />
           </FormItem>
        </Col>
        <Col span={8}>
           <FormItem label="右距地面高度" field="rightjdmgd" rules={[{ type: 'number' }]}>
             <InputNumber placeholder="请输入" suffix="m" />
           </FormItem>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={8}>
           <FormItem label="左孔深" field="leftks" rules={[{ type: 'number' }]}>
             <InputNumber placeholder="请输入" suffix="m" />
           </FormItem>
        </Col>
        <Col span={8}>
           <FormItem label="右孔深" field="rightks" rules={[{ type: 'number' }]}>
             <InputNumber placeholder="请输入" suffix="m" />
           </FormItem>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col span={8}>
           <FormItem label="左倾角" field="leftqj" rules={[{ type: 'number' }]}>
             <InputNumber placeholder="请输入" suffix="°" />
           </FormItem>
        </Col>
        <Col span={8}>
           <FormItem label="右倾角" field="rightqj" rules={[{ type: 'number' }]}>
             <InputNumber placeholder="请输入" suffix="°" />
           </FormItem>
        </Col>
      </Row>
    </div>
  );
};

export default TspSystemTab;

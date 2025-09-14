import { Collapse, Divider } from '@arco-design/web-react';
const CollapseItem = Collapse.Item;

interface ListItemProps {
  title: string;
}

const ListItem: React.FC<ListItemProps> = ({ title }) => {
  return (
    <Collapse
      defaultActiveKey={['1', '2']}
      style={{ maxWidth: 1180 }}
    >
      <CollapseItem header='Beijing Toutiao Technology Co., Ltd.' name='1'>
        Beijing Toutiao Technology Co., Ltd.
        <Divider style={{ margin: '8px 0' }}/>
        {title}
        <Divider style={{ margin: '8px 0' }}/>
        {title}
      </CollapseItem>
    </Collapse>
  );
};

export default ListItem;

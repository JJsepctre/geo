import React from 'react';
import ReactECharts from 'echarts-for-react';

interface DetectionMethod {
  name: string;
  count: number;
  color: string;
}

interface DetectionDetail {
  method: string;
  time: string;
  mileage: string;
  length: string;
  status: string;
  operator: string;
}

interface DetectionChartProps {
  data: {
    detectionMethods: DetectionMethod[];
    detectionDetails: DetectionDetail[];
  };
}

const DetectionChart: React.FC<DetectionChartProps> = ({ data }) => {
  // 指定纵坐标固定顺序（用户要求）
  const defaultMethodNames = [
    '进度', '瞬变电磁', '高分辨直流电', '电磁波', '陆地声呐', 'HSP', '地震波反射',
    '洞身素描', '地表补充', '掌子面素描', '钻探法', '超前水平钻', '加深炮孔'
  ];

  // 将传入的 detectionMethods 按照 defaultMethodNames 的顺序映射，找不到的填 0
  const incomingMap = new Map<string, { count: number; color?: string }>();
  if (data.detectionMethods && data.detectionMethods.length > 0) {
    data.detectionMethods.forEach((m) => {
      incomingMap.set(m.name, { count: m.count, color: m.color });
    });
  }

  const methodList = defaultMethodNames.map((name) => ({
    name,
    count: incomingMap.has(name) ? incomingMap.get(name)!.count : 0,
    color: incomingMap.has(name) ? incomingMap.get(name)!.color || '#3B82F6' : '#d1d5db'
  }));

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: function (params: any) {
        const dataIndex = params.dataIndex;
        const method = methodList[dataIndex];
        const details = (data.detectionDetails || []).filter(d => d.method === method.name);
        
        let tooltipContent = `
          <div style="padding: 10px; min-width: 200px;">
              <div style="font-weight: bold; margin-bottom: 8px; color: ${method.color || '#999'}">
              ${method.name}
            </div>
            <div style="margin-bottom: 4px;"> ${method.count}</div>
        `;
        
        if (details.length > 0) {
          const detail = details[0];
          tooltipContent += `
            <div style="margin-bottom: 4px;">预报时间: ${detail.time}</div>
            <div style="margin-bottom: 4px;">里程: ${detail.mileage}</div>
            <div style="margin-bottom: 4px;">长度: ${detail.length}</div>
            <div style="margin-bottom: 4px;">状态: ${detail.status}</div>
            <div>操作者: ${detail.operator}</div>
          `;
        }
        
        tooltipContent += '</div>';
        return tooltipContent;
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#ccc',
      borderWidth: 1,
      textStyle: {
        color: '#333'
      }
    },
    xAxis: {
      type: 'value',
      name: '进度',
      nameTextStyle: {
        color: '#666'
      },
      axisLabel: {
        fontSize: 12,
        color: '#666'
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: '#e0e0e0'
        }
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#f0f0f0',
          type: 'dashed'
        }
      }
    },
    yAxis: {
      type: 'category',
      data: methodList.map(item => item.name),
      axisLabel: {
        fontSize: 12,
        color: '#666'
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: '#e0e0e0'
        }
      }
    },
    series: [{
      type: 'bar',
      data: methodList.map(item => ({
        value: item.count || 0,
        itemStyle: {
          color: item.color || '#d1d5db'
        }
      })),
      barWidth: '60%',
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowOffsetY: 0,
          shadowColor: 'rgba(0, 0, 0, 0.3)'
        }
      }
    }],
    grid: {
      left: '10%',
      right: '4%',
      bottom: '10%',
      top: '10%',
      containLabel: true
    }
  };

  return (
    <div style={{ width: '100%', height: '400px' }}>
      <ReactECharts 
        option={option} 
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  );
};

export default DetectionChart;
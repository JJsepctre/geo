// 地质预报系统Mock数据配置
export const mockConfig = {
  // 项目配置
  project: {
    totalTunnels: 10,
    totalWorkPoints: 140,
    completedWorkPoints: 89,
    highRiskPoints: 23,
    activeProjects: 1
  },

  // 隧道配置
  tunnelTypes: [
    { name: '山岭隧道', count: 6 },
    { name: '城市隧道', count: 2 },
    { name: '水底隧道', count: 1 },
    { name: '风井隧道', count: 1 }
  ],

  // 工点类型配置
  workPointTypes: [
    { name: '明洞', color: '#52c41a', icon: '🏗️' },
    { name: '洞门', color: '#1890ff', icon: '🚪' },
    { name: '主洞段', color: '#722ed1', icon: '🔄' },
    { name: '横通道', color: '#fa8c16', icon: '↔️' },
    { name: '暗挖段', color: '#eb2f96', icon: '⛏️' },
    { name: '救援站', color: '#f5222d', icon: '🚑' },
    { name: '通风井', color: '#13c2c2', icon: '💨' }
  ],

  // 风险等级配置
  riskLevels: [
    { name: '低风险', color: '#52c41a', percentage: 45 },
    { name: '中风险', color: '#faad14', percentage: 35 },
    { name: '高风险', color: '#f5222d', percentage: 20 }
  ],

  // 围岩等级配置
  rockGrades: [
    { name: 'Ⅰ级围岩', description: '坚硬岩石', color: '#096dd9' },
    { name: 'Ⅱ级围岩', description: '较坚硬岩石', color: '#36cfc9' },
    { name: 'Ⅲ级围岩', description: '较软岩石', color: '#95de64' },
    { name: 'Ⅳ级围岩', description: '软岩', color: '#ffc53d' },
    { name: 'Ⅴ级围岩', description: '极软岩', color: '#ff7875' }
  ],

  // 施工状态配置
  constructionStatus: [
    { name: 'active', label: '施工中', color: '#52c41a' },
    { name: 'inactive', label: '未开工', color: '#d9d9d9' },
    { name: 'completed', label: '已完工', color: '#1890ff' },
    { name: 'suspended', label: '暂停', color: '#faad14' }
  ],

  // 模拟数据生成配置
  generation: {
    tunnelNamePrefixes: ['大庆', '青龙', '阳春', '青草', '新对歌', '梨花', '白云', '凤凰', '金马', '银马'],
    tunnelNameSuffixes: ['山隧道', '岭隧道', '峰隧道'],
    mileageRange: { min: 700000, max: 800000 },
    lengthRange: { min: -2000, max: 2500 },
    delayRange: { min: 200, max: 800 } // API响应延迟范围(ms)
  }
};

// 生成随机地质预报数据
export const generateGeologicalForecast = () => {
  const forecasts = [
    '预测前方50m为Ⅲ级围岩，建议采用台阶法施工',
    '预测前方100m存在断层破碎带，需加强支护',
    '预测前方地下水发育，建议提前做好排水准备',
    '预测前方围岩完整性较好，可适当调整支护参数',
    '预测前方30m为软弱夹层，建议预加固处理',
    '预测前方岩性变化明显，需密切监测围岩变形',
    '预测前方可能存在溶洞，建议采用探孔预报',
    '预测前方围岩稳定性良好，可正常掘进'
  ];
  
  return forecasts[Math.floor(Math.random() * forecasts.length)];
};

// 生成随机施工建议
export const generateConstructionAdvice = () => {
  const advices = [
    '建议加强初期支护，及时施作二次衬砌',
    '建议采用分部开挖，控制围岩变形',
    '建议加强监控量测，及时调整施工参数',
    '建议做好防排水措施，确保施工安全',
    '建议优化爆破参数，减少对围岩的扰动',
    '建议加强通风管理，保证施工环境',
    '建议定期检查支护结构，确保施工质量'
  ];
  
  return advices[Math.floor(Math.random() * advices.length)];
};

export default mockConfig;
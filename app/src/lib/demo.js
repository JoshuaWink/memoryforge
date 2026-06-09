// Demo profile bundle for onboarding / showcase
export function createDemoBundle() {
  const now = Date.now();
  const demoProfile = { reading: 180, recall: 58, focus: 9, reasoning: 5, expression: 4 };
  const at = (daysAgo, hoursAgo = 0) => now - daysAgo * 86400000 - hoursAgo * 3600000;

  const demoDrills = [
    { type:'digits',  length:8,  material:'48102937', answer:'48102937', score:100, timestamp:at(0,2),  technique:'chunking',     drillMode:'recall' },
    { type:'words',   length:5,  material:'river ember stone field glass', answer:'river ember stone field', score:80, timestamp:at(0,6), technique:'linking', drillMode:'recall' },
    { type:'digits',  length:4,  material:'5812', answer:'cloth',   score:100, timestamp:at(1,3),  technique:'major',       drillMode:'encode' },
    { type:'digits',  length:4,  material:'9041', answer:'bus-door',score:0,   timestamp:at(1,8),  technique:'number-shape', drillMode:'encode' },
    { type:'letters', length:7,  material:'LQPMRTA', answer:'LQPMRTA', score:100, timestamp:at(2,4), technique:'none',     drillMode:'recall' },
    { type:'digits',  length:6,  material:'718409', answer:'718490', score:67, timestamp:at(2,9),  technique:'chunking',     drillMode:'recall' },
    { type:'words',   length:6,  material:'anchor lantern marble current velvet compass', answer:'anchor lantern current velvet compass', score:83, timestamp:at(3,2), technique:'linking', drillMode:'recall' },
    { type:'digits',  length:4,  material:'8207', answer:'fan-cake', score:100, timestamp:at(3,7), technique:'major',       drillMode:'encode' },
    { type:'digits',  length:4,  material:'6194', answer:'sheet-bear',score:100, timestamp:at(4,5), technique:'number-rhyme', drillMode:'encode' },
    { type:'text',    length:12, material:'Small disciplines turn scattered effort into measurable growth over time.', answer:'Small disciplines turn scattered effort into growth over time.', score:83, timestamp:at(4,11), technique:'none', drillMode:'recall' },
    { type:'digits',  length:4,  material:'7509', answer:'glass-bus', score:100, timestamp:at(5,4), technique:'major',       drillMode:'encode' },
    { type:'words',   length:4,  material:'crystal meadow thunder summit', answer:'crystal meadow thunder', score:75, timestamp:at(5,10), technique:'linking', drillMode:'recall' },
    { type:'digits',  length:4,  material:'3621', answer:'moon-shoe', score:0,  timestamp:at(6,2),  technique:'decode',       drillMode:'decode' },
    { type:'digits',  length:4,  material:'4308', answer:'4308',      score:100, timestamp:at(6,8), technique:'number-shape', drillMode:'recall' },
  ];

  return {
    version: 2,
    exported: new Date().toISOString().slice(0, 10),
    app: 'memoryforge',
    data: {
      drills: demoDrills,
      storage: {
        cg_profile: demoProfile,
        mf_ultra_dark: '0',
      },
    },
  };
}

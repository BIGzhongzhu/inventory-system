import { NextResponse } from 'next/server';
import { getClient } from '@/app/api/_db';

// POST /api/seed - seed initial data from Excel
export async function POST() {
  const client = getClient();

  // Products from Excel 产品信息表
  const initialProducts = [
    { code: '1', name: '通用印机粉', spec: '12A.88A', unit: '支', price: '7.5', sale_price: '0', init_qty: 0 },
    { code: '2', name: '12A硒鼓', spec: '12A', unit: '支', price: '36', sale_price: '0', init_qty: 0 },
    { code: '3', name: '88A硒鼓', spec: '88A', unit: '支', price: '36', sale_price: '0', init_qty: 0 },
    { code: '4', name: '三联三等份打印纸', spec: '3X3', unit: '包', price: '65', sale_price: '0', init_qty: 0 },
    { code: '5', name: '三联五等份打印纸', spec: '3X5', unit: '包', price: '66', sale_price: '0', init_qty: 0 },
    { code: '6', name: '三联二等份打印纸', spec: '3X2', unit: '包', price: '67', sale_price: '0', init_qty: 0 },
    { code: '7', name: '快递费用', spec: '1', unit: '次', price: '8', sale_price: '0', init_qty: 0 },
    { code: '8', name: '柯尼卡复印机保养耗材', spec: '1', unit: '次', price: '500', sale_price: '0', init_qty: 0 },
    { code: '9', name: '夏普复印机粉', spec: '1', unit: '支', price: '260', sale_price: '0', init_qty: 0 },
    { code: '10', name: '28A碳粉', spec: '28A', unit: '支', price: '12', sale_price: '0', init_qty: 0 },
    { code: '11', name: '震旦369S复印机粉', spec: '369s', unit: '支', price: '120', sale_price: '0', init_qty: 0 },
    { code: '12', name: '88A打印机粉', spec: '88A', unit: '支', price: '9.9', sale_price: '0', init_qty: 0 },
    { code: '13', name: 'SK-860色带', spec: 'SK-860', unit: '个', price: '38', sale_price: '0', init_qty: 0 },
    { code: '14', name: '805墨盒黑色', spec: '805', unit: '个', price: '65', sale_price: '0', init_qty: 0 },
    { code: '15', name: '805墨盒彩色', spec: '805', unit: '个', price: '65', sale_price: '0', init_qty: 0 },
    { code: '16', name: '夏普复印机粉', spec: '2202', unit: '支', price: '280', sale_price: '0', init_qty: 0 },
    { code: '17', name: 'SONY电池', spec: 'DSC-W830', unit: '个', price: '80', sale_price: '0', init_qty: 0 },
    { code: '18', name: '交换机', spec: '', unit: '个', price: '85', sale_price: '0', init_qty: 0 },
    { code: '19', name: '硬盘', spec: '', unit: '个', price: '0', sale_price: '0', init_qty: 0 },
    { code: '20', name: '内存条', spec: '', unit: '个', price: '0', sale_price: '0', init_qty: 0 },
    { code: '21', name: '打印机切换器', spec: '', unit: '个', price: '0', sale_price: '0', init_qty: 0 },
    { code: '22', name: '803墨盒黑色', spec: '803', unit: '个', price: '100', sale_price: '0', init_qty: 0 },
    { code: '23', name: '803墨盒彩色', spec: '803', unit: '个', price: '100', sale_price: '0', init_qty: 0 },
    { code: '24', name: '110A硒鼓', spec: '110A', unit: '个', price: '94', sale_price: '0', init_qty: 0 },
    { code: '25', name: '103A硒鼓', spec: '103A', unit: '个', price: '240', sale_price: '0', init_qty: 0 },
    { code: '26', name: '218A硒鼓', spec: '218A硒鼓', unit: '个', price: '180', sale_price: '0', init_qty: 0 },
    { code: '27', name: '得力620K色带', spec: '620K', unit: '个', price: '35', sale_price: '0', init_qty: 0 },
    { code: '28', name: '730K色带', spec: '730K', unit: '个', price: '10', sale_price: '0', init_qty: 0 },
    { code: '29', name: '键盘', spec: '', unit: '个', price: '0', sale_price: '0', init_qty: 0 },
    { code: '30', name: '路由器', spec: '千兆', unit: '个', price: '0', sale_price: '0', init_qty: 0 },
    { code: '31', name: '110A打印机粉', spec: '', unit: '个', price: '0', sale_price: '0', init_qty: 0 },
    { code: '32', name: '28A硒鼓', spec: '28A硒鼓', unit: '个', price: '0', sale_price: '0', init_qty: 0 },
    { code: '33', name: 'M104a', spec: '打印机粉', unit: '个', price: '0', sale_price: '0', init_qty: 0 },
    { code: '34', name: '柯尼卡367复印机粉', spec: '367', unit: '个', price: '0', sale_price: '0', init_qty: 0 },
    { code: '35', name: '鼠标垫', spec: '', unit: '个', price: '0', sale_price: '0', init_qty: 0 },
    { code: '36', name: '开关', spec: '', unit: '个', price: '0', sale_price: '0', init_qty: 0 },
    { code: '37', name: '103A打印机粉', spec: '', unit: '个', price: '0', sale_price: '0', init_qty: 0 },
    { code: '38', name: '打印纸', spec: '57*40', unit: '个', price: '0', sale_price: '0', init_qty: 0 },
    { code: '39', name: '打印纸', spec: '57*50', unit: '个', price: '0', sale_price: '0', init_qty: 0 },
    { code: '40', name: '色带', spec: 'ERC09', unit: '个', price: '0', sale_price: '0', init_qty: 0 },
    { code: '41', name: '色带', spec: 'ERC39', unit: '个', price: '0', sale_price: '0', init_qty: 0 },
    { code: '42', name: '硒鼓芯片', spec: '', unit: '个', price: '0', sale_price: '0', init_qty: 0 },
    { code: '43', name: '电容笔', spec: '', unit: '个', price: '0', sale_price: '0', init_qty: 0 },
    { code: '44', name: '218A打印机粉', spec: '218A', unit: '个', price: '0', sale_price: '0', init_qty: 0 },
    { code: '45', name: '支架', spec: '', unit: '个', price: '0', sale_price: '0', init_qty: 0 },
    { code: '46', name: 'USB扩展器', spec: '', unit: '个', price: '0', sale_price: '0', init_qty: 0 },
    { code: '47', name: '118A打印机硒鼓', spec: '118A', unit: '个', price: '0', sale_price: '0', init_qty: 0 },
    { code: '48', name: 'U盘', spec: '', unit: '个', price: '0', sale_price: '0', init_qty: 0 },
    { code: '49', name: '118A打印机粉', spec: '118A', unit: '套', price: '0', sale_price: '0', init_qty: 0 },
    { code: '50', name: 'USB延长线', spec: '', unit: '米', price: '0', sale_price: '0', init_qty: 0 },
    { code: '51', name: '电脑电源', spec: '', unit: '个', price: '0', sale_price: '0', init_qty: 0 },
    { code: '52', name: '串口线', spec: '', unit: '米', price: '0', sale_price: '0', init_qty: 0 },
    { code: '53', name: '读卡器', spec: '', unit: '只', price: '0', sale_price: '0', init_qty: 0 },
    { code: '54', name: '键鼠套装', spec: '', unit: '套', price: '0', sale_price: '0', init_qty: 0 },
    { code: '55', name: 'SD卡', spec: '', unit: '个', price: '0', sale_price: '0', init_qty: 0 },
    { code: '56', name: 'TF卡', spec: '', unit: '个', price: '0', sale_price: '0', init_qty: 0 },
    { code: '57', name: '605K色带', spec: '605K', unit: '个', price: '0', sale_price: '0', init_qty: 0 },
    { code: '58', name: '显示器', spec: '', unit: '个', price: '0', sale_price: '0', init_qty: 0 },
    { code: '59', name: '电池', spec: '', unit: '个', price: '0', sale_price: '0', init_qty: 0 },
    { code: '60', name: 'HP178nw(150a)', spec: '', unit: '个', price: '0', sale_price: '0', init_qty: 0 },
    { code: '61', name: '803墨盒套装', spec: '803', unit: '套', price: '218', sale_price: '0', init_qty: 0 },
    { code: '62', name: '打印机纸80mm', spec: '', unit: '卷', price: '8', sale_price: '0', init_qty: 0 },
    { code: '63', name: '数据线', spec: '', unit: '根', price: '0', sale_price: '0', init_qty: 0 },
    { code: '64', name: '佳能墨水(彩色)', spec: 'GI-890(彩色)', unit: '瓶', price: '54', sale_price: '0', init_qty: 0 },
    { code: '65', name: '佳能墨水(黑色)', spec: 'GI-890(黑色)', unit: '瓶', price: '58', sale_price: '0', init_qty: 0 },
    { code: '66', name: '标签打印机', spec: '标签打印机', unit: '个', price: '200', sale_price: '0', init_qty: 0 },
    { code: '67', name: '色带', spec: 'ERC05', unit: '支', price: '10', sale_price: '0', init_qty: 0 },
    { code: '68', name: '硒鼓', spec: 'W1660A', unit: '支', price: '35', sale_price: '0', init_qty: 0 },
    { code: '69', name: '网卡', spec: '', unit: '个', price: '40', sale_price: '0', init_qty: 0 },
  ];

  // Customers from Excel 客户信息表
  const initialCustomers = [
    { name: '总经办', phone: '6218', address: '', contact: '万宣', bank: '', account: '', remark: '' },
    { name: '财务部', phone: '6321', address: '', contact: '簧贤慧', bank: '', account: '', remark: '' },
    { name: '商贸中心', phone: '6101-6003', address: '', contact: '刘丹、甘云云', bank: '', account: '', remark: '' },
    { name: '工程部', phone: '5190', address: '', contact: '闵春', bank: '', account: '', remark: '' },
    { name: '提取', phone: '5094', address: '', contact: '周志林', bank: '', account: '', remark: '' },
    { name: '制剂', phone: '9140', address: '', contact: '王超', bank: '', account: '', remark: '' },
    { name: '生产技术', phone: '6122', address: '', contact: '秦晓红', bank: '', account: '', remark: '' },
    { name: '质量保证部', phone: '6319', address: '', contact: '陈良华', bank: '', account: '', remark: '' },
    { name: '质量控制部', phone: '9105', address: '', contact: '丁玉春', bank: '', account: '', remark: '' },
    { name: '药研所', phone: '8327', address: '', contact: '张芳', bank: '', account: '', remark: '' },
    { name: '采购', phone: '6006', address: '', contact: '张建英', bank: '', account: '', remark: '' },
    { name: '仓库', phone: '5113', address: '', contact: '罗玲玲', bank: '', account: '', remark: '' },
    { name: '自己', phone: '6217', address: '', contact: '万宣', bank: '', account: '', remark: '' },
    { name: '黄琴', phone: '6210', address: '', contact: '黄琴', bank: '', account: '', remark: '' },
    { name: '合成', phone: '', address: '', contact: '邹阳', bank: '', account: '', remark: '' },
    { name: '中试', phone: '', address: '', contact: '', bank: '', account: '', remark: '' },
  ];

  // Suppliers from Excel 供应商信息表
  const initialSuppliers = [
    { name: '京东', phone: '', address: '', contact: '', bank: '', account: '', remark: '' },
    { name: '淘宝', phone: '', address: '', contact: '', bank: '', account: '', remark: '' },
    { name: '南昌佳鑫', phone: '', address: '', contact: '', bank: '', account: '', remark: '' },
    { name: '南昌迈拓', phone: '', address: '', contact: '', bank: '', account: '', remark: '' },
  ];

  // Insert products (if not already existing)
  const { data: existingProducts } = await client.from('products').select('id').limit(1);
  let productCount = 0;
  if (!existingProducts || existingProducts.length === 0) {
    const { data: productData, error: productError } = await client.from('products').insert(initialProducts).select();
    if (productError) console.error('Product seed error:', productError.message);
    productCount = productData?.length || 0;
  }

  // Insert customers (if not already existing)
  const { data: existingCustomers } = await client.from('customers').select('id').limit(1);
  let customerCount = 0;
  if (!existingCustomers || existingCustomers.length === 0) {
    const { data: customerData, error: customerError } = await client.from('customers').insert(initialCustomers).select();
    if (customerError) console.error('Customer seed error:', customerError.message);
    customerCount = customerData?.length || 0;
  }

  // Insert suppliers (if not already existing)
  const { data: existingSuppliers } = await client.from('suppliers').select('id').limit(1);
  let supplierCount = 0;
  if (!existingSuppliers || existingSuppliers.length === 0) {
    const { data: supplierData, error: supplierError } = await client.from('suppliers').insert(initialSuppliers).select();
    if (supplierError) console.error('Supplier seed error:', supplierError.message);
    supplierCount = supplierData?.length || 0;
  }

  return NextResponse.json({
    message: 'Data seeded successfully',
    products: productCount,
    customers: customerCount,
    suppliers: supplierCount,
  });
}

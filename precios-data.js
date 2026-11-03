/*
 * Datos verificables, corte de recopilación: 03/11/2026.
 * NO son precios en tiempo real. NO mezclar mayoristas nacionales con precios minoristas de Chiclayo.
 */
export const preciosBase = {
  chiclayo: {
    title: 'Chiclayo · Mercado Moshoqueque',
    description: 'Precio referencial del maíz amarillo duro (rango mínimo y máximo) en seis fechas de mayo de 2026. Este reporte no representa el precio de hoy ni de otros cultivos.',
    labelDate: '1–13 de mayo de 2026',
    unit: 'S/ por kg',
    source: 'MIDAGRI — Boletín de comercialización de maíz amarillo duro, 13/05/2026',
    sourceUrl: 'https://cdn.www.gob.pe/uploads/document/file/9965189/8083205-boletin-de-comercializacion-de-maiz-amarillo-duro-13-05-2026.pdf',
    dates: ['01/05','04/05','06/05','08/05','11/05','13/05'],
    series: [
      {name:'Precio mínimo',values:[1.4,1.4,1.4,1.4,1.4,1.4],color:'#30a77a'},
      {name:'Precio máximo',values:[1.6,1.6,1.6,1.6,1.6,1.6],color:'#e5a92f'}
    ]
  },
  peru: {
    title: 'Perú · Precios mayoristas',
    description: 'Cotizaciones nacionales de referencia. No equivalen a precios de venta directa de Agrotec ni corresponden necesariamente al mercado de Chiclayo.',
    labelDate: '2 de noviembre de 2026',
    unit: 'S/ por kg',
    source: 'Observatorio Agromercado (MIDAGRI)',
    sourceUrl: 'https://observatorio.agromercado.gob.pe/',
    rows: [
      {name:'Palta Hass',value:5.23,date:'02/11/2026'},
      {name:'Mango Kent',value:3.98,date:'02/11/2026'},
      {name:'Maracuyá',value:5.27,date:'02/11/2026'},
      {name:'Piña Golden',value:1.72,date:'02/11/2026'}
    ]
  },
  mundo: {
    title: 'Mundo · Cotizaciones internacionales',
    description: 'Valores promedio mensuales de referencia. Las variedades y mercados son diferentes a las cotizaciones peruanas; no se convierten automáticamente a soles.',
    labelDate: 'Enero – septiembre de 2026',
    unit: 'US$ por tonelada',
    source: 'Banco Mundial — Pink Sheet, serie mensual (compilado por Macro Lab, octubre 2026)',
    sourceUrl: 'https://www.worldbank.org/en/research/commodity-markets',
    dates: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep'],
    series: [
      {name:'Maíz',values:[204.5,209.6,212.7,214.0,216.2,197.1,213.4,224.0,239.6],color:'#2d8e5c',url:'https://macrolab.lk/data/series/LK.CPI.WB_CMO.MAIZE.M/'},
      {name:'Trigo HRW EE. UU.',values:[249.9,257.6,276.0,282.0,303.0,286.0,310.0,330.0,347.0],color:'#e4a52b',url:'https://macrolab.lk/data/series/LK.CPI.WB_CMO.WHEAT_US_HRW.M/'},
      {name:'Arroz tailandés 5%',values:[408,409,381,403,440,494,467,471,482],color:'#587fb1',url:'https://macrolab.lk/data/series/LK.CPI.WB_CMO.RICE_THAI_5.M/'}
    ]
  }
};

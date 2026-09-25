/* ============================= UTILIDADES ============================= */
let uidCounter = 300;
function uid(){ return ++uidCounter; }
function todayISO(){ return '2026-08-11'; }
function nowLabel(){ return 'Hoy ' + new Date().toLocaleTimeString('es-CO',{hour:'2-digit',minute:'2-digit'}); }
function slug(s){ return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,''); }
function esc(s){ return String(s===undefined||s===null?'':s).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

const CURRENCY_META = {
  COP:{symbol:'$', rate:1, code:'COP', taxName:'IVA (Colombia)', taxRate:19, taxNote:'Tarifa general de IVA en Colombia.'},
  DOP:{symbol:'RD$', rate:0.015, code:'DOP', taxName:'ITBIS (República Dominicana)', taxRate:18, taxNote:'Tarifa general de ITBIS en República Dominicana.'},
  USD:{symbol:'$', rate:0.00025, code:'USD', taxName:'Sales Tax local', taxRate:0, taxNote:'Configurable: la tasa depende del estado, ciudad y tipo de producto.'},
  EUR:{symbol:'€', rate:0.0002326, code:'EUR', taxName:'IVA local', taxRate:0, taxNote:'Configurable: la tasa depende del país miembro de la Unión Europea.'},
  GBP:{symbol:'£', rate:0.0001961, code:'GBP', taxName:'VAT (Reino Unido)', taxRate:20, taxNote:'Tarifa estándar de VAT en Reino Unido.'}
};
function activeTax(){ return CURRENCY_META[state.currency] || CURRENCY_META.COP; }
function updateTaxUI(){
  const t=activeTax();
  const header=document.getElementById('productTaxHeader'); if(header) header.textContent=t.taxName;
  const pLabel=document.getElementById('productTaxLabel'); if(pLabel) pLabel.textContent=t.taxName+' (%)';
  const qLabel=document.getElementById('quoteTaxLabel'); if(qLabel) qLabel.textContent=t.taxName+' (%)';
  const note=document.getElementById('taxJurisdictionNote'); if(note) note.innerHTML='<strong>'+t.taxName+': '+t.taxRate+'%</strong> · '+t.taxNote+' Tasa demostrativa editable según el producto y la jurisdicción.';
}
function formatMoney(copValue){
  const m = CURRENCY_META[state.currency] || CURRENCY_META.COP;
  const converted = Number(copValue) * m.rate;
  return m.symbol + Math.round(converted).toLocaleString('es-CO') + ' ' + m.code;
}
function changeCurrency(cur){
  state.currency = cur;
  const tax=CURRENCY_META[cur]||CURRENCY_META.COP;
  state.products.forEach(function(p){p.impuesto=tax.taxRate;});
  state.quotes.forEach(function(q){q.impuesto=tax.taxRate;q.total=q.subtotal*(1+tax.taxRate/100);});
  document.getElementById('currencySelectHeader').value = cur;
  document.getElementById('currencySelectConfig').value = cur;
  const note = document.getElementById('cli-currency-note');
  if(note) note.textContent = cur;
  updateTaxUI();
  renderAll();
  showToast('Moneda de visualización cambiada a '+cur);
}

/* ============================= ESTADO ============================= */
const ETAPAS = ['Nueva solicitud','En revisión','Buró consultado','Precalificada','Aprobada'];
const ETAPA_COLOR = {'Nueva solicitud':'#5a6b85','En revisión':'#2f6fed','Buró consultado':'#4f8bff','Precalificada':'#e0a324','Aprobada':'#17a673'};
const CANAL_COLOR = {'WhatsApp':'#17a673','Email':'#2f6fed','Llamada':'#e0a324','Bot IA':'#d92440','Ads':'#4f8bff','SMS':'#c77d1a','Presencial':'#5a6b85'};

const state = {
  currency: 'DOP',
  clientes: [
    {id:1, empresa:'Ejército Nacional — Retiro', empresaId:1, contacto:'Cnel. Rafael Ureña', email:'rafael.urena@correo.com', telefono:'+1 809 555 0101', estado:'Activo', etapa:'Aprobada', valor:14700000, probabilidad:100, canal:'WhatsApp', notas:[{fecha:'10 Ago 2026',texto:'Crédito aprobado y desembolsado. Solicitante conforme con las condiciones.'}], actividad:[{fecha:'11 Ago 2026 · 09:20',texto:'Aprobación final confirmada por el comité de crédito.'},{fecha:'08 Ago 2026 · 15:00',texto:'Precalificación completada con resultado favorable.'}]},
    {id:2, empresa:'Marina de Guerra — Retiro', empresaId:2, contacto:'Sgto. Mayor Ana Ventura', email:'ana.ventura@correo.com', telefono:'+1 809 555 0102', estado:'Prospecto', etapa:'Precalificada', valor:6300000, probabilidad:65, canal:'Email', notas:[], actividad:[{fecha:'11 Ago 2026 · 11:00',texto:'Precalificación estimada: capacidad de pago adecuada al monto solicitado.'}]},
    {id:3, empresa:'Policía Nacional — Retiro', empresaId:3, contacto:'Cap. Pedro Julián', email:'pedro.julian@correo.com', telefono:'+1 809 555 0103', estado:'Prospecto', etapa:'Buró consultado', valor:4000000, probabilidad:45, canal:'Llamada', notas:[], actividad:[]},
    {id:4, empresa:'Ejército Nacional — Retiro', empresaId:null, contacto:'Raso Miguel Santana', email:'miguel.santana@correo.com', telefono:'+1 809 555 0104', estado:'Prospecto', etapa:'En revisión', valor:2700000, probabilidad:33, canal:'Bot IA', notas:[], actividad:[]},
    {id:5, empresa:'Policía Nacional — Retiro', empresaId:null, contacto:'Elena Reyes', email:'elena.reyes@correo.com', telefono:'+1 809 555 0105', estado:'Prospecto', etapa:'Nueva solicitud', valor:8000000, probabilidad:33, canal:'Bot IA', notas:[], actividad:[]},
    {id:6, empresa:'Marina de Guerra — Retiro', empresaId:null, contacto:'José Manuel Cabrera', email:'jose.cabrera@correo.com', telefono:'+1 809 555 0106', estado:'Prospecto', etapa:'En revisión', valor:5000000, probabilidad:58, canal:'Bot IA', notas:[], actividad:[]},
    {id:7, empresa:'Ejército Nacional — Retiro', empresaId:null, contacto:'Carmen Julia Féliz', email:'carmen.feliz@correo.com', telefono:'+1 809 555 0107', estado:'Inactivo', etapa:'Nueva solicitud', valor:2000000, probabilidad:100, canal:'Email', notas:[], actividad:[]}
  ],
  empresas: [
    {id:1, nombre:'Tech Innovate S.A.', nit:'900.123.456-7', sector:'Tecnología', ciudad:'Bogotá, Colombia', enriquecido:false, actividad:[]},
    {id:2, nombre:'Retail Commerce Group', nit:'800.654.321-9', sector:'Retail', ciudad:'Medellín, Colombia', enriquecido:false, actividad:[]},
    {id:3, nombre:'Soluciones Digitales LTDA', nit:'700.111.222-3', sector:'Consultoría', ciudad:'Cali, Colombia', enriquecido:false, actividad:[]}
  ],
  eventos: [
    {id:1, titulo:'Reunión con Tech Innovate', fecha:'2026-08-11', hora:'14:30', clienteId:1},
    {id:2, titulo:'Reunión interna — seguimiento de prospección', fecha:'2026-08-11', hora:'16:00', clienteId:null},
    {id:3, titulo:'Propuesta a Retail Commerce', fecha:'2026-08-12', hora:'10:00', clienteId:2}
  ],
  correosRecibidos: [
    {from:'Carlos Díaz (Tech Innovate)', subject:'Re: Propuesta de servicio de soporte', preview:'Nos interesa mucho conocer más detalles sobre el alcance del servicio...', time:'Hoy 10:15'},
    {from:'María López (Retail Commerce)', subject:'Demostración de suscripción - Disponibilidad', preview:'¿Disponible para una demostración el próximo jueves?', time:'Ayer 15:42'},
    {from:'Juan Pérez (Soluciones Digitales)', subject:'Seguimiento - Propuesta recibida', preview:'Recibimos la propuesta y la estamos evaluando con el equipo...', time:'Hace 2 días'}
  ],
  correosEnviados: [],
  plantillas: {
    SMS: [
      {id:1, nombre:'Seguimiento de propuesta', texto:'Hola {nombre}, ¿recibió nuestra propuesta de {servicio}? Estamos disponibles para aclarar cualquier duda.'},
      {id:2, nombre:'Recordatorio de reunión', texto:'Hola {nombre}, le recordamos su reunión programada para {fecha} a las {hora}. ¡Nos vemos!'}
    ],
    WhatsApp: [
      {id:3, nombre:'Presentación de servicio', texto:'🎯 Hola {nombre}, somos {empresa} y nos encantaría contarte sobre {servicio}. ¿Te gustaría conocer más?'},
      {id:4, nombre:'Demo de producto', texto:'💬 Hola {nombre}, preparamos una demostración de {servicio}. ¿Disponible el {fecha}?'}
    ]
  },
  campanas: [],
  conversations: [
    {id:1,clienteId:5,nombre:'Elena Reyes',empresa:'Policía Nacional — Retiro',canal:'Asistente AVA',etapa:'Nueva solicitud',producto:'Crédito personal',proxima:'Continuar captura de documentos',unread:true,messages:[
      {dir:'outgoing',text:'Hola, soy AVA 👋 Voy a ayudarte a solicitar tu crédito. ¿Me confirmas tu nombre completo y número de cédula?',time:'Hoy 08:40'},
      {dir:'incoming',text:'Elena Reyes, cédula 001-1234567-8.',time:'Hoy 08:41'},
      {dir:'outgoing',text:'Gracias, Elena. ¿Cuál es el monto que deseas solicitar y para qué lo necesitas?',time:'Hoy 08:42'},
      {dir:'incoming',text:'Necesito RD$120,000 para gastos médicos familiares.',time:'Hoy 08:43'},
      {dir:'outgoing',text:'Entendido. Para continuar necesito tu información laboral o de ingresos: ¿pensión, salario u otra fuente?',time:'Hoy 08:44'},
      {dir:'incoming',text:'Pensión de la Policía Nacional.',time:'Hoy 08:45'},
      {dir:'outgoing',text:'Perfecto. Por último, ¿puedes adjuntar tu cédula y el último comprobante de pensión? Con eso genero tu prospecto y continúo con la consulta de buró.',time:'Hoy 08:46'}
    ]},
    {id:2,clienteId:2,nombre:'Ana Ventura',empresa:'Marina de Guerra — Retiro',canal:'Email',etapa:'Precalificada',producto:'Crédito personal',proxima:'Confirmar resultado de precalificación',unread:true,messages:[{dir:'outgoing',text:'Sra. Ventura, su precalificación quedó lista con resultado favorable.',time:'Ayer 09:12'},{dir:'incoming',text:'Perfecto, ¿cuáles serían los próximos pasos?',time:'Hoy 09:42'}]},
    {id:3,clienteId:3,nombre:'Pedro Julián',empresa:'Policía Nacional — Retiro',canal:'SMS',etapa:'Buró consultado',producto:'Crédito personal',proxima:'Llamar mañana, 11:00',unread:false,messages:[{dir:'incoming',text:'Llámeme mañana para revisar el resultado del buró.',time:'Ayer 17:08'}]},
    {id:4,clienteId:6,nombre:'José Manuel Cabrera',empresa:'Marina de Guerra — Retiro',canal:'Asistente AVA',etapa:'En revisión',producto:'Crédito personal',proxima:'Calificar necesidad hoy',unread:true,messages:[{dir:'incoming',text:'Quiero saber si mi solicitud de crédito sigue en revisión.',time:'Hoy 08:55'},{dir:'outgoing',text:'AVA confirma: tu solicitud está en revisión, un asesor te contactará hoy.',time:'Hoy 08:56'}]}
  ],
  tasks: [
    {id:1,tipo:'Consultar buró',cliente:'Ana Ventura',empresa:'Marina de Guerra — Retiro',responsable:'Katherine Silva',fecha:'2026-08-11',hora:'09:30',prioridad:'Alta',estado:'Pendiente'},
    {id:2,tipo:'Llamar solicitante',cliente:'Pedro Julián',empresa:'Policía Nacional — Retiro',responsable:'Sarah Chen',fecha:'2026-08-11',hora:'11:00',prioridad:'Alta',estado:'En progreso'},
    {id:3,tipo:'Revisar documentos',cliente:'José Manuel Cabrera',empresa:'Marina de Guerra — Retiro',responsable:'Katherine Silva',fecha:'2026-08-11',hora:'14:30',prioridad:'Media',estado:'Pendiente'},
    {id:4,tipo:'Notificar aprobación',cliente:'Rafael Ureña',empresa:'Ejército Nacional — Retiro',responsable:'Carlos Méndez',fecha:'2026-08-11',hora:'16:00',prioridad:'Media',estado:'Completada'},
    {id:5,tipo:'Dar seguimiento a mora',cliente:'Julio César Paulino',empresa:'Cartera',responsable:'Sarah Chen',fecha:'2026-08-12',hora:'10:15',prioridad:'Baja',estado:'Pendiente'}
  ],
  products: [
    {id:1,nombre:'Crédito personal',descripcion:'Préstamo de libre destino para necesidades personales o familiares.',precio:8000000,impuesto:0,comision:0,estado:'Activo'},
    {id:2,nombre:'Crédito consumo',descripcion:'Financiamiento para compra de bienes o servicios de consumo.',precio:5000000,impuesto:0,comision:0,estado:'Activo'},
    {id:3,nombre:'Refinanciamiento',descripcion:'Consolidación de obligaciones vigentes en una sola cuota.',precio:12000000,impuesto:0,comision:0,estado:'Activo'},
    {id:4,nombre:'Crédito de emergencia',descripcion:'Desembolso rápido para necesidades urgentes (salud, imprevistos).',precio:3000000,impuesto:0,comision:0,estado:'Activo'},
    {id:5,nombre:'Crédito para vivienda',descripcion:'Financiamiento para mejora, ampliación o adquisición de vivienda.',precio:20000000,impuesto:0,comision:0,estado:'Activo'}
  ],
  quotes: [
    {id:1,numero:'CR-2026-014',cliente:'Ana Ventura',empresa:'Marina de Guerra — Retiro',producto:'Crédito personal',cantidad:18,precio:6300000,descuento:0,impuesto:0,subtotal:6300000,total:6300000,fecha:'2026-08-10',estado:'Enviada'},
    {id:2,numero:'CR-2026-013',cliente:'Rafael Ureña',empresa:'Ejército Nacional — Retiro',producto:'Crédito de emergencia',cantidad:12,precio:14700000,descuento:0,impuesto:0,subtotal:14700000,total:14700000,fecha:'2026-08-08',estado:'Aceptada'},
    {id:3,numero:'CR-2026-012',cliente:'Pedro Julián',empresa:'Policía Nacional — Retiro',producto:'Crédito consumo',cantidad:24,precio:4000000,descuento:0,impuesto:0,subtotal:4000000,total:4000000,fecha:'2026-08-06',estado:'Borrador'},
    {id:4,numero:'CR-2026-011',cliente:'Carmen Julia Féliz',empresa:'Ejército Nacional — Retiro',producto:'Crédito de emergencia',cantidad:6,precio:2000000,descuento:0,impuesto:0,subtotal:2000000,total:2000000,fecha:'2026-08-03',estado:'Rechazada'}
  ],
  gestiones: [
    {id:1, clienteId:1, empresaId:null, empresa:'Tech Innovate S.A.', contacto:'Carlos Díaz', estado:'Cerrado', producto:'Servicio de soporte', canal:'Llamada', proxFecha:'', asesor:'Katherine Silva', detalle:'Cierre comercial confirmado. Cliente satisfecho con la demostración.', fecha:'11 Ago 2026'},
    {id:2, clienteId:2, empresaId:null, empresa:'Retail Commerce', contacto:'María López', estado:'Interesado', producto:'Suscripción empresarial', canal:'Email', proxFecha:'2026-08-12', asesor:'Katherine Silva', detalle:'Solicitó ver el módulo de reportes antes de decidir.', fecha:'11 Ago 2026'}
  ],
  canalesAds: [
    {id:1, plataforma:'Google Ads', conectado:true, leadsHoy:6, cpl:'Medio'},
    {id:2, plataforma:'Meta Ads', conectado:true, leadsHoy:9, cpl:'Bajo'},
    {id:3, plataforma:'WhatsApp Ads', conectado:false, leadsHoy:0, cpl:'—'}
  ],
  leadsEntrantes: [
    {id:1, empresa:'ConstruMax RD', contacto:'Roberto Silva', campana:'Automatización WhatsApp — LATAM', plataforma:'Meta Ads', fecha:'Hoy 09:40', convertido:false},
    {id:2, empresa:'Alimentos Frescos', contacto:'Sandra Lima', campana:'Solución empresarial — Búsqueda', plataforma:'Google Ads', fecha:'Hoy 08:15', convertido:false},
    {id:3, empresa:'DataFleet Corp', contacto:'—', campana:'Servicio de soporte — Conversión', plataforma:'Google Ads', fecha:'Ayer 17:02', convertido:true}
  ],
  automatizaciones: [
    {id:'nurturing', nombre:'Secuencia de seguimiento automatizado', version:'Automatización activa', activa:true,
      nodos:[
        {id:'n1', tipo:'TRIGGER', titulo:'Nuevo cliente potencial (CRM)', campos:{'Origen':'Cualquier canal (CRM, Ads, WhatsApp)'}},
        {id:'n2', tipo:'ACTION', titulo:'Esperar 5 minutos', campos:{'Tiempo de espera':'5 minutos','Responsable':'Sarah Chen'}},
        {id:'n3', tipo:'ACTION', titulo:'Enviar correo de bienvenida', campos:{'Canal':'Correo','Plantilla':'Presentación de servicio'}},
        {id:'n4', tipo:'CONDITION', titulo:'¿Correo abierto?', ramas:[{label:'SÍ', destino:'Asignar a Ventas'},{label:'NO', destino:'Enviar seguimiento'}]}
      ]},
    {id:'recordatorio', nombre:'Recordatorio de reunión', version:'Automatización activa', activa:true,
      nodos:[
        {id:'r1', tipo:'TRIGGER', titulo:'Evento agendado en 24h', campos:{'Origen':'Agenda CRM'}},
        {id:'r2', tipo:'ACTION', titulo:'Enviar WhatsApp de recordatorio', campos:{'Canal':'WhatsApp','Plantilla':'Recordatorio de reunión'}},
        {id:'r3', tipo:'CONDITION', titulo:'¿Confirmó asistencia?', ramas:[{label:'SÍ', destino:'Notificar al asesor'},{label:'NO', destino:'Reagendar automáticamente'}]}
      ]},
    {id:'reactivacion', nombre:'Reactivación de inactivos', version:'Automatización pausada', activa:false,
      nodos:[
        {id:'a1', tipo:'TRIGGER', titulo:'Cliente sin actividad 30 días', campos:{'Origen':'CRM — estado Inactivo'}},
        {id:'a2', tipo:'ACTION', titulo:'Enviar campaña de reactivación', campos:{'Canal':'WhatsApp','Plantilla':'Presentación de servicio'}},
        {id:'a3', tipo:'CONDITION', titulo:'¿Respondió en 48h?', ramas:[{label:'SÍ', destino:'Asignar a Ventas'},{label:'NO', destino:'Marcar como perdido'}]}
      ]}
  ],
  apis: [
    {id:1, nombre:'AVAChat (WhatsApp)', categoria:'Mensajería IA', icono:'💬', conectado:true, campos:[{label:'Número WhatsApp Business', value:'+57 1 800 555 0000'},{label:'Token API', value:'sk_ava_••••••••4f21'}]},
    {id:2, nombre:'WhatsApp Business API', categoria:'Mensajería', icono:'📲', conectado:true, campos:[{label:'Phone Number ID', value:'109••••••7842'},{label:'Access Token', value:'EAAG••••••••••x92'}]},
    {id:3, nombre:'Programa Contable (Siigo)', categoria:'Contabilidad y facturación', icono:'🧾', conectado:false, campos:[{label:'Usuario API', value:''},{label:'Access Key', value:''}]},
    {id:4, nombre:'Correo (Gmail / Outlook)', categoria:'Comunicaciones', icono:'✉️', conectado:true, campos:[{label:'Cuenta conectada', value:'ventas@ccgrupo.com'}]},
    {id:5, nombre:'Google Calendar', categoria:'Agenda', icono:'📅', conectado:false, campos:[{label:'Cuenta conectada', value:''}]},
    {id:6, nombre:'Google Ads', categoria:'Pauta digital', icono:'🎯', conectado:true, campos:[{label:'Customer ID', value:'123-456-7890'}]},
    {id:7, nombre:'Meta Ads', categoria:'Pauta digital', icono:'📣', conectado:true, campos:[{label:'Ad Account ID', value:'act_9982••••'}]}
  ],
  usuarios: [
    {id:1, nombre:'Linda Pérez', correo:'linda@ccgrupo.com', rol:'Administrador', estado:'Activo'},
    {id:2, nombre:'Katherine Silva', correo:'katherine@ccgrupo.com', rol:'Asesor', estado:'Activo'},
    {id:3, nombre:'Sarah Chen', correo:'sarah@ccgrupo.com', rol:'Supervisor', estado:'Activo'}
  ],
  salud: [
    {id:1, afiliado:'Coronel Rafael Ureña', servicio:'Consulta medicina general', fecha:'2026-08-12', hora:'09:00', lugar:'Clínica convenio Santo Domingo', estado:'Confirmada'},
    {id:2, afiliado:'Sargento Mayor Ana Ventura', servicio:'Control cardiológico', fecha:'2026-08-13', hora:'11:30', lugar:'Centro médico Kennedy', estado:'Pendiente'},
    {id:3, afiliado:'Capitán Pedro Julián', servicio:'Terapia física', fecha:'2026-08-14', hora:'15:00', lugar:'Clínica convenio Santo Domingo', estado:'Confirmada'},
    {id:4, afiliado:'Raso Miguel Santana', servicio:'Consulta psicológica (CODOPSI)', fecha:'2026-08-15', hora:'10:00', lugar:'Sede Hermandad, Av. JFK', estado:'Pendiente'}
  ],
  cooperativa: [
    {id:1, afiliado:'Coronel Rafael Ureña', tipoAporte:'Aporte mensual', monto:2500, fecha:'2026-08-01', estado:'Al día'},
    {id:2, afiliado:'Sargento Mayor Ana Ventura', tipoAporte:'Certificado de ahorro', monto:15000, fecha:'2026-07-20', estado:'Al día'},
    {id:3, afiliado:'Capitán Pedro Julián', tipoAporte:'Aporte mensual', monto:2500, fecha:'2026-07-01', estado:'En mora'},
    {id:4, afiliado:'Raso Miguel Santana', tipoAporte:'Préstamo cooperativo (COOPERA)', monto:45000, fecha:'2026-06-15', estado:'Al día'}
  ],
  voluntariado: [
    {id:1, nombre:'Elena Reyes', area:'Salud y bienestar', horas:32, proxima:'2026-08-16 · Jornada médica', estado:'Activo'},
    {id:2, nombre:'José Manuel Cabrera', area:'Logística de eventos', horas:18, proxima:'2026-08-20 · Entrega de ayudas', estado:'Activo'},
    {id:3, nombre:'Carmen Julia Féliz', area:'Apoyo administrativo', horas:9, proxima:'—', estado:'En pausa'}
  ],
  buro: {
    1:{estado:'Consultado', riesgo:'Bajo', score:88, fecha:'2026-08-08', obligaciones:'1 tarjeta de crédito al día, sin otros créditos activos.', alertas:'Sin hallazgos relevantes.', conclusion:'Perfil de bajo riesgo. Se recomienda continuar con la precalificación.'},
    2:{estado:'Consultado', riesgo:'Medio', score:62, fecha:'2026-08-09', obligaciones:'1 préstamo cooperativo vigente, pagos regulares.', alertas:'Nivel de endeudamiento moderado.', conclusion:'Riesgo moderado. Puede continuar con precalificación bajo condiciones.'},
    3:{estado:'Consultado', riesgo:'Medio', score:60, fecha:'2026-08-10', obligaciones:'Sin obligaciones vigentes registradas.', alertas:'Historial crediticio limitado.', conclusion:'Riesgo moderado. Puede continuar con precalificación bajo condiciones.'},
    4:{estado:'Sin consultar'},
    5:{estado:'Sin consultar'},
    6:{estado:'Sin consultar'},
    7:{estado:'Consultado', riesgo:'Alto', score:34, fecha:'2026-08-05', obligaciones:'2 obligaciones vigentes con atrasos reportados.', alertas:'Se detectaron atrasos en los últimos 6 meses.', conclusion:'Riesgo alto. Se recomienda revisión adicional antes de continuar.'}
  },
  precalificacion: {
    1:{resultado:'Aprobar', riesgo:'Bajo', capacidad:'Alta', plazo:24, montoSugerido:14700000, ingresos:1837500, obligaciones:'1 tarjeta de crédito al día.', observaciones:'Ingreso estable por pensión, sin obligaciones que comprometan la capacidad de pago.'},
    2:{resultado:'Aprobar con condiciones', riesgo:'Medio', capacidad:'Media', plazo:18, montoSugerido:5040000, ingresos:787500, obligaciones:'1 préstamo cooperativo vigente.', observaciones:'Capacidad adecuada; se sugiere validar comprobante de pensión actualizado.'},
    7:{resultado:'Rechazar', riesgo:'Alto', capacidad:'Baja', plazo:12, montoSugerido:1000000, ingresos:250000, obligaciones:'2 obligaciones vigentes con atrasos reportados.', observaciones:'Atrasos recientes reportados en buró; no cumple el perfil de riesgo esperado.'}
  },
  cobranza: [
    {id:1, clienteId:1, solicitante:'Cnel. Rafael Ureña', credito:'CR-2026-001', saldo:12800000, proxVencimiento:'2026-09-05', estado:'Al día', historial:[{fecha:'2026-08-05',texto:'Pago recibido a tiempo.'}], promesa:null, proximaGestion:'2026-09-01 · Recordatorio automático de pago'},
    {id:2, clienteId:null, solicitante:'Tte. Martha Cabrera', credito:'CR-2025-014', saldo:4200000, proxVencimiento:'2026-08-20', estado:'Próximo a vencer', historial:[{fecha:'2026-08-01',texto:'Recordatorio de pago enviado por SMS.'}], promesa:null, proximaGestion:'2026-08-18 · Llamada de confirmación de pago'},
    {id:3, clienteId:null, solicitante:'Sgto. Luis Fernández', credito:'CR-2025-009', saldo:6300000, proxVencimiento:'2026-07-15', estado:'Vencido', historial:[{fecha:'2026-07-20',texto:'Llamada realizada, sin respuesta.'}], promesa:null, proximaGestion:'2026-08-12 · Segunda llamada de cobranza'},
    {id:4, clienteId:null, solicitante:'Rosa Almonte', credito:'CR-2025-003', saldo:4000000, proxVencimiento:'2026-06-01', estado:'En mora', historial:[{fecha:'2026-07-02',texto:'Cliente se compromete a pagar el 15 de agosto.'}], promesa:'2026-08-15 · RD$15,000', proximaGestion:'2026-08-15 · Seguimiento a promesa de pago'},
    {id:5, clienteId:null, solicitante:'Julio César Paulino', credito:'CR-2025-002', saldo:2000000, proxVencimiento:'2026-05-10', estado:'Vencido', historial:[{fecha:'2026-06-10',texto:'Visita de cobranza realizada, sin acuerdo.'}], promesa:null, proximaGestion:'2026-08-14 · Visita de cobranza de seguimiento'}
  ]
};
let avaConectado = false;
let fichaActualId = null;
let autoSeleccionada = 'nurturing';
let nodoSeleccionado = null;
let gestionFiltro = 'Todos';
let selectedConversationId = 1;

/* ============================= TOAST ============================= */
function showToast(msg){
  const wrap = document.getElementById('toastWrap');
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = '&#10003; ' + msg;
  wrap.appendChild(t);
  setTimeout(function(){ t.style.opacity='0'; t.style.transition='opacity .3s'; setTimeout(function(){ t.remove(); },300); }, 2600);
}

/* ============================= IMPORTAR / EXPORTAR CSV ============================= */
function downloadCSV(filename, headers, rows){
  const escape = function(v){ v = String(v===undefined||v===null?'':v); return '"'+v.replace(/"/g,'""')+'"'; };
  const lines = [headers.map(escape).join(',')].concat(rows.map(function(r){ return r.map(escape).join(','); }));
  const csv = lines.join('\r\n');
  const blob = new Blob(['\ufeff'+csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function parseCSV(text){
  const lines = text.split(/\r?\n/).filter(function(l){ return l.trim().length; });
  if(!lines.length) return {headers:[], rows:[]};
  function parseLine(line){
    const out = []; let cur=''; let inQ=false;
    for(let i=0;i<line.length;i++){
      const ch = line[i];
      if(inQ){
        if(ch==='"'){ if(line[i+1]==='"'){ cur+='"'; i++; } else inQ=false; }
        else cur+=ch;
      } else {
        if(ch==='"') inQ=true;
        else if(ch===','){ out.push(cur); cur=''; }
        else cur+=ch;
      }
    }
    out.push(cur);
    return out;
  }
  const headers = parseLine(lines[0]).map(function(h){ return h.trim(); });
  const rows = lines.slice(1).map(parseLine);
  return {headers:headers, rows:rows};
}
function exportEmpresasCSV(){
  downloadCSV('empresas.csv', ['Nombre','NIT','Sector','Ciudad'], state.empresas.map(function(e){ return [e.nombre,e.nit,e.sector,e.ciudad]; }));
  showToast('Empresas exportadas a CSV');
}
function importEmpresasCSV(file){
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(ev){
    const parsed = parseCSV(ev.target.result);
    let count = 0;
    parsed.rows.forEach(function(r){
      if(!r[0]) return;
      state.empresas.push({id:uid(), nombre:r[0]||'', nit:r[1]||'', sector:r[2]||'', ciudad:r[3]||'', enriquecido:false, actividad:[]});
      count++;
    });
    renderAll();
    showToast(count+' empresa(s) importadas desde CSV');
  };
  reader.readAsText(file);
}
function exportClientesCSV(){
  downloadCSV('contactos.csv', ['Empresa','Contacto','Correo','Teléfono','Estado','Etapa','Valor COP','Canal'],
    state.clientes.map(function(c){ return [c.empresa,c.contacto,c.email,c.telefono,c.estado,c.etapa,c.valor,c.canal]; }));
  showToast('Contactos exportados a CSV');
}
function importClientesCSV(file){
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(ev){
    const parsed = parseCSV(ev.target.result);
    let count = 0;
    parsed.rows.forEach(function(r){
      if(!r[0]) return;
      state.clientes.push({
        id:uid(), empresa:r[0]||'', empresaId:null, contacto:r[1]||'', email:r[2]||'', telefono:r[3]||'',
        estado:r[4]||'Prospecto', etapa:r[5]||'Prospecto', valor:Number(r[6])||0, probabilidad:20, canal:r[7]||'Ads',
        notas:[], actividad:[{fecha:nowLabel(), texto:'Contacto importado desde CSV.'}]
      });
      count++;
    });
    renderAll();
    showToast(count+' contacto(s) importados desde CSV');
  };
  reader.readAsText(file);
}
function exportGestionesCSV(){
  downloadCSV('gestiones.csv', ['Fecha','Empresa','Contacto','Estado','Producto','Canal','Próx. fecha','Asesor','Detalle'],
    state.gestiones.map(function(g){ return [g.fecha,g.empresa,g.contacto,g.estado,g.producto,g.canal,g.proxFecha,g.asesor,g.detalle]; }));
  showToast('Gestiones exportadas a CSV');
}
function exportLeadsCSV(){
  downloadCSV('leads_ads.csv', ['Empresa','Contacto','Campaña','Plataforma','Fecha','Convertido'],
    state.leadsEntrantes.map(function(l){ return [l.empresa,l.contacto,l.campana,l.plataforma,l.fecha,l.convertido?'Sí':'No']; }));
  showToast('Clientes potenciales exportados a CSV');
}

/* ============================= NAVEGACIÓN / MÓVIL ============================= */
function moveModuleContent(sourceId,targetId){
  const source=document.getElementById(sourceId), target=document.getElementById(targetId);
  if(!source||!target) return;
  while(source.firstChild) target.appendChild(source.firstChild);
  source.remove();
}
function consolidateModules(){
  moveModuleContent('page-metas','dashboardGoals');
  moveModuleContent('page-correo','marketing-pane-correo');
  moveModuleContent('page-sms','marketing-pane-campanas');
  moveModuleContent('page-gestion','gestiones-pane-historial');
}
function focusGoals(){const el=document.getElementById('dashboardGoals');if(el)el.scrollIntoView({behavior:'smooth',block:'start'});}
function switchMarketingTab(tab,button){
  ['avachat','correo','campanas'].forEach(function(t){ document.getElementById('marketing-pane-'+t).classList.toggle('hidden',t!==tab); });
  document.querySelectorAll('#page-marketing .marketing-tabs .marketing-tab').forEach(function(b){b.classList.remove('active');});
  if(button) button.classList.add('active');
}
function switchGestionesTab(tab,button){
  ['tareas','historial'].forEach(function(t){ document.getElementById('gestiones-pane-'+t).classList.toggle('hidden',t!==tab); });
  document.querySelectorAll('#page-gestiones .page-tools .marketing-tab').forEach(function(b){b.classList.remove('active');});
  if(button) button.classList.add('active');
}
function navigate(page){
  document.querySelectorAll('.page').forEach(function(p){ p.classList.add('hidden'); });
  document.getElementById('page-'+page).classList.remove('hidden');
  document.querySelectorAll('.nav-item').forEach(function(n){ n.classList.remove('active'); });
  const navBtn = document.querySelector('.nav-item[data-page="'+page+'"]');
  if(navBtn) navBtn.classList.add('active');
  const titles = {dashboard:'Panel institucional', pipeline:'Prospectos / Leads', agenda:'Agenda', empresas:'Convenios e Instituciones Aliadas', clientes:'Solicitudes de Crédito', gestiones:'Gestiones', cotizaciones:'Créditos', productos:'Beneficios y Programas', marketing:'AVA', reportes:'Reportes', ads:'Clientes ADS', automatizaciones:'Automatizaciones', apis:'APIs', config:'Configuración', salud:'Salud', cooperativa:'Cooperativa', voluntariado:'Voluntariado', buro:'Buró de Crédito', precalificacion:'Precalificación', cobranza:'Cobranza / Cartera'};
  document.getElementById('page-title').textContent = titles[page];
  renderAll();
  if(typeof window!=='undefined' && window.innerWidth && window.innerWidth<900) toggleSidebar(false);
}
function toggleSidebar(force){
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('sidebarOverlay');
  const open = typeof force==='boolean' ? force : !sb.classList.contains('open');
  sb.classList.toggle('open', open);
  ov.classList.toggle('open', open);
}

function openModal(id){ document.getElementById(id).classList.add('open'); }
function closeModal(id){ document.getElementById(id).classList.remove('open'); }
document.addEventListener('click', function(e){
  if(e.target.classList && e.target.classList.contains('modal')) e.target.classList.remove('open');
});

/* ============================= RENDER GENERAL ============================= */
function renderAll(){
  renderKpis();
  renderChartLeadsDia();
  renderChartCanales();
  renderChartFunnel();
  renderChartRevenue();
  renderInsights();
  renderKanban();
  renderEmpresasTable();
  renderClientesTable();
  renderGestionTable();
  renderFilterPills();
  renderAdsGrid();
  renderLeadsList();
  renderAutoList();
  renderFlow();
  renderPlantillas();
  renderCampanas();
  renderCalendar();
  renderEventos();
  renderCorreoRecibidos();
  renderCorreoEnviados();
  renderApisGrid();
  renderUsuariosTable();
  renderReportes();
  renderDashboardStrategies();
  renderInbox();
  renderTasks();
  renderFollowupAlerts();
  renderProducts();
  renderQuotes();
  renderGoals();
  fillEmpresaSelect();
  fillClienteSelects();
  renderSalud();
  renderCooperativa();
  renderVoluntariado();
  renderBuro();
  renderPrecalificacion();
  renderCobranza();
}

/* ============================= BURÓ DE CRÉDITO (demo simulado) ============================= */
function riesgoColor(r){ return r==='Alto'?'pill-bad':r==='Medio'?'pill-warning':'pill-success'; }
function renderBuro(){
  const body = document.getElementById('buroTable');
  if(!body) return;
  const q = (document.getElementById('searchBuro')||{}).value || '';
  const rows = state.clientes.filter(function(c){ return (c.contacto+c.empresa).toLowerCase().indexOf(q.toLowerCase())>-1; });
  body.innerHTML = rows.map(function(c){
    const b = state.buro[c.id] || {estado:'Sin consultar'};
    const accion = b.estado==='Consultado' ? '<button class="btn btn-ghost btn-small" onclick="event.stopPropagation();verResumenBuro('+c.id+')">Ver resumen</button>' : (b.estado==='Consultando...' ? '<span class="text-muted">Consultando…</span>' : '<button class="btn btn-primary btn-small" onclick="event.stopPropagation();consultarBuro('+c.id+')">Consultar buró</button>');
    const riesgo = b.riesgo ? '<span class="pill '+riesgoColor(b.riesgo)+'">'+b.riesgo+'</span>' : '<span class="text-muted">—</span>';
    return '<tr onclick="abrirSolicitanteBuro('+c.id+')"><td data-label="Solicitante">'+esc(c.contacto)+'</td><td data-label="Institución">'+esc(c.empresa)+'</td><td data-label="Fecha de consulta">'+(b.fecha||'—')+'</td><td data-label="Riesgo">'+riesgo+'</td><td data-label="Estado">'+pill(b.estado)+'</td><td data-label="Acción">'+accion+'</td></tr>';
  }).join('') || '<tr class="no-click"><td colspan="6" class="empty-state">Sin solicitudes registradas</td></tr>';
}
function abrirSolicitanteBuro(clienteId){
  const c = state.clientes.find(function(x){ return x.id===clienteId; }); if(!c) return;
  const b = state.buro[clienteId] || {estado:'Sin consultar'};
  showDetalle('Solicitante — '+c.contacto, [
    ['Institución / cuerpo', c.empresa],
    ['Monto solicitado', formatMoney(c.valor)],
    ['Etapa del proceso', c.etapa],
    ['Estado de consulta de buró', b.estado],
    ['Score de buró (simulado)', b.score!=null ? b.score+'/100' : 'Pendiente de consulta'],
    ['Nivel de riesgo', b.riesgo || 'Pendiente de consulta'],
    ['Resumen de obligaciones', b.obligaciones || 'Aún no se ha consultado el buró para este solicitante.']
  ]);
}
function consultarBuro(clienteId){
  state.buro[clienteId] = {estado:'Consultando...'};
  renderAll();
  setTimeout(function(){
    const seed = clienteId % 3;
    const riesgo = seed===0?'Bajo':seed===1?'Medio':'Alto';
    const score = riesgo==='Bajo'?88:riesgo==='Medio'?62:34;
    const conclusion = riesgo==='Bajo' ? 'Perfil de bajo riesgo. Se recomienda continuar con la precalificación.' : riesgo==='Medio' ? 'Riesgo moderado. Puede continuar con precalificación bajo condiciones.' : 'Riesgo alto. Se recomienda revisión adicional antes de continuar.';
    state.buro[clienteId] = {estado:'Consultado', riesgo:riesgo, score:score, fecha:todayISO(), obligaciones:'Resumen simulado de obligaciones vigentes ante el sistema financiero.', alertas: riesgo==='Alto' ? 'Se detectaron atrasos recientes.' : 'Sin hallazgos relevantes.', conclusion:conclusion};
    renderAll();
    showToast('Consulta de buró (simulada) completada');
  }, 900);
}
function verResumenBuro(clienteId){
  const c = state.clientes.find(function(x){ return x.id===clienteId; }); if(!c) return;
  const b = state.buro[clienteId] || {};
  showDetalle('Buró de crédito (simulado) — '+c.contacto, [['Fecha de consulta',b.fecha||'—'],['Score de buró (simulado)', b.score!=null?b.score+'/100':'—'],['Nivel de riesgo',b.riesgo||'—'],['Obligaciones / resumen',b.obligaciones||'—'],['Alertas / hallazgos',b.alertas||'Sin hallazgos'],['Conclusión',b.conclusion||'—'],['Nota','Resultado simulado — sin integración real de buró en este demo.']]);
}

/* ============================= PRECALIFICACIÓN (demo simulado) ============================= */
function renderPrecalificacion(){
  const body = document.getElementById('precalificacionTable');
  if(!body) return;
  const q = (document.getElementById('searchPrecalificacion')||{}).value || '';
  const rows = state.clientes.filter(function(c){ return (c.contacto+c.empresa).toLowerCase().indexOf(q.toLowerCase())>-1; });
  body.innerHTML = rows.map(function(c){
    const p = state.precalificacion[c.id];
    const accion = p ? '<button class="btn btn-ghost btn-small" onclick="event.stopPropagation();verDetallePrecalificacion('+c.id+')">Ver detalle</button>' : '<button class="btn btn-primary btn-small" onclick="event.stopPropagation();precalificar('+c.id+')">Precalificar</button>';
    const resultado = p ? '<span class="pill '+(p.resultado==='Rechazar'?'pill-bad':p.resultado==='Aprobar'?'pill-success':'pill-warning')+'">'+p.resultado+'</span>' : '<span class="text-muted">Pendiente</span>';
    return '<tr onclick="abrirSolicitudPrecalificacion('+c.id+')"><td data-label="Solicitante">'+esc(c.contacto)+'</td><td data-label="Monto solicitado">'+formatMoney(c.valor)+'</td><td data-label="Capacidad">'+(p?p.capacidad:'—')+'</td><td data-label="Resultado">'+resultado+'</td><td data-label="Riesgo">'+(p?('<span class="pill '+riesgoColor(p.riesgo)+'">'+p.riesgo+'</span>'):'—')+'</td><td data-label="Acción">'+accion+'</td></tr>';
  }).join('') || '<tr class="no-click"><td colspan="6" class="empty-state">Sin solicitudes registradas</td></tr>';
}
function precalificar(clienteId){
  const c = state.clientes.find(function(x){ return x.id===clienteId; }); if(!c) return;
  const b = state.buro[clienteId];
  const riesgo = (b&&b.riesgo) || (c.probabilidad>=60?'Bajo':c.probabilidad>=35?'Medio':'Alto');
  const resultado = riesgo==='Alto' ? 'Rechazar' : (riesgo==='Medio' ? 'Aprobar con condiciones' : 'Aprobar');
  const capacidad = riesgo==='Alto'?'Baja':riesgo==='Medio'?'Media':'Alta';
  const plazo = riesgo==='Alto'?12:riesgo==='Medio'?18:24;
  const montoSugerido = riesgo==='Alto' ? Math.round(c.valor*0.5) : (riesgo==='Medio' ? Math.round(c.valor*0.8) : c.valor);
  const ingresos = Math.round(c.valor/8);
  const obligaciones = (b&&b.obligaciones) || 'Sin obligaciones vigentes registradas.';
  state.precalificacion[clienteId] = {resultado:resultado, riesgo:riesgo, capacidad:capacidad, plazo:plazo, montoSugerido:montoSugerido, ingresos:ingresos, obligaciones:obligaciones, observaciones:'Resultado simulado a partir de datos de la solicitud y del buró (cuando disponible). No representa una fórmula financiera real.'};
  renderAll();
  showToast('Precalificación (simulada) generada para '+c.contacto);
}
function abrirSolicitudPrecalificacion(clienteId){
  const c = state.clientes.find(function(x){ return x.id===clienteId; }); if(!c) return;
  const p = state.precalificacion[clienteId];
  if(!p){ showDetalle('Solicitud — '+c.contacto, [['Monto solicitado',formatMoney(c.valor)],['Etapa del proceso',c.etapa],['Estado de precalificación','Pendiente — aún no se ha ejecutado la precalificación.']]); return; }
  verDetallePrecalificacion(clienteId);
}
function verDetallePrecalificacion(clienteId){
  const c = state.clientes.find(function(x){ return x.id===clienteId; }); if(!c) return;
  const p = state.precalificacion[clienteId]; if(!p) return;
  showDetalle('Precalificación (simulada) — '+c.contacto, [['Monto solicitado',formatMoney(c.valor)],['Ingresos mensuales estimados',formatMoney(p.ingresos)],['Obligaciones vigentes',p.obligaciones],['Plazo sugerido',p.plazo+' meses'],['Capacidad de pago estimada',p.capacidad],['Nivel de riesgo',p.riesgo],['Monto sugerido',formatMoney(p.montoSugerido)],['Estado de precalificación',p.resultado],['Observaciones',p.observaciones],['Siguiente paso', p.resultado==='Rechazar' ? 'Notificar al solicitante' : 'Enviar a gestión / aprobación']]);
}

/* ============================= COBRANZA / CARTERA (demo simulado) ============================= */
function renderCobranza(){
  const strip = document.getElementById('cobranzaKpis');
  if(strip){
    const total = state.cobranza.reduce(function(s,x){ return s+Number(x.saldo); },0);
    const activos = state.cobranza.length;
    const alDia = state.cobranza.filter(function(x){ return x.estado==='Al día'; }).length;
    const proximos = state.cobranza.filter(function(x){ return x.estado==='Próximo a vencer'; }).length;
    const enMora = state.cobranza.filter(function(x){ return x.estado==='Vencido'||x.estado==='En mora'; });
    const montoMora = enMora.reduce(function(s,x){ return s+Number(x.saldo); },0);
    strip.innerHTML = '<div class="metric-cell"><span>Cartera total</span><strong>'+formatMoney(total)+'</strong></div><div class="metric-cell"><span>Créditos activos</span><strong>'+activos+'</strong></div><div class="metric-cell"><span>Al día / próx. vencimiento</span><strong>'+alDia+' / '+proximos+'</strong></div><div class="metric-cell"><span>Monto en mora ('+enMora.length+')</span><strong>'+formatMoney(montoMora)+'</strong></div>';
  }
  const body = document.getElementById('cobranzaTable');
  if(!body) return;
  const q = (document.getElementById('searchCobranza')||{}).value || '';
  const rows = state.cobranza.filter(function(x){ return (x.solicitante+x.credito).toLowerCase().indexOf(q.toLowerCase())>-1; });
  const estadoPill = function(e){ return e==='Al día'?'pill-success':e==='Próximo a vencer'?'pill-warning':'pill-bad'; };
  body.innerHTML = rows.map(function(x){
    const dias = diasMora(x.proxVencimiento);
    const moraLabel = (x.estado==='Vencido'||x.estado==='En mora') ? '<div class="text-muted" style="font-size:10.5px;margin-top:2px">'+dias+' días de mora</div>' : '';
    return '<tr onclick="verGestionCobranza('+x.id+')"><td data-label="Cliente">'+esc(x.solicitante)+'</td><td data-label="Crédito">'+esc(x.credito)+'</td><td data-label="Saldo">'+formatMoney(x.saldo)+'</td><td data-label="Próx. vencimiento">'+x.proxVencimiento+moraLabel+'</td><td data-label="Estado"><span class="pill '+estadoPill(x.estado)+'">'+x.estado+'</span></td><td data-label="Acción"><button class="btn btn-ghost btn-small" onclick="event.stopPropagation();verGestionCobranza('+x.id+')">Ver gestión</button></td></tr>';
  }).join('') || '<tr class="no-click"><td colspan="6" class="empty-state">Sin cuentas registradas</td></tr>';
}
function diasMora(fechaVencimiento){
  const hoy = new Date(todayISO());
  const venc = new Date(fechaVencimiento);
  const diff = Math.round((hoy-venc)/86400000);
  return diff>0 ? diff : 0;
}
function verGestionCobranza(id){
  const x = state.cobranza.find(function(y){ return y.id===id; }); if(!x) return;
  const hist = (x.historial||[]).map(function(h){ return h.fecha+' — '+h.texto; }).join('<br>') || 'Sin contactos registrados';
  const dias = diasMora(x.proxVencimiento);
  showDetalle('Cobranza — '+x.solicitante, [['Crédito',x.credito],['Saldo pendiente',formatMoney(x.saldo)],['Próximo vencimiento',x.proxVencimiento],['Días de mora', (x.estado==='Vencido'||x.estado==='En mora') ? dias+' días' : 'Sin mora'],['Estado de cartera',x.estado],['Historial de contacto / gestión',hist],['Promesa de pago',x.promesa||'Sin acuerdo registrado'],['Próxima gestión',x.proximaGestion||'Sin próxima gestión programada']]);
}
function registrarPromesaPago(){ showToast('Registro de promesas de pago disponible en la versión completa'); }

/* ============================= SALUD / COOPERATIVA / VOLUNTARIADO (demo) ============================= */
function showDetalle(titulo, filas){
  const t = document.getElementById('detalleTitulo'); if(t) t.textContent = titulo;
  const b = document.getElementById('detalleBody');
  if(b) b.innerHTML = filas.map(function(f){ return '<div class="form-group"><label>'+esc(f[0])+'</label><div class="surface-2" style="padding:10px 12px">'+esc(f[1])+'</div></div>'; }).join('');
  openModal('modal-detalle');
}
function renderSalud(){
  const body = document.getElementById('saludTable');
  if(!body) return;
  const q = (document.getElementById('searchSalud')||{}).value || '';
  const rows = state.salud.filter(function(s){ return (s.afiliado+s.servicio).toLowerCase().indexOf(q.toLowerCase())>-1; });
  body.innerHTML = rows.map(function(s){
    return '<tr><td>'+esc(s.afiliado)+'</td><td>'+esc(s.servicio)+'</td><td>'+esc(s.fecha)+' · '+esc(s.hora)+'</td><td>'+esc(s.lugar)+'</td><td>'+pill(s.estado)+'</td><td><button class="btn btn-ghost btn-small" onclick="verDetalleSalud('+s.id+')">Ver detalle</button></td></tr>';
  }).join('') || '<tr><td colspan="6" class="empty-state">Sin citas registradas</td></tr>';
}
function verDetalleSalud(id){
  const s = state.salud.find(function(x){ return x.id===id; }); if(!s) return;
  showDetalle('Cita de salud — '+s.afiliado, [['Servicio',s.servicio],['Fecha',s.fecha],['Hora',s.hora],['Lugar',s.lugar],['Estado',s.estado]]);
}
function nuevaCitaSalud(){ showToast('Registro de citas disponible en la versión completa'); }
function renderCooperativa(){
  const body = document.getElementById('cooperativaTable');
  if(!body) return;
  const q = (document.getElementById('searchCooperativa')||{}).value || '';
  const rows = state.cooperativa.filter(function(c){ return (c.afiliado+c.tipoAporte).toLowerCase().indexOf(q.toLowerCase())>-1; });
  body.innerHTML = rows.map(function(c){
    return '<tr><td>'+esc(c.afiliado)+'</td><td>'+esc(c.tipoAporte)+'</td><td>RD$'+Number(c.monto).toLocaleString('es-DO')+'</td><td>'+esc(c.fecha)+'</td><td>'+pill(c.estado)+'</td><td><button class="btn btn-ghost btn-small" onclick="verDetalleCooperativa('+c.id+')">Ver detalle</button></td></tr>';
  }).join('') || '<tr><td colspan="6" class="empty-state">Sin movimientos registrados</td></tr>';
}
function verDetalleCooperativa(id){
  const c = state.cooperativa.find(function(x){ return x.id===id; }); if(!c) return;
  showDetalle('Movimiento cooperativa — '+c.afiliado, [['Tipo de aporte',c.tipoAporte],['Monto','RD$'+Number(c.monto).toLocaleString('es-DO')],['Fecha',c.fecha],['Estado',c.estado]]);
}
function nuevoMovimientoCooperativa(){ showToast('Registro de aportes disponible en la versión completa'); }
function renderVoluntariado(){
  const body = document.getElementById('voluntariadoTable');
  if(!body) return;
  const q = (document.getElementById('searchVoluntariado')||{}).value || '';
  const rows = state.voluntariado.filter(function(v){ return (v.nombre+v.area).toLowerCase().indexOf(q.toLowerCase())>-1; });
  body.innerHTML = rows.map(function(v){
    return '<tr><td>'+esc(v.nombre)+'</td><td>'+esc(v.area)+'</td><td>'+v.horas+' h</td><td>'+esc(v.proxima)+'</td><td>'+pill(v.estado)+'</td><td><button class="btn btn-ghost btn-small" onclick="verDetalleVoluntariado('+v.id+')">Ver detalle</button></td></tr>';
  }).join('') || '<tr><td colspan="6" class="empty-state">Sin voluntarios registrados</td></tr>';
}
function verDetalleVoluntariado(id){
  const v = state.voluntariado.find(function(x){ return x.id===id; }); if(!v) return;
  showDetalle('Voluntario — '+v.nombre, [['Área',v.area],['Horas acumuladas',v.horas+' h'],['Próxima actividad',v.proxima],['Estado',v.estado]]);
}
function nuevoVoluntario(){ showToast('Registro de voluntarios disponible en la versión completa'); }

/* ============================= REPORTES ============================= */
function renderReportes(){
  const repAsesoresEl = document.getElementById('repAsesores');
  if(!repAsesoresEl) return;
  const porAsesor = {};
  state.gestiones.forEach(function(g){
    if(!porAsesor[g.asesor]) porAsesor[g.asesor] = {total:0, cerradas:0};
    porAsesor[g.asesor].total++;
    if(g.estado==='Cerrado') porAsesor[g.asesor].cerradas++;
  });
  repAsesoresEl.innerHTML = Object.keys(porAsesor).map(function(a){
    return '<tr class="no-click"><td style="font-weight:700">'+a+'</td><td>'+porAsesor[a].total+'</td><td>'+porAsesor[a].cerradas+'</td></tr>';
  }).join('') || '<tr><td colspan="3" class="empty-state">Sin gestiones registradas</td></tr>';

  document.getElementById('repPipeline').innerHTML = ETAPAS.map(function(et){
    const items = state.clientes.filter(function(c){ return c.etapa===et; });
    const sum = items.reduce(function(s,c){ return s+Number(c.valor); },0);
    return '<tr class="no-click"><td style="font-weight:700">'+et+'</td><td>'+items.length+'</td><td>'+formatMoney(sum)+'</td></tr>';
  }).join('');

  const porEstado = {};
  state.gestiones.forEach(function(g){ porEstado[g.estado] = (porEstado[g.estado]||0)+1; });
  document.getElementById('repGestionEstado').innerHTML = Object.keys(porEstado).map(function(e){
    return '<tr class="no-click"><td style="font-weight:700">'+e+'</td><td>'+porEstado[e]+'</td></tr>';
  }).join('') || '<tr><td colspan="2" class="empty-state">Sin gestiones registradas</td></tr>';

  const porCanal = {};
  state.clientes.forEach(function(c){ porCanal[c.canal] = (porCanal[c.canal]||0)+1; });
  const totalC = state.clientes.length || 1;
  document.getElementById('repCanales').innerHTML = Object.keys(porCanal).map(function(c){
    return '<tr class="no-click"><td style="font-weight:700">'+c+'</td><td>'+porCanal[c]+'</td><td>'+Math.round(porCanal[c]/totalC*100)+'%</td></tr>';
  }).join('');
  const advisorBars=document.getElementById('reportAdvisorBars');
  if(advisorBars) advisorBars.innerHTML=[['Katherine Silva',92,'#2f6fed'],['Sarah Chen',71,'#d92440'],['Carlos Méndez',56,'#17a673']].map(function(a){return '<div style="display:grid;grid-template-columns:115px 1fr 38px;gap:10px;align-items:center;margin:16px 0"><strong style="font-size:11.5px">'+a[0]+'</strong><div class="progress-track"><div class="progress-fill" style="width:'+a[1]+'%;background:'+a[2]+'"></div></div><strong>'+a[1]+'%</strong></div>';}).join('');
  const stageValues=ETAPAS.map(function(et){return state.clientes.filter(function(c){return c.etapa===et;}).reduce(function(s,c){return s+Number(c.valor);},0);});
  const stageMax=Math.max.apply(null,stageValues)||1;
  const stageBars=document.getElementById('reportStageBars');
  if(stageBars) stageBars.innerHTML=ETAPAS.map(function(et,i){return '<div class="mini-bar-group"><div class="mini-bar" title="'+et+': '+formatMoney(stageValues[i])+'" style="height:'+Math.max(8,Math.round(stageValues[i]/stageMax*100))+'%;background:'+(ETAPA_COLOR[et]||'#2f6fed')+'"></div><span class="mini-bar-label">'+et.slice(0,4)+'</span></div>';}).join('');
  let acc=0;const stops=Object.keys(porCanal).map(function(c){const pct=porCanal[c]/totalC*100;const start=acc;acc+=pct;return (CANAL_COLOR[c]||'#8a97ac')+' '+start.toFixed(1)+'% '+acc.toFixed(1)+'%';}).join(',');
  const donut=document.getElementById('reportChannelDonut'); if(donut) donut.style.background='conic-gradient('+stops+')';
  const legend=document.getElementById('reportChannelLegend'); if(legend) legend.innerHTML=Object.keys(porCanal).map(function(c){return '<div class="donut-legend-item"><span class="donut-dot" style="background:'+(CANAL_COLOR[c]||'#8a97ac')+'"></span>'+c+' <strong style="margin-left:auto">'+Math.round(porCanal[c]/totalC*100)+'%</strong></div>';}).join('');
  const avg=document.getElementById('reportAvgValue'); if(avg) avg.textContent=formatMoney(state.clientes.reduce(function(s,c){return s+Number(c.valor);},0)/(state.clientes.length||1));
}
function excelTable(title,headers,rows){return '<h2>'+title+'</h2><table border="1"><thead><tr>'+headers.map(function(h){return '<th>'+esc(h)+'</th>';}).join('')+'</tr></thead><tbody>'+rows.map(function(r){return '<tr>'+r.map(function(v){return '<td>'+esc(v)+'</td>';}).join('')+'</tr>';}).join('')+'</tbody></table>';}
function downloadExcel(filename,content){const html='<html><head><meta charset="UTF-8"></head><body>'+content+'</body></html>';const blob=new Blob(['\ufeff'+html],{type:'application/vnd.ms-excel;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);showToast('Informe preparado para Excel');}
function reportData(type){
  if(type==='asesores') return {title:'Productividad por gestor',headers:['Gestor','Gestiones','Cerradas','Cumplimiento'],rows:[['Katherine Silva',8,3,'92%'],['Sarah Chen',6,2,'71%'],['Carlos Méndez',5,1,'56%']]};
  if(type==='proceso') return {title:'Solicitudes por etapa del proceso',headers:['Etapa','Solicitudes','Monto total'],rows:ETAPAS.map(function(et){const items=state.clientes.filter(function(c){return c.etapa===et;});return [et,items.length,items.reduce(function(s,c){return s+Number(c.valor);},0)];})};
  const counts={};state.clientes.forEach(function(c){counts[c.canal]=(counts[c.canal]||0)+1;});return {title:'Canales de ingreso de solicitudes',headers:['Canal','Solicitudes','Participación'],rows:Object.keys(counts).map(function(c){return [c,counts[c],Math.round(counts[c]/state.clientes.length*100)+'%'];})};
}
function exportReportExcel(type){const d=reportData(type);downloadExcel('AVA_CRM_'+type+'.xls',excelTable(d.title,d.headers,d.rows));}
function exportAllReportsExcel(){const types=['asesores','proceso','canales'];let content='<h1>AVA CRM · Veteranos RD - Informe estratégico</h1><p>Periodo: '+document.getElementById('reportPeriod').value+'</p>';types.forEach(function(t){const d=reportData(t);content+=excelTable(d.title,d.headers,d.rows);});downloadExcel('AVA_CRM_Informe_Estrategico.xls',content);}
function exportReporteAsesores(){
  const porAsesor = {};
  state.gestiones.forEach(function(g){
    if(!porAsesor[g.asesor]) porAsesor[g.asesor] = {total:0, cerradas:0};
    porAsesor[g.asesor].total++;
    if(g.estado==='Cerrado') porAsesor[g.asesor].cerradas++;
  });
  downloadCSV('reporte_asesores.csv', ['Asesor','Gestiones','Cerradas'], Object.keys(porAsesor).map(function(a){ return [a,porAsesor[a].total,porAsesor[a].cerradas]; }));
  showToast('Reporte de asesores exportado');
}
function exportReportePipeline(){
  downloadCSV('reporte_pipeline.csv', ['Etapa','Oportunidades','Valor total COP'], ETAPAS.map(function(et){
    const items = state.clientes.filter(function(c){ return c.etapa===et; });
    return [et, items.length, items.reduce(function(s,c){ return s+Number(c.valor); },0)];
  }));
  showToast('Reporte del proceso comercial exportado');
}
function exportReporteGestionEstado(){
  const porEstado = {};
  state.gestiones.forEach(function(g){ porEstado[g.estado] = (porEstado[g.estado]||0)+1; });
  downloadCSV('reporte_gestiones_estado.csv', ['Estado','Cantidad'], Object.keys(porEstado).map(function(e){ return [e,porEstado[e]]; }));
  showToast('Reporte de gestiones exportado');
}
function exportReporteCanales(){
  const porCanal = {};
  state.clientes.forEach(function(c){ porCanal[c.canal] = (porCanal[c.canal]||0)+1; });
  downloadCSV('reporte_canales.csv', ['Canal','Contactos'], Object.keys(porCanal).map(function(c){ return [c,porCanal[c]]; }));
  showToast('Reporte de canales exportado');
}

function pill(estado){
  const map = {Activo:'pill-success', Prospecto:'pill-warning', Inactivo:'pill-bad'};
  return '<span class="pill '+(map[estado]||'pill-info')+'">'+estado+'</span>';
}

/* ============================= ANALÍTICA EJECUTIVA ============================= */
function renderKpis(){
  const aprobados = state.clientes.filter(function(c){ return c.etapa==='Aprobada'; }).length;
  const enProceso = state.clientes.filter(function(c){ return c.etapa!=='Aprobada'; }).length;
  const carteraActiva = state.clientes.filter(function(c){ return c.etapa==='Aprobada'; }).reduce(function(s,c){ return s+Number(c.valor); },0);
  const total = state.clientes.length;
  const scorePromedio = total ? Math.round(state.clientes.reduce(function(s,c){ return s+getAVAScore(c).score; },0)/total) : 0;
  const pendientes = state.tasks.filter(function(t){ return t.estado!=='Completada'; }).length;
  const enMora = state.cobranza ? state.cobranza.filter(function(x){ return x.estado==='Vencido'||x.estado==='En mora'; }).length : 0;
  const objetivo = 360000000;
  const colocado = carteraActiva;
  const pronostico = state.clientes.filter(function(c){ return c.etapa!=='Aprobada'; }).reduce(function(s,c){ return s+(c.valor*c.probabilidad/100); },0);
  document.getElementById('kpiGrid').innerHTML =
    '<div class="kpi-card" style="--kpi-accent:#17a673"><div class="kpi-label">Cartera activa</div><div class="kpi-value">'+formatMoney(carteraActiva)+'</div><div class="kpi-trend">'+aprobados+' créditos aprobados</div></div>'+
    '<div class="kpi-card" style="--kpi-accent:#2f6fed"><div class="kpi-label">Solicitudes en proceso</div><div class="kpi-value">'+enProceso+'</div><div class="kpi-trend">'+total+' solicitudes totales</div></div>'+
    '<div class="kpi-card" style="--kpi-accent:linear-gradient(90deg,#2f6fed,#d92440)"><div class="kpi-label">Puntuación promedio AVA</div><div class="kpi-value">'+scorePromedio+'/100</div><div class="kpi-trend">Precalificación automatizada</div></div>'+
    '<div class="kpi-card" style="--kpi-accent:#e0a324"><div class="kpi-label">Gestiones pendientes</div><div class="kpi-value">'+pendientes+'</div><div class="kpi-trend">Seguimientos de hoy</div></div>'+
    '<div class="kpi-card" style="--kpi-accent:#d92440"><div class="kpi-label">Créditos en mora</div><div class="kpi-value">'+enMora+'</div><div class="kpi-trend" style="color:var(--warn)">Cobranza requiere atención</div></div>'+
    '<div class="kpi-card" style="--kpi-accent:#4f8bff"><div class="kpi-label">Colocación del mes</div><div class="kpi-value">'+formatMoney(colocado)+'</div><div class="kpi-trend">Meta: '+formatMoney(objetivo)+'</div></div>';
  const ids = {dashSales:colocado,dashGoal:objetivo,dashForecast:pronostico};
  Object.keys(ids).forEach(function(id){ const el=document.getElementById(id); if(el) el.textContent=formatMoney(ids[id]); });
}
function renderDashboardStrategies(){
  const el=document.getElementById('dashboardStrategies'); if(!el) return;
  el.innerHTML='<div class="strategic-item"><div class="strategic-icon">1</div><div><strong>Prioriza tres solicitudes precalificadas</strong><span>Concentran el 62% del monto con alta probabilidad de aprobación.</span></div></div><div class="strategic-item"><div class="strategic-icon">2</div><div><strong>Consulta buró antes de 20 minutos</strong><span>Acelera el paso a precalificación en solicitudes nuevas.</span></div></div><div class="strategic-item"><div class="strategic-icon">3</div><div><strong>Da seguimiento a dos cuentas en mora hoy</strong><span>Las promesas de pago contactadas a tiempo se cumplen 1,8 veces más.</span></div></div>';
}
function renderChartLeadsDia(){
  const dias = ['L','M','X','J','V','S','H'];
  const valores = [8,11,9,14,12,15,18];
  const max = Math.max.apply(null, valores);
  document.getElementById('chartLeadsDia').innerHTML = dias.map(function(d,i){
    const h = Math.round(valores[i]/max*100);
    return '<div class="chart-bar-col"><div class="chart-bar" style="height:'+h+'%"></div><div class="chart-bar-label">'+d+'</div></div>';
  }).join('');
}
function renderChartRevenue(){
  const meses = ['O','N','D','E','F','M'];
  const valores = [18,21,20,26,29,33];
  const max = Math.max.apply(null, valores);
  document.getElementById('chartRevenue').innerHTML = meses.map(function(m,i){
    const h = Math.round(valores[i]/max*100);
    return '<div class="chart-bar-col"><div class="chart-bar" style="height:'+h+'%;background:linear-gradient(180deg,#6fddaf,#17a673)"></div><div class="chart-bar-label">'+m+'</div></div>';
  }).join('');
}
function renderChartCanales(){
  const counts = {};
  state.clientes.forEach(function(c){ counts[c.canal] = (counts[c.canal]||0)+1; });
  const canales = Object.keys(counts);
  const total = state.clientes.length || 1;
  let acc = 0;
  const stops = canales.map(function(c){
    const pct = counts[c]/total*100;
    const from = acc; acc += pct;
    return (CANAL_COLOR[c]||'#8a97ac')+' '+from.toFixed(1)+'% '+acc.toFixed(1)+'%';
  }).join(', ');
  const donutBg = canales.length ? 'conic-gradient('+stops+')' : '#e3e9f2';
  const legend = canales.map(function(c){
    const pct = Math.round(counts[c]/total*100);
    return '<div class="donut-legend-item"><span class="donut-dot" style="background:'+(CANAL_COLOR[c]||'#8a97ac')+'"></span>'+c+' <span style="margin-left:auto;font-weight:700">'+pct+'%</span></div>';
  }).join('');
  document.getElementById('chartCanales').innerHTML = '<div class="donut" style="background:'+donutBg+'"></div><div class="donut-legend">'+legend+'</div>';
}
function renderChartFunnel(){
  const total = state.clientes.length;
  const enRevision = state.clientes.filter(function(c){ return c.etapa!=='Nueva solicitud'; }).length;
  const buro = state.clientes.filter(function(c){ return ['Buró consultado','Precalificada','Aprobada'].indexOf(c.etapa)>=0; }).length;
  const precalificada = state.clientes.filter(function(c){ return ['Precalificada','Aprobada'].indexOf(c.etapa)>=0; }).length;
  const aprobadas = state.clientes.filter(function(c){ return c.etapa==='Aprobada'; }).length;
  const rows = [
    {label:'Solicitudes', val:total, color:'#2f6fed'},
    {label:'En revisión', val:enRevision, color:'#4f8bff'},
    {label:'Buró consultado', val:buro, color:'#7fb0ff'},
    {label:'Precalificada', val:precalificada, color:'#e0a324'},
    {label:'Aprobadas', val:aprobadas, color:'#17a673'}
  ];
  const max = total || 1;
  document.getElementById('chartFunnel').innerHTML = rows.map(function(r){
    const pct = Math.max(Math.round(r.val/max*100), r.val>0?10:2);
    return '<div class="funnel-row"><div class="funnel-label">'+r.label+'</div><div class="funnel-track"><div class="funnel-fill" style="width:'+pct+'%;background:'+r.color+'">'+r.val+'</div></div><div class="funnel-pct">'+pct+'%</div></div>';
  }).join('');
}
function renderInsights(){
  const counts = {};
  state.clientes.forEach(function(c){ counts[c.canal] = (counts[c.canal]||0)+1; });
  let topCanal = null, topVal = 0;
  Object.keys(counts).forEach(function(c){ if(counts[c]>topVal){ topVal=counts[c]; topCanal=c; } });
  const total = state.clientes.length || 1;
  const pct = topCanal ? Math.round(topVal/total*100) : 0;
  document.getElementById('insightsBox').innerHTML =
    '<div class="insights-title">&#10024; Recomendaciones de IA</div>'+
    (topCanal ? '<div class="insight-item">&#8250; '+topCanal+' genera el '+pct+'% de tus contactos — es tu canal más efectivo hoy.</div>' : '')+
    '<div class="insight-item">&#8250; Google Ads cierra más rápido que Meta en tus campañas activas.</div>'+
    '<div class="insight-item">&#8250; Mejor horario de contacto detectado: 09:00–11:00 AM.</div>';
}

/* ============================= IA COMERCIAL Y NUEVOS MÓDULOS ============================= */
function getAVAScore(c){
  const stagePoints = {'Nueva solicitud':12,'En revisión':28,'Buró consultado':48,Precalificada:65,Aprobada:82};
  const activity = (c.actividad||[]).length;
  let score = Math.min(98, (stagePoints[c.etapa]||10) + Math.round(c.probabilidad*.12) + activity*4 + (c.canal==='WhatsApp'?7:3));
  if(c.etapa==='Aprobada') score = 96;
  const level = score>=75?'Alto':score>=45?'Medio':'Bajo';
  const factors = [];
  if(c.canal==='WhatsApp') factors.push('Respondió por WhatsApp');
  if(c.canal==='Email') factors.push('Abrió correos recientes');
  if(['Buró consultado','Precalificada','Aprobada'].indexOf(c.etapa)>=0) factors.push('Avanzó dentro del proceso de crédito');
  if(c.etapa==='Precalificada'||c.etapa==='Aprobada') factors.push('Cuenta con precalificación registrada');
  if(activity) factors.push('Interactuó recientemente');
  if(c.probabilidad>=60) factors.push('Tiene señales claras de intención');
  if(factors.length<3) factors.push('Próxima tarea pendiente de confirmar');
  return {score:score,level:level,factors:factors.slice(0,4)};
}
function scoreColor(level){ return level==='Alto'?'#17a673':level==='Medio'?'#e0a324':'#e5484d'; }

function renderInbox(){
  const list=document.getElementById('conversationList'); if(!list) return;
  const q=(document.getElementById('inboxSearch').value||'').toLowerCase();
  const channel=document.getElementById('inboxChannel').value;
  const filtered=state.conversations.filter(function(c){return (!channel||c.canal===channel)&&(!q||(c.nombre+' '+c.empresa+' '+c.canal).toLowerCase().indexOf(q)>=0);});
  list.innerHTML=filtered.map(function(c){const last=c.messages[c.messages.length-1];return '<button class="conversation-item '+(c.id===selectedConversationId?'active':'')+'" onclick="selectConversation('+c.id+')"><div class="conversation-top"><span class="conversation-name">'+esc(c.nombre)+(c.unread?' <span style="color:var(--blue-500)">&#9679;</span>':'')+'</span><small class="text-muted">'+esc(last.time)+'</small></div><div style="font-size:11px;margin-top:3px"><span class="channel-dot" style="background:'+(CANAL_COLOR[c.canal]||'#d92440')+'"></span>'+esc(c.canal)+' &middot; '+esc(c.empresa)+'</div><div class="conversation-preview">'+esc(last.text)+'</div></button>';}).join('')||'<div class="empty-state">No hay conversaciones con estos filtros.</div>';
  renderConversation();
}
function selectConversation(id){selectedConversationId=id;const c=state.conversations.find(function(x){return x.id===id;});if(c)c.unread=false;document.getElementById('replyText').value='';renderInbox();}
function renderConversation(){
  const c=state.conversations.find(function(x){return x.id===selectedConversationId;}); if(!c)return;
  document.getElementById('chatContact').textContent=c.nombre;
  document.getElementById('chatMeta').textContent=c.empresa+' · '+c.etapa;
  document.getElementById('chatChannel').textContent=c.canal;
  document.getElementById('chatMessages').innerHTML=c.messages.map(function(m){return '<div class="message '+m.dir+'">'+esc(m.text)+'<small>'+esc(m.time)+'</small></div>';}).join('');
  const client=state.clientes.find(function(x){return x.id===c.clienteId;}); const score=client?getAVAScore(client):{score:71,level:'Medio',factors:[]};
  document.getElementById('conversationContext').innerHTML='<div class="score-card"><div class="score-ring" style="--score:'+score.score+';--score-color:'+scoreColor(score.level)+'"><strong>'+score.score+'</strong></div><div><div class="score-level" style="color:'+scoreColor(score.level)+'">Nivel '+score.level+'</div><div style="font-weight:800">Puntuación AVA</div><div class="text-muted" style="font-size:11px">'+(client?client.probabilidad:62)+'% probabilidad de aprobación</div></div></div><div class="context-row"><div class="context-label">Solicitante</div><div class="context-value">'+esc(c.nombre)+'</div></div><div class="context-row"><div class="context-label">Institución / cuerpo</div><div class="context-value">'+esc(c.empresa)+'</div></div><div class="context-row"><div class="context-label">Etapa del proceso</div><div class="context-value">'+esc(c.etapa)+'</div></div><div class="context-row"><div class="context-label">Tipo de crédito</div><div class="context-value">'+esc(c.producto)+'</div></div><div class="context-row"><div class="context-label">Próxima acción</div><div class="context-value">'+esc(c.proxima)+'</div></div><div class="context-row"><div class="context-label">Historial</div><div class="context-value">'+c.messages.length+' mensajes registrados</div></div>';
  const box=document.getElementById('chatMessages'); box.scrollTop=box.scrollHeight;
}
function generateAVAReply(){const c=state.conversations.find(function(x){return x.id===selectedConversationId;});if(!c){showToast('Selecciona una conversación');return;}document.getElementById('replyText').value='Hola '+c.nombre.split(' ')[0]+', claro. Teniendo en cuenta lo conversado sobre '+c.producto+', te comparto la información actualizada. También puedo acompañarte en el siguiente paso de la etapa de '+c.etapa.toLowerCase()+'. ¿Te parece bien si lo revisamos hoy?';showToast('AVA generó una sugerencia editable');}
function sendConversationReply(){const c=state.conversations.find(function(x){return x.id===selectedConversationId;});const input=document.getElementById('replyText');if(!c||!input.value.trim()){showToast('Escribe o genera una respuesta antes de enviar');return;}c.messages.push({dir:'outgoing',text:input.value.trim(),time:nowLabel()});input.value='';renderInbox();showToast('Respuesta enviada en la simulación');}
function markConversationRead(){const c=state.conversations.find(function(x){return x.id===selectedConversationId;});if(c)c.unread=false;renderInbox();showToast('Conversación marcada como atendida');}

function renderFollowupAlerts(){const el=document.getElementById('followupAlerts');if(!el)return;const alerts=[{id:3,text:'Solicitante sin respuesta desde hace 5 días.',type:'Llamada',high:true},{id:4,text:'Esta solicitud está perdiendo actividad.',type:'WhatsApp',high:false},{id:5,text:'Se recomienda dar seguimiento hoy.',type:'Correo',high:false}];el.innerHTML=alerts.map(function(a){return '<div class="alert-commercial '+(a.high?'high':'')+'"><div><strong>'+a.text+'</strong><div class="text-muted" style="font-size:11.5px">AVA sugiere: '+a.type+'</div></div><button class="btn btn-violet btn-small" onclick="generateFollowup('+a.id+',\''+a.type+'\')">Generar seguimiento con AVA</button></div>';}).join('');}
function generateFollowup(clientId,type){const c=state.clientes.find(function(x){return x.id===clientId;})||state.clientes[0];const task={id:uid(),tipo:type==='Llamada'?'Llamar solicitante':'Realizar seguimiento',cliente:c.contacto,empresa:c.empresa,responsable:'Katherine Silva',fecha:todayISO(),hora:'15:00',prioridad:'Alta',estado:'Pendiente'};state.tasks.unshift(task);renderTasks();showToast('AVA creó una tarea de '+type+' para '+c.contacto);}
function renderTasks(){const body=document.getElementById('tasksTable');if(!body)return;const q=(document.getElementById('taskSearch').value||'').toLowerCase();const filter=document.getElementById('taskFilter').value;const rows=state.tasks.filter(function(t){return (!filter||t.estado===filter)&&(!q||(t.tipo+' '+t.cliente+' '+t.empresa+' '+t.responsable).toLowerCase().indexOf(q)>=0);});body.innerHTML=rows.map(function(t){const pc=t.prioridad==='Alta'?'pill-bad':t.prioridad==='Media'?'pill-warning':'pill-info';const sc=t.estado==='Completada'?'pill-success':t.estado==='En progreso'?'pill-info':'pill-warning';return '<tr class="no-click"><td data-label="Tarea" style="font-weight:700">'+esc(t.tipo)+'</td><td data-label="Cliente">'+esc(t.cliente)+'</td><td data-label="Empresa">'+esc(t.empresa)+'</td><td data-label="Responsable">'+esc(t.responsable)+'</td><td data-label="Fecha y hora">'+esc(t.fecha)+' · '+esc(t.hora)+'</td><td data-label="Prioridad"><span class="pill '+pc+'">'+t.prioridad+'</span></td><td data-label="Estado"><span class="pill '+sc+'">'+t.estado+'</span></td><td data-label="Acción"><button class="btn btn-ghost btn-small" onclick="advanceTask('+t.id+')">Actualizar</button></td></tr>';}).join('')||'<tr><td colspan="8" class="empty-state">No hay tareas con estos filtros.</td></tr>';}
function advanceTask(id){const t=state.tasks.find(function(x){return x.id===id;});if(!t)return;t.estado=t.estado==='Pendiente'?'En progreso':t.estado==='En progreso'?'Completada':'Pendiente';renderAll();showToast('Tarea actualizada a '+t.estado);}
function openTaskModal(){document.getElementById('task-date').value=todayISO();document.getElementById('task-time').value='09:00';openModal('modal-task');}
function submitTask(e){e.preventDefault();state.tasks.unshift({id:uid(),tipo:document.getElementById('task-type').value,cliente:document.getElementById('task-client').value,empresa:document.getElementById('task-company').value,responsable:document.getElementById('task-owner').value,fecha:document.getElementById('task-date').value,hora:document.getElementById('task-time').value,prioridad:document.getElementById('task-priority').value,estado:'Pendiente'});e.target.reset();closeModal('modal-task');renderAll();showToast('Tarea creada');}

function renderProducts(){const body=document.getElementById('productsTable');if(!body)return;updateTaxUI();const q=(document.getElementById('productSearch').value||'').toLowerCase();const f=document.getElementById('productFilter').value;const rows=state.products.filter(function(p){return (!f||p.estado===f)&&(!q||(p.nombre+' '+p.descripcion).toLowerCase().indexOf(q)>=0);});body.innerHTML=rows.map(function(p){return '<tr class="no-click"><td style="font-weight:800">'+esc(p.nombre)+'</td><td>'+esc(p.descripcion)+'</td><td>'+formatMoney(p.precio)+'</td><td>'+p.impuesto+'%</td><td>'+p.comision+'%</td><td>'+pill(p.estado)+'</td><td><button class="btn btn-ghost btn-small" onclick="associateProduct('+p.id+')">Asociar</button></td></tr>';}).join('');fillQuoteProducts();}
function openProductModal(){updateTaxUI();document.getElementById('product-tax').value=activeTax().taxRate;openModal('modal-product');}
function submitProduct(e){e.preventDefault();state.products.push({id:uid(),nombre:document.getElementById('product-name').value,descripcion:document.getElementById('product-desc').value,precio:Number(document.getElementById('product-price').value),impuesto:Number(document.getElementById('product-tax').value),comision:Number(document.getElementById('product-commission').value),estado:document.getElementById('product-status').value});e.target.reset();closeModal('modal-product');renderAll();showToast('Producto o servicio agregado al catálogo');}
function associateProduct(id){const p=state.products.find(function(x){return x.id===id;});navigate('pipeline');showToast(p.nombre+' listo para asociar a una oportunidad');}
function fillQuoteProducts(){const sel=document.getElementById('quote-product');if(!sel)return;const current=sel.value;sel.innerHTML=state.products.filter(function(p){return p.estado==='Activo';}).map(function(p){return '<option value="'+p.id+'">'+esc(p.nombre)+'</option>';}).join('');if(current)sel.value=current;}
function fillQuotePrice(){const p=state.products.find(function(x){return x.id===Number(document.getElementById('quote-product').value);});if(!p)return;document.getElementById('quote-price').value=p.precio;document.getElementById('quote-tax').value=activeTax().taxRate;updateQuotePreview();}
function quoteTotals(){const qty=Number(document.getElementById('quote-qty').value)||0;const price=Number(document.getElementById('quote-price').value)||0;const discount=Number(document.getElementById('quote-discount').value)||0;const tax=Number(document.getElementById('quote-tax').value)||0;const subtotal=qty*price*(1-discount/100);return {subtotal:subtotal,total:subtotal*(1+tax/100)};}
function updateQuotePreview(){const t=quoteTotals();document.getElementById('quote-subtotal').textContent=formatMoney(t.subtotal);document.getElementById('quote-total').textContent=formatMoney(t.total);}
function openQuoteModal(id){fillQuoteProducts();updateTaxUI();document.getElementById('quote-date').value=todayISO();const q=state.quotes.find(function(x){return x.id===id;});document.getElementById('quote-id').value=q?q.id:'';document.getElementById('quoteModalTitle').textContent=q?'Editar crédito':'Nuevo crédito';if(q){document.getElementById('quote-client').value=q.cliente;document.getElementById('quote-company').value=q.empresa;const p=state.products.find(function(x){return x.nombre===q.producto;});if(p)document.getElementById('quote-product').value=p.id;document.getElementById('quote-qty').value=q.cantidad;document.getElementById('quote-price').value=q.precio;document.getElementById('quote-discount').value=q.descuento;document.getElementById('quote-tax').value=activeTax().taxRate;document.getElementById('quote-date').value=q.fecha;}else{document.getElementById('quote-qty').value=1;document.getElementById('quote-discount').value=0;fillQuotePrice();}updateQuotePreview();openModal('modal-quote');}
function submitQuote(e){e.preventDefault();const id=Number(document.getElementById('quote-id').value);const p=state.products.find(function(x){return x.id===Number(document.getElementById('quote-product').value);});const t=quoteTotals();const data={cliente:document.getElementById('quote-client').value,empresa:document.getElementById('quote-company').value,producto:p.nombre,cantidad:Number(document.getElementById('quote-qty').value),precio:Number(document.getElementById('quote-price').value),descuento:Number(document.getElementById('quote-discount').value),impuesto:Number(document.getElementById('quote-tax').value),subtotal:t.subtotal,total:t.total,fecha:document.getElementById('quote-date').value};if(id){Object.assign(state.quotes.find(function(x){return x.id===id;}),data);}else{data.id=uid();data.numero='COT-2026-'+String(state.quotes.length+15).padStart(3,'0');data.estado='Borrador';state.quotes.unshift(data);}closeModal('modal-quote');renderAll();showToast(id?'Cotización actualizada':'Cotización creada');}
function renderQuotes(){const body=document.getElementById('quotesTable');if(!body)return;const q=(document.getElementById('quoteSearch').value||'').toLowerCase();const f=document.getElementById('quoteFilter').value;const rows=state.quotes.filter(function(x){return (!f||x.estado===f)&&(!q||(x.numero+' '+x.cliente+' '+x.empresa).toLowerCase().indexOf(q)>=0);});body.innerHTML=rows.map(function(x){const cls=x.estado==='Aceptada'?'pill-success':x.estado==='Rechazada'?'pill-bad':x.estado==='Enviada'?'pill-info':'pill-warning';return '<tr class="no-click"><td><button class="btn btn-ghost btn-small" onclick="showQuote('+x.id+')">'+x.numero+'</button></td><td><strong>'+esc(x.cliente)+'</strong><div class="text-muted" style="font-size:11px">'+esc(x.empresa)+'</div></td><td>'+esc(x.producto)+'</td><td>'+esc(x.fecha)+'</td><td style="font-weight:800">'+formatMoney(x.total)+'</td><td><span class="pill '+cls+'">'+x.estado+'</span></td><td><div class="quote-actions"><button class="icon-action" title="Generar PDF" onclick="quoteAction('+x.id+',\'PDF\')">&#128196;</button><button class="icon-action" title="Enviar por WhatsApp" onclick="quoteAction('+x.id+',\'WhatsApp\')">&#128241;</button><button class="icon-action" title="Enviar por correo" onclick="quoteAction('+x.id+',\'Email\')">&#9993;</button><button class="icon-action" title="Duplicar" onclick="duplicateQuote('+x.id+')">&#10697;</button><button class="icon-action" title="Editar" onclick="openQuoteModal('+x.id+')">&#9998;</button></div></td></tr>';}).join('');const m=document.getElementById('quoteMetrics');if(m){const open=state.quotes.filter(function(x){return x.estado==='Borrador'||x.estado==='Enviada';});m.innerHTML='<div class="metric-cell"><span>En trámite</span><strong>'+open.length+'</strong></div><div class="metric-cell"><span>Monto en trámite</span><strong>'+formatMoney(open.reduce(function(s,x){return s+x.total;},0))+'</strong></div><div class="metric-cell"><span>Aprobados</span><strong>'+state.quotes.filter(function(x){return x.estado==='Aceptada';}).length+'</strong></div><div class="metric-cell"><span>Tasa de aprobación</span><strong>42%</strong></div>';}}
function quoteAction(id,type){const q=state.quotes.find(function(x){return x.id===id;});if(type!=='PDF'&&q.estado==='Borrador')q.estado='Enviada';renderQuotes();showToast(type==='PDF'?'Vista de PDF generada en la simulación':'Cotización '+q.numero+' enviada por '+type+' en la simulación');}
function duplicateQuote(id){const q=state.quotes.find(function(x){return x.id===id;});const copy=Object.assign({},q,{id:uid(),numero:'COT-2026-'+String(state.quotes.length+15).padStart(3,'0'),estado:'Borrador'});state.quotes.unshift(copy);renderAll();showToast('Cotización duplicada como '+copy.numero);}
function showQuote(id){const q=state.quotes.find(function(x){return x.id===id;});const tax=activeTax();document.getElementById('quoteDetail').innerHTML='<span class="ia-badge">'+q.estado+'</span><h2 class="modal-title" style="margin-top:12px">'+q.numero+'</h2><div class="grid-2" style="margin-bottom:12px"><div><div class="context-label">Cliente</div><strong>'+esc(q.cliente)+'</strong><div class="text-muted">'+esc(q.empresa)+'</div></div><div><div class="context-label">Fecha</div><strong>'+esc(q.fecha)+'</strong></div></div><div class="table-container"><table><thead><tr><th>Tipo de crédito</th><th>Plazo (meses)</th><th>Monto</th><th>Descuento</th><th>'+tax.taxName+'</th></tr></thead><tbody><tr class="no-click"><td>'+esc(q.producto)+'</td><td>'+q.cantidad+'</td><td>'+formatMoney(q.precio)+'</td><td>'+q.descuento+'%</td><td>'+q.impuesto+'%</td></tr></tbody></table></div><div style="text-align:right;margin-top:16px"><div>Subtotal: <strong>'+formatMoney(q.subtotal)+'</strong></div><div style="font-size:20px;margin-top:4px">Total: <strong>'+formatMoney(q.total)+'</strong></div></div><div class="modal-actions"><button class="btn btn-ghost" onclick="quoteAction('+q.id+',\'PDF\')">Generar PDF</button><button class="btn btn-primary" onclick="closeModal(\'modal-quote-detail\')">Cerrar</button></div>';openModal('modal-quote-detail');}
function renderGoals(){const advisors=document.getElementById('advisorGoals');if(!advisors)return;const goal=360000000,sales=273600000,forecast=state.clientes.filter(function(c){return c.etapa!=='Cerrado';}).reduce(function(s,c){return s+c.valor*c.probabilidad/100;},0),pipe=state.clientes.filter(function(c){return c.etapa!=='Cerrado';}).reduce(function(s,c){return s+c.valor;},0);document.getElementById('monthlyGoal').textContent=formatMoney(goal);document.getElementById('monthlySales').textContent=formatMoney(sales);document.getElementById('forecastPipeline').textContent=formatMoney(pipe);document.getElementById('forecastAI').textContent=formatMoney(forecast);document.getElementById('forecastGoal').textContent=formatMoney(goal);advisors.innerHTML=[['Katherine',92],['Sarah',71],['Carlos',56]].map(function(a){return '<div class="goal-row"><strong>'+a[0]+'</strong><div class="progress-track"><div class="progress-fill" style="width:'+a[1]+'%"></div></div><strong>'+a[1]+'%</strong></div>';}).join('');document.getElementById('forecastInsights').innerHTML='<div class="insights-title">&#10024; Recomendaciones de IA</div><div class="insight-item">&#8250; AVA detecta alta probabilidad de alcanzar el objetivo mensual.</div><div class="insight-item">&#8250; Se recomienda priorizar 3 oportunidades con cotización enviada y actividad reciente.</div><div class="insight-item">&#8250; Las oportunidades contactadas entre 09:00 y 11:00 responden mejor.</div>';}
function refreshForecast(){showToast('AVA está recalculando el pronóstico...');setTimeout(function(){renderGoals();showToast('Pronóstico actualizado con la actividad más reciente');},650);}

/* ============================= PIPELINE (KANBAN) ============================= */
function fillEmpresaSelect(){
  const sel = document.getElementById('cli-empresaId');
  const current = sel.value;
  sel.innerHTML = '<option value="">— Sin vincular —</option>' + state.empresas.map(function(e){ return '<option value="'+e.id+'">'+e.nombre+'</option>'; }).join('');
  sel.value = current;
}
function fillClienteSelects(){
  const optsWithNone = '<option value="">— Ninguno —</option>' + state.clientes.map(function(c){ return '<option value="'+c.id+'">'+c.empresa+' ('+c.contacto+')</option>'; }).join('');
  const opts = state.clientes.map(function(c){ return '<option value="'+c.id+'">'+c.empresa+' ('+c.contacto+')</option>'; }).join('');
  const empOpts = state.empresas.map(function(e){ return '<option value="'+e.id+'">'+e.nombre+'</option>'; }).join('');
  const evSel = document.getElementById('ev-clienteId');
  const evCur = evSel.value; evSel.innerHTML = optsWithNone; evSel.value = evCur;
  const gesSel = document.getElementById('ges-clienteId');
  const gesCur = gesSel.value; gesSel.innerHTML = opts; if(gesCur) gesSel.value = gesCur;
  const gesEmpSel = document.getElementById('ges-empresaId');
  const gesEmpCur = gesEmpSel.value; gesEmpSel.innerHTML = empOpts; if(gesEmpCur) gesEmpSel.value = gesEmpCur;
}
function renderKanban(){
  const totalOportunidades = state.clientes.length;
  const totalValor = state.clientes.reduce(function(s,c){ return s+Number(c.valor); },0);
  document.getElementById('pipelineBannerSub').innerHTML = totalOportunidades+' oportunidades &middot; '+formatMoney(totalValor);

  const qEl = document.getElementById('searchPipeline');
  const q = qEl ? qEl.value.toLowerCase() : '';
  const board = document.getElementById('kanbanBoard');
  board.innerHTML = ETAPAS.map(function(etapa){
    const items = state.clientes.filter(function(c){ return c.etapa===etapa && (!q || c.empresa.toLowerCase().indexOf(q)>=0 || c.contacto.toLowerCase().indexOf(q)>=0); });
    const sum = items.reduce(function(s,c){ return s+Number(c.valor); },0);
    const color = ETAPA_COLOR[etapa];
    const cards = items.map(function(c){
      const canalColor = CANAL_COLOR[c.canal]||'#8a97ac';
      const ava = getAVAScore(c);
      const relatedTask = state.tasks.find(function(t){ return t.empresa===c.empresa && t.estado!=='Completada'; });
      const lastActivity = (c.actividad&&c.actividad[0]) ? c.actividad[0].fecha : 'Sin actividad reciente';
      return '<div class="kanban-card" draggable="true" ondragstart="onDragStart(event,'+c.id+')" onclick="openFicha('+c.id+')">'+
        '<div class="kanban-card-empresa">'+c.empresa+(etapa==='Aprobada'?' &check;':'')+'</div>'+
        '<div class="kanban-card-contacto">'+c.contacto+'</div>'+
        '<div class="kanban-card-row"><span class="kanban-card-valor">'+formatMoney(c.valor)+'</span><span class="kanban-card-prob">'+c.probabilidad+'% cierre</span></div>'+
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span class="score-mini">Puntuación AVA '+ava.score+'</span><span style="font-size:10px;color:'+scoreColor(ava.level)+';font-weight:800">'+ava.level+'</span></div>'+
        '<div class="text-muted" style="font-size:10.5px;margin-bottom:3px">Última actividad: '+esc(lastActivity)+'</div>'+
        '<div class="text-muted" style="font-size:10.5px;margin-bottom:9px">Próxima tarea: '+esc(relatedTask?relatedTask.tipo:'Por definir')+'</div>'+
        '<div class="kanban-card-footer">'+
          '<span class="pill" style="background:'+canalColor+'22;color:'+canalColor+'">'+c.canal+'</span>'+
          '<select class="kanban-move" onclick="event.stopPropagation()" onchange="moverEtapa('+c.id+',this.value)">'+
            ETAPAS.map(function(e2){ return '<option value="'+e2+'"'+(e2===etapa?' selected':'')+'>'+e2+'</option>'; }).join('')+
          '</select>'+
        '</div>'+
      '</div>';
    }).join('');
    return '<div class="kanban-col" ondragover="event.preventDefault();this.classList.add(\'dragover\')" ondragleave="this.classList.remove(\'dragover\')" ondrop="onDropCard(event,\''+etapa+'\')">'+
      '<div class="kanban-col-head"><div class="kanban-col-title" style="color:'+color+'">'+etapa.toUpperCase()+(etapa==='Aprobada'?' &check;':'')+'<span class="kanban-col-count">'+items.length+'</span></div><div class="kanban-col-sum">'+formatMoney(sum)+'</div></div>'+
      cards+
      '<button class="kanban-add" onclick="openClienteModal(null,\''+etapa+'\')">+ Agregar</button>'+
    '</div>';
  }).join('');
}
function onDragStart(e, clienteId){
  e.dataTransfer.setData('text/plain', String(clienteId));
  e.target.classList.add('dragging');
}
function onDropCard(e, etapa){
  e.preventDefault();
  e.currentTarget.classList.remove('dragover');
  const id = Number(e.dataTransfer.getData('text/plain'));
  if(id) moverEtapa(id, etapa);
}
function moverEtapa(clienteId, etapa){
  const c = state.clientes.find(function(x){ return x.id===Number(clienteId); });
  if(!c || c.etapa===etapa) return;
  const anterior = c.etapa;
  c.etapa = etapa;
  if(etapa==='Aprobada') c.probabilidad = 100;
  c.actividad.unshift({fecha:nowLabel(), texto:'Movido en el proceso de crédito: '+anterior+' &rarr; '+etapa});
  renderAll();
  showToast(c.empresa+' movido a '+etapa);
}
function enriquecerPipelineIA(){
  const abiertos = state.clientes.filter(function(c){ return c.etapa!=='Aprobada'; });
  if(!abiertos.length){ showToast('No hay oportunidades abiertas para priorizar'); return; }
  abiertos.sort(function(a,b){ return (b.probabilidad*b.valor) - (a.probabilidad*a.valor); });
  const top = abiertos.slice(0,2).map(function(c){ return c.empresa; }).join(' y ');
  showToast('AVA sugiere priorizar: '+top+' — mayor probabilidad de aprobación esta semana');
}

/* ============================= EMPRESAS + IA + HISTORIAL ============================= */
const IA_TAMANOS = ['Pequeña (1-10 empleados)','Mediana (11-200 empleados)','Grande (200+ empleados)'];
const IA_TECH = ['WhatsApp Business API','Google Ads','Meta Ads','HubSpot','Salesforce','Shopify','SAP','Power BI','Zendesk'];
const IA_POTENCIAL = ['Alto','Medio','Bajo'];
function enriquecerEmpresaIA(empresaId){
  const e = state.empresas.find(function(x){ return x.id===empresaId; });
  if(!e) return;
  showToast('Analizando '+e.nombre+' con IA...');
  setTimeout(function(){
    const seed = e.nombre.length + e.sector.length;
    e.tamano = IA_TAMANOS[seed % IA_TAMANOS.length];
    e.sitioWeb = 'www.'+slug(e.nombre)+'.com';
    e.potencial = IA_POTENCIAL[seed % IA_POTENCIAL.length];
    const techCount = 2 + (seed % 3);
    e.tecnologias = IA_TECH.filter(function(_,i){ return (i+seed)%IA_TECH.length < techCount; }).slice(0,techCount);
    e.descripcionIA = 'Empresa del sector '+e.sector+' con operación en '+e.ciudad+'. Presencia digital activa y actividad comercial constante en redes. Potencial estimado '+e.potencial.toLowerCase()+' para servicios de IA conversacional, automatización de atención al cliente y omnicanalidad.';
    e.enriquecido = true;
    renderEmpresasTable();
    showToast(e.nombre+' enriquecida con IA');
    verEmpresaIA(empresaId);
  }, 900);
}
function verEmpresaIA(empresaId){
  const e = state.empresas.find(function(x){ return x.id===empresaId; });
  if(!e || !e.enriquecido) return;
  document.getElementById('empresaIaBody').innerHTML =
    '<div class="ia-panel">'+
      '<div class="ia-field"><div class="ia-field-label">Empresa</div><div class="ia-field-val" style="font-weight:800">'+e.nombre+'</div></div>'+
      '<div class="ia-field"><div class="ia-field-label">Descripción generada por IA</div><div class="ia-field-val">'+e.descripcionIA+'</div></div>'+
      '<div class="form-row">'+
        '<div class="ia-field"><div class="ia-field-label">Tamaño estimado</div><div class="ia-field-val">'+e.tamano+'</div></div>'+
        '<div class="ia-field"><div class="ia-field-label">Potencial comercial</div><div class="ia-field-val">'+e.potencial+'</div></div>'+
      '</div>'+
      '<div class="ia-field"><div class="ia-field-label">Sitio web detectado</div><div class="ia-field-val">'+e.sitioWeb+'</div></div>'+
      '<div class="ia-field"><div class="ia-field-label">Tecnologías detectadas</div><div>'+e.tecnologias.map(function(t){ return '<span class="tech-tag">'+t+'</span>'; }).join('')+'</div></div>'+
    '</div>';
  openModal('modal-empresa-ia');
}
function verEmpresaHistorial(empresaId){
  const e = state.empresas.find(function(x){ return x.id===empresaId; });
  if(!e) return;
  document.getElementById('empresaHistorialTitulo').textContent = 'Historial — '+e.nombre;
  document.getElementById('empresaHistorialBody').innerHTML = e.actividad.length ? e.actividad.map(function(a){
    return '<div class="timeline-item"><div class="timeline-dot"></div><div><div class="timeline-text">'+a.texto+'</div><div class="timeline-time">'+a.fecha+'</div></div></div>';
  }).join('') : '<div class="empty-state">Esta empresa aún no tiene gestiones registradas directamente (sin pasar por un contacto).</div>';
  openModal('modal-empresa-historial');
}
function renderEmpresasTable(){
  const q = (document.getElementById('searchEmpresas').value||'').toLowerCase();
  const rows = state.empresas.filter(function(e){ return !q || e.nombre.toLowerCase().indexOf(q)>=0 || e.nit.toLowerCase().indexOf(q)>=0; });
  document.getElementById('empresasTable').innerHTML = rows.map(function(e){
    const count = state.clientes.filter(function(c){ return c.empresaId===e.id; }).length;
    const iaCol = e.enriquecido ? '<span class="ia-badge">&#10024;</span>' : '<span class="text-muted" style="font-size:11px">—</span>';
    const iaBtn = e.enriquecido ? '<button class="btn btn-ghost btn-small" onclick="verEmpresaIA('+e.id+')">Ver IA</button>' : '<button class="btn btn-violet btn-small" onclick="enriquecerEmpresaIA('+e.id+')">&#10024; Enriquecer</button>';
    return '<tr class="no-click">'+
      '<td data-label="Empresa" style="font-weight:700">'+e.nombre+'</td>'+
      '<td data-label="NIT" class="mono">'+e.nit+'</td>'+
      '<td data-label="Sector">'+e.sector+'</td>'+
      '<td data-label="Ciudad">'+e.ciudad+'</td>'+
      '<td data-label="Contactos">'+count+'</td>'+
      '<td data-label="IA">'+iaCol+'</td>'+
      '<td data-label="Historial">'+e.actividad.length+' gestión(es)</td>'+
      '<td data-label="Acciones" style="display:flex;gap:6px;flex-wrap:wrap">'+iaBtn+'<button class="btn btn-ghost btn-small" onclick="verEmpresaHistorial('+e.id+')">Historial</button><button class="btn btn-ghost btn-small" onclick="openEmpresaModal('+e.id+')">Editar</button></td>'+
    '</tr>';
  }).join('') || '<tr><td colspan="8" class="empty-state">No hay empresas registradas</td></tr>';
}
function openEmpresaModal(id){
  const e = state.empresas.find(function(x){ return x.id===id; });
  document.getElementById('emp-id').value = e ? e.id : '';
  document.getElementById('modalEmpresaTitle').textContent = e ? 'Editar institución aliada' : 'Nueva institución aliada';
  document.getElementById('emp-nombre').value=e ? e.nombre : '';
  document.getElementById('emp-nit').value=e ? e.nit : '';
  document.getElementById('emp-sector').value=e ? e.sector : '';
  document.getElementById('emp-ciudad').value=e ? e.ciudad : '';
  openModal('modal-empresa');
}
function submitEmpresa(e){
  e.preventDefault();
  const id = Number(document.getElementById('emp-id').value);
  const data = {nombre: document.getElementById('emp-nombre').value.trim(), nit: document.getElementById('emp-nit').value.trim(),
    sector: document.getElementById('emp-sector').value.trim(), ciudad: document.getElementById('emp-ciudad').value.trim(),
    enriquecido: false, actividad: []};
  if(id){ const current=state.empresas.find(function(x){return x.id===id;}); data.enriquecido=current.enriquecido; data.actividad=current.actividad; Object.assign(current,data); }
  else state.empresas.push(Object.assign({id:uid()},data));
  closeModal('modal-empresa');
  renderAll();
  showToast(id ? 'Empresa actualizada correctamente' : 'Empresa creada correctamente');
}
function verClientesDeEmpresa(empresaId){
  navigate('clientes');
  document.getElementById('searchClientes').value = state.empresas.find(function(e){ return e.id===empresaId; }).nombre;
  renderClientesTable();
}

/* ============================= CONTACTOS ============================= */
function renderClientesTable(){
  const q = (document.getElementById('searchClientes').value||'').toLowerCase();
  const filtroEstado = document.getElementById('filtroEstadoCliente').value;
  const rows = state.clientes.filter(function(c){
    const matchQ = !q || c.empresa.toLowerCase().indexOf(q)>=0 || c.contacto.toLowerCase().indexOf(q)>=0 || c.email.toLowerCase().indexOf(q)>=0;
    const matchE = !filtroEstado || c.estado===filtroEstado;
    return matchQ && matchE;
  });
  document.getElementById('clientesTable').innerHTML = rows.map(function(c){
    return '<tr onclick="openFicha('+c.id+')">'+
      '<td data-label="Empresa" style="font-weight:700">'+c.empresa+'</td>'+
      '<td data-label="Contacto">'+c.contacto+'</td>'+
      '<td data-label="Correo">'+c.email+'</td>'+
      '<td data-label="Etapa"><span class="pill pill-info">'+c.etapa+'</span></td>'+
      '<td data-label="Valor">'+formatMoney(c.valor)+'</td>'+
      '<td data-label="Estado">'+pill(c.estado)+'</td>'+
      '<td data-label="Acciones"><button class="btn btn-ghost btn-small" onclick="event.stopPropagation();openClienteModal('+c.id+')">Editar</button></td>'+
    '</tr>';
  }).join('') || '<tr><td colspan="7" class="empty-state">No se encontraron contactos con ese filtro</td></tr>';
}
function openClienteModal(id, etapaPreset){
  document.getElementById('formCliente').reset();
  fillEmpresaSelect();
  const note = document.getElementById('cli-currency-note');
  if(note) note.textContent = state.currency;
  if(id){
    const c = state.clientes.find(function(x){ return x.id===id; });
    document.getElementById('modalClienteTitle').textContent = 'Editar solicitud';
    document.getElementById('cli-id').value = c.id;
    document.getElementById('cli-empresa').value = c.empresa;
    document.getElementById('cli-empresaId').value = c.empresaId||'';
    document.getElementById('cli-contacto').value = c.contacto;
    document.getElementById('cli-email').value = c.email;
    document.getElementById('cli-telefono').value = c.telefono;
    document.getElementById('cli-estado').value = c.estado;
    document.getElementById('cli-etapa').value = c.etapa;
    document.getElementById('cli-canal').value = c.canal;
    document.getElementById('cli-valor').value = c.valor;
    document.getElementById('cli-probabilidad').value = c.probabilidad;
  } else {
    document.getElementById('modalClienteTitle').textContent = 'Nueva solicitud de crédito';
    document.getElementById('cli-id').value = '';
    if(etapaPreset) document.getElementById('cli-etapa').value = etapaPreset;
  }
  openModal('modal-cliente');
}
function submitCliente(e){
  e.preventDefault();
  const id = document.getElementById('cli-id').value;
  const empresaIdVal = document.getElementById('cli-empresaId').value;
  const data = {
    empresa: document.getElementById('cli-empresa').value.trim(),
    empresaId: empresaIdVal ? Number(empresaIdVal) : null,
    contacto: document.getElementById('cli-contacto').value.trim(),
    email: document.getElementById('cli-email').value.trim(),
    telefono: document.getElementById('cli-telefono').value.trim(),
    estado: document.getElementById('cli-estado').value,
    etapa: document.getElementById('cli-etapa').value,
    canal: document.getElementById('cli-canal').value,
    valor: Number(document.getElementById('cli-valor').value),
    probabilidad: Number(document.getElementById('cli-probabilidad').value)
  };
  if(id){
    const c = state.clientes.find(function(x){ return x.id===Number(id); });
    Object.assign(c, data);
    c.actividad.unshift({fecha:nowLabel(), texto:'Datos del contacto actualizados.'});
    showToast('Contacto actualizado correctamente');
  } else {
    state.clientes.push(Object.assign({id:uid()}, data, {notas:[], actividad:[{fecha:nowLabel(), texto:'Contacto creado en el CRM.'}]}));
    showToast('Contacto creado correctamente');
  }
  closeModal('modal-cliente');
  renderAll();
}

/* ============================= FICHA DE CONTACTO (DRAWER) ============================= */
function openFicha(id){
  fichaActualId = id;
  const c = state.clientes.find(function(x){ return x.id===id; });
  if(!c) return;
  document.getElementById('fichaNombre').textContent = c.empresa;
  document.getElementById('fichaSub').textContent = c.contacto + ' · ' + c.email;
  renderFichaResumen(c);
  renderFichaActividad(c);
  renderFichaNotas(c);
  switchFichaTab('resumen');
  document.getElementById('drawerOverlay').classList.add('open');
  document.getElementById('drawerFicha').classList.add('open');
}
function closeDrawer(){
  document.getElementById('drawerOverlay').classList.remove('open');
  document.getElementById('drawerFicha').classList.remove('open');
}
function switchFichaTab(tab){
  ['resumen','actividad','notas'].forEach(function(t){
    document.getElementById('ftab-'+t).classList.toggle('active', t===tab);
    document.getElementById('fdiv-'+t).classList.toggle('hidden', t!==tab);
  });
}
function renderFichaResumen(c){
  const empresa = state.empresas.find(function(e){ return e.id===c.empresaId; });
  const ava = getAVAScore(c);
  document.getElementById('fdiv-resumen').innerHTML =
    '<div class="score-card"><div class="score-ring" style="--score:'+ava.score+';--score-color:'+scoreColor(ava.level)+'"><strong>'+ava.score+'</strong></div><div><div class="score-level" style="color:'+scoreColor(ava.level)+'">Nivel '+ava.level+'</div><div style="font-weight:800">Puntuación AVA: '+ava.score+'/100</div><div class="text-muted" style="font-size:11.5px">'+(ava.level==='Alto'?'Alta':ava.level==='Medio'?'Media':'Baja')+' probabilidad de aprobación</div></div></div>'+
    '<div class="ia-panel" style="margin:0 0 15px"><div class="ia-field-label">¿Por qué tiene esta puntuación?</div><ul class="score-factors">'+ava.factors.map(function(f){return '<li>&check; '+esc(f)+'</li>';}).join('')+'</ul></div>'+
    '<div class="action-tile-row">'+
      '<button class="action-tile" onclick="openEventoModal('+c.id+')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg><span>Agendar</span></button>'+
      '<button class="action-tile" onclick="registrarAccion(\'Correo enviado desde ficha\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg><span>Correo</span></button>'+
      '<button class="action-tile" onclick="registrarAccion(\'SMS enviado desde ficha\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg><span>SMS</span></button>'+
      '<button class="action-tile" onclick="registrarAccion(\'Mensaje de WhatsApp enviado\')"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12a8 8 0 1 1 3 6.2L4 20l1.3-3.6A8 8 0 0 1 4 12Z"/></svg><span>WhatsApp</span></button>'+
    '</div>'+
    '<button class="btn btn-primary" style="width:100%;margin-bottom:16px" onclick="openGestionModal('+c.id+')">&#128222; Registrar gestión</button>'+
    '<div class="fichaField"><div class="fichaFieldLabel">Estado</div><div class="fichaFieldVal">'+pill(c.estado)+'</div></div>'+
    '<div class="fichaField"><div class="fichaFieldLabel">Etapa del proceso de crédito</div><div class="fichaFieldVal"><span class="pill pill-info">'+c.etapa+'</span></div></div>'+
    '<div class="fichaField"><div class="fichaFieldLabel">Monto solicitado</div><div class="fichaFieldVal">'+formatMoney(c.valor)+' &middot; '+c.probabilidad+'% probabilidad</div></div>'+
    '<div class="fichaField"><div class="fichaFieldLabel">Canal de origen</div><div class="fichaFieldVal"><span class="pill" style="background:'+(CANAL_COLOR[c.canal]||'#8a97ac')+'22;color:'+(CANAL_COLOR[c.canal]||'#8a97ac')+'">'+c.canal+'</span></div></div>'+
    '<div class="fichaField"><div class="fichaFieldLabel">Teléfono</div><div class="fichaFieldVal">'+c.telefono+'</div></div>'+
    '<div class="fichaField"><div class="fichaFieldLabel">Institución aliada vinculada</div><div class="fichaFieldVal">'+(empresa ? empresa.nombre+' · '+empresa.sector : 'Sin institución vinculada')+'</div></div>'+
    '<button class="btn btn-ghost" style="width:100%;margin-top:4px" onclick="openClienteModal('+c.id+')">Editar datos del solicitante</button>';
}
function renderFichaActividad(c){
  document.getElementById('fdiv-actividad').innerHTML = c.actividad.length ? c.actividad.map(function(a){
    return '<div class="timeline-item"><div class="timeline-dot"></div><div><div class="timeline-text">'+a.texto+'</div><div class="timeline-time">'+a.fecha+'</div></div></div>';
  }).join('') : '<div class="empty-state">Sin actividad registrada aún</div>';
}
function renderFichaNotas(c){
  document.getElementById('fdiv-notas').innerHTML =
    '<textarea id="notaTexto" rows="3" placeholder="Escribe una nota interna sobre este contacto..."></textarea>'+
    '<button class="btn btn-primary btn-small" style="margin-top:8px;margin-bottom:16px" onclick="agregarNota('+c.id+')">+ Agregar nota</button>'+
    (c.notas.length ? c.notas.map(function(n){ return '<div class="nota-item"><div class="nota-time">'+n.fecha+'</div>'+n.texto+'</div>'; }).join('') : '<div class="empty-state">Sin notas registradas</div>');
}
function agregarNota(id){
  const c = state.clientes.find(function(x){ return x.id===id; });
  const txt = document.getElementById('notaTexto').value.trim();
  if(!txt) return;
  c.notas.unshift({fecha:nowLabel(), texto:txt});
  renderFichaNotas(c);
  showToast('Nota agregada a la ficha');
}
function registrarAccion(texto){
  const c = state.clientes.find(function(x){ return x.id===fichaActualId; });
  if(!c) return;
  c.actividad.unshift({fecha:nowLabel(), texto:texto});
  renderFichaActividad(c);
  showToast(texto);
}

/* ============================= GESTIÓN ============================= */
const GESTION_FILTROS = ['Todos','No contactado','Volver a llamar','Contactado','Interesado','Visita agendada','No interesado','Cerrado'];
function renderFilterPills(){
  document.getElementById('filterPills').innerHTML = GESTION_FILTROS.map(function(f){
    return '<button class="filter-pill '+(f===gestionFiltro?'active':'')+'" onclick="setGestionFiltro(\''+f+'\')">'+f+'</button>';
  }).join('');
}
function setGestionFiltro(f){ gestionFiltro = f; renderFilterPills(); renderGestionTable(); }
function renderGestionTable(){
  let rows = gestionFiltro==='Todos' ? state.gestiones : state.gestiones.filter(function(g){ return g.estado===gestionFiltro; });
  const qEl = document.getElementById('searchGestion');
  const q = qEl ? qEl.value.toLowerCase() : '';
  if(q) rows = rows.filter(function(g){ return g.empresa.toLowerCase().indexOf(q)>=0 || (g.contacto||'').toLowerCase().indexOf(q)>=0 || g.asesor.toLowerCase().indexOf(q)>=0; });
  document.getElementById('gestionCount').textContent = rows.length + ' gestion' + (rows.length===1?'':'es') + ' · filtradas';
  document.getElementById('gestionTable').innerHTML = rows.map(function(g){
    const targetFn = g.clienteId ? 'openFicha('+g.clienteId+')' : 'verEmpresaHistorial('+g.empresaId+')';
    return '<tr onclick="'+targetFn+'">'+
      '<td data-label="Empresa" style="font-weight:700">'+g.empresa+'</td>'+
      '<td data-label="Contacto">'+(g.contacto||'—')+'</td>'+
      '<td data-label="Estado"><span class="pill pill-info">'+g.estado+'</span></td>'+
      '<td data-label="Producto">'+g.producto+'</td>'+
      '<td data-label="Canal">'+g.canal+'</td>'+
      '<td data-label="Próxima fecha">'+(g.proxFecha||'—')+'</td>'+
      '<td data-label="Asesor">'+g.asesor+'</td>'+
      '<td data-label="Detalle" style="max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="'+g.detalle.replace(/"/g,'&quot;')+'">'+g.detalle+'</td>'+
      '<td data-label="Acción"><button class="btn btn-ghost btn-small" onclick="event.stopPropagation();'+targetFn+'">Ver</button></td>'+
    '</tr>';
  }).join('') || '<tr><td colspan="9" class="empty-state">Sin gestiones registradas en este filtro.</td></tr>';
}
function toggleGestionVinculo(){
  const v = document.getElementById('ges-vinculo').value;
  document.getElementById('ges-clienteWrap').classList.toggle('hidden', v!=='contacto');
  document.getElementById('ges-empresaWrap').classList.toggle('hidden', v!=='empresa');
  document.getElementById('ges-clienteId').required = (v==='contacto');
}
function openGestionModal(clienteId){
  fillClienteSelects();
  document.getElementById('ges-vinculo').value = 'contacto';
  toggleGestionVinculo();
  document.getElementById('ges-clienteId').value = clienteId || (state.clientes[0] ? state.clientes[0].id : '');
  document.getElementById('ges-empresaId').value = state.empresas[0] ? state.empresas[0].id : '';
  document.getElementById('ges-estado').value = 'Contactado';
  document.getElementById('ges-canal').value = 'Llamada';
  document.getElementById('ges-producto').value = '';
  document.getElementById('ges-fecha').value = '';
  document.getElementById('ges-asesor').value = '';
  document.getElementById('ges-detalle').value = '';
  openModal('modal-gestion');
}
function submitGestion(e){
  e.preventDefault();
  const vinculo = document.getElementById('ges-vinculo').value;
  const estado = document.getElementById('ges-estado').value;
  const canal = document.getElementById('ges-canal').value;
  const producto = document.getElementById('ges-producto').value.trim();
  const proxFecha = document.getElementById('ges-fecha').value;
  const asesor = document.getElementById('ges-asesor').value.trim();
  const detalle = document.getElementById('ges-detalle').value.trim();
  const notaTexto = 'Gestión ('+estado+' · '+canal+' · '+asesor+'): '+detalle;
  if(vinculo==='contacto'){
    const clienteId = Number(document.getElementById('ges-clienteId').value);
    const c = state.clientes.find(function(x){ return x.id===clienteId; });
    if(!c) return;
    state.gestiones.unshift({id:uid(), clienteId:clienteId, empresaId:null, empresa:c.empresa, contacto:c.contacto, estado:estado, producto:producto, canal:canal, proxFecha:proxFecha, asesor:asesor, detalle:detalle, fecha:nowLabel()});
    c.actividad.unshift({fecha:nowLabel(), texto:notaTexto});
    showToast('Gestión registrada en la ficha de '+c.empresa);
  } else {
    const empresaId = Number(document.getElementById('ges-empresaId').value);
    const emp = state.empresas.find(function(x){ return x.id===empresaId; });
    if(!emp) return;
    state.gestiones.unshift({id:uid(), clienteId:null, empresaId:empresaId, empresa:emp.nombre, contacto:'—', estado:estado, producto:producto, canal:canal, proxFecha:proxFecha, asesor:asesor, detalle:detalle, fecha:nowLabel()});
    emp.actividad.unshift({fecha:nowLabel(), texto:notaTexto});
    showToast('Gestión registrada en el historial de '+emp.nombre);
  }
  closeModal('modal-gestion');
  renderAll();
}

/* ============================= LEADS ADS ============================= */
function renderAdsGrid(){
  const iconMap = {'Google Ads':'G','Meta Ads':'M','WhatsApp Ads':'W'};
  const colorMap = {'Google Ads':'#4285f4','Meta Ads':'#1877f2','WhatsApp Ads':'#25d366'};
  document.getElementById('adsGrid').innerHTML = state.canalesAds.map(function(a){
    const c = colorMap[a.plataforma];
    return '<div class="ads-card">'+
      '<div class="ads-card-head"><div class="ads-icon" style="background:'+c+'22;color:'+c+'">'+iconMap[a.plataforma]+'</div><div><div style="font-weight:800;font-size:13.5px">'+a.plataforma+'</div>'+
      '<div class="ads-status"><span class="ads-dot" style="background:'+(a.conectado?'#17a673':'#e5484d')+'"></span>'+(a.conectado?'Conectado':'Desconectado')+'</div></div></div>'+
      '<div class="text-muted" style="font-size:12px;margin-bottom:4px">Clientes potenciales hoy: <strong style="color:var(--ink-900)">'+a.leadsHoy+'</strong></div>'+
      '<div class="text-muted" style="font-size:12px;margin-bottom:12px">Eficiencia de captación: <strong style="color:var(--ink-900)">'+a.cpl+'</strong></div>'+
      '<button class="btn '+(a.conectado?'btn-ghost':'btn-primary')+' btn-small" style="width:100%" onclick="toggleCanalAds('+a.id+')">'+(a.conectado?'Desconectar':'Conectar')+'</button>'+
    '</div>';
  }).join('');
}
function toggleCanalAds(id){
  const a = state.canalesAds.find(function(x){ return x.id===id; });
  if(!a) return;
  a.conectado = !a.conectado;
  if(!a.conectado) a.leadsHoy = 0;
  renderAdsGrid();
  showToast(a.plataforma+' '+(a.conectado?'conectado':'desconectado'));
}
function renderLeadsList(){
  const qEl = document.getElementById('searchLeads');
  const q = qEl ? qEl.value.toLowerCase() : '';
  const filtrados = state.leadsEntrantes.filter(function(l){ return !q || l.empresa.toLowerCase().indexOf(q)>=0 || l.campana.toLowerCase().indexOf(q)>=0; });
  document.getElementById('leadsList').innerHTML = filtrados.map(function(l){
    return '<div class="lead-item">'+
      '<div class="lead-info"><div class="lead-empresa">'+l.empresa+(l.contacto!=='—'?' — '+l.contacto:'')+'</div><div class="lead-meta">'+l.campana+' &middot; '+l.plataforma+' &middot; '+l.fecha+'</div></div>'+
      (l.convertido ? '<span class="pill pill-success">Convertido</span>' : '<button class="btn btn-primary btn-small" onclick="convertirLeadAds('+l.id+')">Convertir a prospecto</button>')+
    '</div>';
  }).join('') || '<div class="empty-state">No hay clientes potenciales entrantes por ahora</div>';
}
function convertirLeadAds(leadId){
  const l = state.leadsEntrantes.find(function(x){ return x.id===leadId; });
  if(!l || l.convertido) return;
  const nuevo = {
    id: uid(), empresa: l.empresa, empresaId: null,
    contacto: l.contacto!=='—' ? l.contacto : 'Por confirmar',
    email: slug(l.contacto!=='—'?l.contacto:'contacto') + '@' + slug(l.empresa) + '.com',
    telefono: '+57 1 000 0000', estado:'Prospecto', etapa:'Prospecto', valor:15000000, probabilidad:20,
    canal: l.plataforma==='WhatsApp Ads' ? 'WhatsApp' : 'Ads',
    notas:[], actividad:[{fecha:nowLabel(), texto:'Cliente potencial convertido desde campaña "'+l.campana+'" ('+l.plataforma+').'}]
  };
  state.clientes.push(nuevo);
  l.convertido = true;
  renderAll();
  showToast(l.empresa+' convertido a prospecto');
}
const NOMBRES_LEAD = [['Constructora Andina','Felipe Ortiz'],['Salud Total EPS','Diana Ramírez'],['Autopartes del Valle','Jorge Castaño'],['Moda Urbana','Camila Rojas'],['AgroExporta','Manuel Peña']];
const CAMPANAS_LEAD = [['Solución empresarial — Búsqueda','Google Ads'],['Campaña WhatsApp — LATAM','Meta Ads'],['Servicio de soporte — Conversión','Google Ads'],['Capacitación corporativa — Retargeting','Meta Ads']];
function simularLeadEntrante(){
  const n = NOMBRES_LEAD[Math.floor(Math.random()*NOMBRES_LEAD.length)];
  const cmp = CAMPANAS_LEAD[Math.floor(Math.random()*CAMPANAS_LEAD.length)];
  state.leadsEntrantes.unshift({id:uid(), empresa:n[0], contacto:n[1], campana:cmp[0], plataforma:cmp[1], fecha:nowLabel(), convertido:false});
  const canal = state.canalesAds.find(function(a){ return a.plataforma===cmp[1]; });
  if(canal && canal.conectado) canal.leadsHoy++;
  renderAll();
  showToast('Nuevo cliente potencial recibido: '+n[0]);
}

/* ============================= AUTOMATIZACIONES ============================= */
function renderAutoList(){
  const qEl = document.getElementById('searchAuto');
  const q = qEl ? qEl.value.toLowerCase() : '';
  const filtradas = state.automatizaciones.filter(function(a){ return !q || a.nombre.toLowerCase().indexOf(q)>=0; });
  document.getElementById('autoList').innerHTML = filtradas.map(function(a){
    return '<div class="auto-list-item '+(a.id===autoSeleccionada?'active':'')+'" onclick="selectAutomatizacion(\''+a.id+'\')">'+
      '<div class="auto-list-name">'+a.nombre+'</div>'+
      '<div class="auto-list-sub">'+(a.activa?'&#128994; Activa':'&#9899; Pausada')+'</div>'+
    '</div>';
  }).join('');
}
function selectAutomatizacion(id){ autoSeleccionada = id; nodoSeleccionado = null; renderAll(); }
function crearAutomatizacion(){
  const nombre = prompt('Nombre de la nueva automatización:', 'Nueva automatización');
  if(!nombre) return;
  const id = 'auto_'+uid();
  state.automatizaciones.push({id:id, nombre:nombre, version:'Automatización pausada', activa:false,
    nodos:[{id:'n'+uid(), tipo:'TRIGGER', titulo:'Nuevo disparador', campos:{'Origen':'Define el origen del trigger'}}]});
  autoSeleccionada = id; nodoSeleccionado = null;
  renderAll();
  showToast('Automatización creada — agrégale nodos');
}
function renombrarAutomatizacion(){
  const auto = state.automatizaciones.find(function(a){ return a.id===autoSeleccionada; });
  const nombre = prompt('Nuevo nombre:', auto.nombre);
  if(!nombre) return;
  auto.nombre = nombre;
  renderAll();
  showToast('Automatización renombrada');
}
function agregarNodo(){
  const auto = state.automatizaciones.find(function(a){ return a.id===autoSeleccionada; });
  const nuevo = {id:'n'+uid(), tipo:'ACTION', titulo:'Nueva acción', campos:{'Detalle':'Configura este paso'}};
  auto.nodos.push(nuevo);
  nodoSeleccionado = nuevo.id;
  renderAll();
  showToast('Nodo agregado — edítalo en el panel derecho');
}
function eliminarNodo(nodeId){
  const auto = state.automatizaciones.find(function(a){ return a.id===autoSeleccionada; });
  if(auto.nodos.length<=1){ showToast('El flujo necesita al menos un nodo'); return; }
  auto.nodos = auto.nodos.filter(function(n){ return n.id!==nodeId; });
  if(nodoSeleccionado===nodeId) nodoSeleccionado = null;
  renderAll();
  showToast('Nodo eliminado');
}
function moverNodo(nodeId, direccion){
  const auto = state.automatizaciones.find(function(a){ return a.id===autoSeleccionada; });
  const idx = auto.nodos.findIndex(function(n){ return n.id===nodeId; });
  const nuevoIdx = idx + direccion;
  if(nuevoIdx<0 || nuevoIdx>=auto.nodos.length) return;
  const tmp = auto.nodos[idx]; auto.nodos[idx] = auto.nodos[nuevoIdx]; auto.nodos[nuevoIdx] = tmp;
  renderAll();
}
function renderFlow(){
  const auto = state.automatizaciones.find(function(a){ return a.id===autoSeleccionada; });
  if(!auto) return;
  document.getElementById('flowTitulo').textContent = auto.nombre;
  document.getElementById('flowVersion').textContent = auto.version;
  document.getElementById('flowActiva').checked = auto.activa;
  let html = '';
  auto.nodos.forEach(function(n, i){
    const sel = n.id===nodoSeleccionado ? ' selected' : '';
    html += '<div class="node-box'+sel+'" onclick="selectNode(\''+n.id+'\')">'+
      '<span class="node-type '+n.tipo+'">'+n.tipo+'</span>'+
      '<div class="node-title">'+n.titulo+'</div>'+
    '</div>';
    if(n.tipo==='CONDITION' && n.ramas){
      html += '<div class="flow-branches">'+n.ramas.map(function(r){
        return '<div class="branch-col"><span class="branch-label '+(r.label==='SÍ'?'si':'no')+'">'+r.label+'</span><div class="node-box" style="width:180px;text-align:center;cursor:default">'+r.destino+'</div></div>';
      }).join('')+'</div>';
    } else if(i < auto.nodos.length-1){
      html += '<div class="flow-arrow">&#8595;</div>';
    }
  });
  document.getElementById('flowCanvas').innerHTML = html;
  renderNodeDetails();
}
function selectNode(nodeId){ nodoSeleccionado = nodeId; renderFlow(); }
function renderNodeDetails(){
  const auto = state.automatizaciones.find(function(a){ return a.id===autoSeleccionada; });
  const panel = document.getElementById('nodeDetailsPanel');
  if(!nodoSeleccionado){
    panel.innerHTML = '<div class="node-details-empty">Selecciona un nodo del flujo<br>para ver y editar sus detalles</div>';
    return;
  }
  const n = auto.nodos.find(function(x){ return x.id===nodoSeleccionado; });
  const idx = auto.nodos.findIndex(function(x){ return x.id===nodoSeleccionado; });
  let camposHtml = '';
  if(n.campos){
    Object.keys(n.campos).forEach(function(k){
      camposHtml += '<div class="form-group"><label>'+k+'</label><input type="text" value="'+n.campos[k].replace(/"/g,'&quot;')+'" onchange="actualizarCampoNodo(\''+k.replace(/'/g,"\\'")+'\',this.value)"></div>';
    });
  }
  panel.innerHTML = '<div style="font-size:11px;font-weight:800;text-transform:uppercase;color:var(--ink-600);margin-bottom:10px">Detalles del nodo</div>'+
    '<div class="form-group"><label>Tipo</label><select onchange="actualizarTipoNodo(this.value)">'+
      ['TRIGGER','ACTION','CONDITION'].map(function(t){ return '<option value="'+t+'"'+(t===n.tipo?' selected':'')+'>'+t+'</option>'; }).join('')+
    '</select></div>'+
    '<div class="form-group"><label>Título</label><input type="text" value="'+n.titulo.replace(/"/g,'&quot;')+'" onchange="actualizarTituloNodo(this.value)"></div>'+
    camposHtml+
    (n.ramas ? '<div class="fichaField"><div class="fichaFieldLabel">Ramas de la condición</div>'+n.ramas.map(function(r){ return '<div class="fichaFieldVal" style="margin-top:4px">'+r.label+' &rarr; '+r.destino+'</div>'; }).join('')+'</div>' : '')+
    '<div style="display:flex;gap:6px;margin-top:14px;flex-wrap:wrap">'+
      '<button class="btn btn-ghost btn-small" onclick="moverNodo(\''+n.id+'\',-1)" '+(idx===0?'disabled':'')+'>&uarr; Subir</button>'+
      '<button class="btn btn-ghost btn-small" onclick="moverNodo(\''+n.id+'\',1)" '+(idx===auto.nodos.length-1?'disabled':'')+'>&darr; Bajar</button>'+
      '<button class="btn btn-ghost btn-small" style="color:var(--bad)" onclick="eliminarNodo(\''+n.id+'\')">Eliminar</button>'+
    '</div>';
}
function actualizarTituloNodo(valor){
  const auto = state.automatizaciones.find(function(a){ return a.id===autoSeleccionada; });
  const n = auto.nodos.find(function(x){ return x.id===nodoSeleccionado; });
  n.titulo = valor; renderFlow();
}
function actualizarTipoNodo(valor){
  const auto = state.automatizaciones.find(function(a){ return a.id===autoSeleccionada; });
  const n = auto.nodos.find(function(x){ return x.id===nodoSeleccionado; });
  n.tipo = valor; renderFlow();
}
function actualizarCampoNodo(key, valor){
  const auto = state.automatizaciones.find(function(a){ return a.id===autoSeleccionada; });
  const n = auto.nodos.find(function(x){ return x.id===nodoSeleccionado; });
  n.campos[key] = valor;
}
function toggleAutomatizacionActiva(){
  const auto = state.automatizaciones.find(function(a){ return a.id===autoSeleccionada; });
  auto.activa = document.getElementById('flowActiva').checked;
  auto.version = auto.activa ? 'Automatización activa' : 'Automatización pausada';
  renderAutoList();
  showToast(auto.nombre+' '+(auto.activa?'activada':'pausada'));
}
function guardarAutomatizacion(){ showToast('Cambios guardados'); }
function publicarAutomatizacion(){ showToast('Automatización publicada correctamente'); }

/* ============================= SMS Y WHATSAPP ============================= */
function renderPlantillas(){
  const qSms = (document.getElementById('searchTplSMS') ? document.getElementById('searchTplSMS').value : '').toLowerCase();
  const qWa = (document.getElementById('searchTplWA') ? document.getElementById('searchTplWA').value : '').toLowerCase();
  document.getElementById('templatesSMS').innerHTML = state.plantillas.SMS.filter(function(t){ return !qSms || t.nombre.toLowerCase().indexOf(qSms)>=0; }).map(function(t){
    return '<div class="template-card"><div class="template-name">'+t.nombre+'</div><div class="template-preview">"'+t.texto+'"</div><div class="template-type">SMS</div></div>';
  }).join('') || '<div class="empty-state">Sin resultados</div>';
  document.getElementById('templatesWA').innerHTML = state.plantillas.WhatsApp.filter(function(t){ return !qWa || t.nombre.toLowerCase().indexOf(qWa)>=0; }).map(function(t){
    return '<div class="template-card"><div class="template-name">'+t.nombre+'</div><div class="template-preview">'+t.texto+'</div><div class="template-type">WhatsApp</div></div>';
  }).join('') || '<div class="empty-state">Sin resultados</div>';
}
function openTemplateModal(tipo){
  document.getElementById('tpl-tipo').value = tipo;
  document.getElementById('modalTemplateTitle').textContent = 'Nueva plantilla '+tipo;
  document.getElementById('tpl-nombre').value='';
  document.getElementById('tpl-texto').value='';
  openModal('modal-template');
}
function submitTemplate(e){
  e.preventDefault();
  const tipo = document.getElementById('tpl-tipo').value;
  state.plantillas[tipo].push({id:uid(), nombre:document.getElementById('tpl-nombre').value.trim(), texto:document.getElementById('tpl-texto').value.trim()});
  closeModal('modal-template');
  renderAll();
  showToast('Plantilla de '+tipo+' guardada');
}
function todasPlantillas(){
  return state.plantillas.SMS.map(function(t){ return Object.assign({},t,{canal:'SMS'}); }).concat(state.plantillas.WhatsApp.map(function(t){ return Object.assign({},t,{canal:'WhatsApp'}); }));
}
function openCampanaModal(clienteIdPreset){
  const sel = document.getElementById('camp-template');
  sel.innerHTML = todasPlantillas().map(function(t){ return '<option value="'+t.canal+'-'+t.id+'">'+t.nombre+' ('+t.canal+')</option>'; }).join('');
  const clienteSel = document.getElementById('camp-clienteId');
  clienteSel.innerHTML = state.clientes.map(function(c){ return '<option value="'+c.id+'">'+c.empresa+' ('+c.contacto+')</option>'; }).join('');
  document.getElementById('camp-segmento').value = clienteIdPreset ? 'individual' : '';
  if(clienteIdPreset) clienteSel.value = clienteIdPreset;
  toggleCampanaSegmento();
  openModal('modal-campana');
}
function toggleCampanaSegmento(){
  const seg = document.getElementById('camp-segmento').value;
  document.getElementById('camp-individualWrap').classList.toggle('hidden', seg!=='individual');
  if(seg==='individual'){
    document.getElementById('campanaPreviewCount').textContent = '1 contacto seleccionado recibirá el mensaje.';
  } else {
    const count = seg ? state.clientes.filter(function(c){ return c.estado===seg; }).length : state.clientes.length;
    document.getElementById('campanaPreviewCount').textContent = count+' contacto(s) recibirán el mensaje'+(seg?' (segmento: '+seg+')':' (todos)')+'.';
  }
}
function submitCampana(e){
  e.preventDefault();
  const val = document.getElementById('camp-template').value.split('-');
  const canal = val[0], tplId = val[1];
  const tpl = todasPlantillas().find(function(t){ return String(t.id)===tplId && t.canal===canal; });
  const seg = document.getElementById('camp-segmento').value;
  let targets;
  if(seg==='individual'){
    const cid = Number(document.getElementById('camp-clienteId').value);
    targets = state.clientes.filter(function(c){ return c.id===cid; });
  } else {
    targets = seg ? state.clientes.filter(function(c){ return c.estado===seg; }) : state.clientes;
  }
  targets.forEach(function(c){ c.actividad.unshift({fecha:nowLabel(), texto:'Campaña '+canal+' recibida: "'+tpl.nombre+'"'}); });
  state.campanas.unshift({fecha:nowLabel(), template:tpl.nombre, canal:canal, segmento: seg==='individual' ? ('Individual: '+targets[0].empresa) : (seg||'Todos'), cantidad: targets.length});
  closeModal('modal-campana');
  renderAll();
  showToast('Campaña enviada a '+targets.length+' contacto(s)');
}
function renderCampanas(){
  document.getElementById('campanasTable').innerHTML = state.campanas.map(function(c){
    return '<tr class="no-click"><td>'+c.fecha+'</td><td>'+c.template+'</td><td><span class="pill pill-info">'+c.canal+'</span></td><td>'+c.segmento+'</td><td>'+c.cantidad+'</td></tr>';
  }).join('') || '<tr><td colspan="5" class="empty-state">Aún no se ha enviado ninguna campaña</td></tr>';
}

/* ============================= AGENDA ============================= */
function renderCalendar(){
  const eventDays = {};
  state.eventos.forEach(function(e){ if(e.fecha.indexOf('2026-08')===0) eventDays[Number(e.fecha.split('-')[2])] = true; });
  let html = '<div class="calendar-header"><span>Agosto 2026</span></div><div class="calendar-days">'+['Do','Lu','Ma','Mi','Ju','Vi','Sa'].map(function(d){ return '<div class="calendar-day">'+d+'</div>'; }).join('')+'</div><div class="calendar-dates">';
  [26,27,28,29,30,31].forEach(function(d){ html += '<div class="calendar-date other">'+d+'</div>'; });
  for(let d=1; d<=31; d++){
    let cls = 'calendar-date';
    if(d===11) cls += ' today';
    if(eventDays[d]) cls += ' hasEvent';
    html += '<div class="'+cls+'">'+d+'</div>';
  }
  html += '<div class="calendar-date other">1</div></div>';
  document.getElementById('calendarMini').innerHTML = html;
}
function renderEventos(){
  const qEl = document.getElementById('searchAgenda');
  const q = qEl ? qEl.value.toLowerCase() : '';
  const sorted = state.eventos.slice().filter(function(ev){ return !q || ev.titulo.toLowerCase().indexOf(q)>=0; }).sort(function(a,b){ return (a.fecha+a.hora).localeCompare(b.fecha+b.hora); });
  document.getElementById('eventosList').innerHTML = sorted.map(function(ev){
    const cliente = state.clientes.find(function(c){ return c.id===ev.clienteId; });
    return '<div style="margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid var(--line)">'+
      '<div style="font-size:12px;font-weight:700;color:var(--blue-500);margin-bottom:4px">'+ev.fecha+' &middot; '+ev.hora+'</div>'+
      '<div style="font-size:13px;font-weight:600;margin-bottom:4px">'+ev.titulo+'</div>'+
      (cliente ? '<div style="font-size:12px;color:var(--ink-600);cursor:pointer" onclick="openFicha('+cliente.id+')">'+cliente.contacto+' — '+cliente.empresa+'</div>' : '')+
    '</div>';
  }).join('') || '<div class="empty-state">No hay eventos programados</div>';
}
function openEventoModal(clienteId){
  document.getElementById('ev-titulo').value='';
  document.getElementById('ev-fecha').value=todayISO();
  document.getElementById('ev-hora').value='';
  fillClienteSelects();
  document.getElementById('ev-clienteId').value = clienteId||'';
  openModal('modal-evento');
}
function submitEvento(e){
  e.preventDefault();
  const clienteId = document.getElementById('ev-clienteId').value;
  const titulo = document.getElementById('ev-titulo').value.trim();
  state.eventos.push({
    id: uid(), titulo: titulo,
    fecha: document.getElementById('ev-fecha').value,
    hora: document.getElementById('ev-hora').value,
    clienteId: clienteId ? Number(clienteId) : null
  });
  if(clienteId){
    const c = state.clientes.find(function(x){ return x.id===Number(clienteId); });
    c.actividad.unshift({fecha:nowLabel(), texto:'Evento agendado: '+titulo});
  }
  closeModal('modal-evento');
  renderAll();
  showToast('Evento creado en la agenda');
}

/* ============================= CORREO ============================= */
function switchCorreoTab(tab){
  document.getElementById('tabRecibidos').classList.toggle('active', tab==='recibidos');
  document.getElementById('tabEnviados').classList.toggle('active', tab==='enviados');
  document.getElementById('emailRecibidos').classList.toggle('hidden', tab!=='recibidos');
  document.getElementById('emailEnviados').classList.toggle('hidden', tab!=='enviados');
}
function renderCorreoRecibidos(){
  const qEl = document.getElementById('searchCorreo');
  const q = qEl ? qEl.value.toLowerCase() : '';
  const filtrados = state.correosRecibidos.filter(function(m){ return !q || m.from.toLowerCase().indexOf(q)>=0 || m.subject.toLowerCase().indexOf(q)>=0; });
  document.getElementById('emailRecibidos').innerHTML = filtrados.map(function(m){
    return '<div class="email-item"><span class="email-time">'+m.time+'</span><div class="email-from">'+m.from+'</div><div class="email-subject">'+m.subject+'</div><div class="email-preview">'+m.preview+'</div></div>';
  }).join('') || '<div class="empty-state">Sin resultados</div>';
}
function renderCorreoEnviados(){
  const qEl = document.getElementById('searchCorreo');
  const q = qEl ? qEl.value.toLowerCase() : '';
  const filtrados = state.correosEnviados.filter(function(m){ return !q || m.para.toLowerCase().indexOf(q)>=0 || m.asunto.toLowerCase().indexOf(q)>=0; });
  document.getElementById('emailEnviados').innerHTML = filtrados.length ? filtrados.map(function(m){
    return '<div class="email-item"><span class="email-time">'+m.time+'</span><div class="email-from">Para: '+m.para+'</div><div class="email-subject">'+m.asunto+'</div><div class="email-preview">'+m.cuerpo.slice(0,90)+(m.cuerpo.length>90?'...':'')+'</div></div>';
  }).join('') : '<div class="empty-state">Aún no has enviado correos en esta sesión</div>';
}
function openCorreoModal(){
  document.getElementById('mail-para').value='';
  document.getElementById('mail-asunto').value='';
  document.getElementById('mail-cuerpo').value='';
  openModal('modal-correo');
}
function submitCorreo(e){
  e.preventDefault();
  const para = document.getElementById('mail-para').value.trim();
  const asunto = document.getElementById('mail-asunto').value.trim();
  const cuerpo = document.getElementById('mail-cuerpo').value.trim();
  state.correosEnviados.unshift({para:para, asunto:asunto, cuerpo:cuerpo, time: nowLabel()});
  const cliente = state.clientes.find(function(c){ return c.email.toLowerCase()===para.toLowerCase(); });
  if(cliente){
    cliente.actividad.unshift({fecha:nowLabel(), texto:'Correo enviado: "'+asunto+'"'});
    showToast('Correo enviado y anotado en la ficha de '+cliente.empresa);
  } else {
    showToast('Correo enviado correctamente');
  }
  closeModal('modal-correo');
  switchCorreoTab('enviados');
  renderAll();
}

/* ============================= APIS ============================= */
function renderApisGrid(){
  const qEl = document.getElementById('searchApis');
  const q = qEl ? qEl.value.toLowerCase() : '';
  const filtradas = state.apis.filter(function(a){ return !q || a.nombre.toLowerCase().indexOf(q)>=0 || a.categoria.toLowerCase().indexOf(q)>=0; });
  document.getElementById('apisGrid').innerHTML = filtradas.map(function(a){
    const camposHtml = a.campos.map(function(c,idx){
      return '<div class="form-group" style="margin-bottom:0"><label>'+c.label+'</label><input type="text" value="'+(c.value||'')+'" onchange="updateApiCampo('+a.id+','+idx+',this.value)" placeholder="Sin configurar"></div>';
    }).join('');
    return '<div class="api-card">'+
      '<div class="api-card-head"><div class="api-icon">'+a.icono+'</div><div><div class="api-name">'+a.nombre+'</div><div class="api-cat">'+a.categoria+'</div></div>'+
      '<div class="api-status"><span class="api-dot" style="background:'+(a.conectado?'#17a673':'#e5484d')+'"></span>'+(a.conectado?'Conectado':'No conectado')+'</div></div>'+
      '<div class="api-fields">'+camposHtml+'</div>'+
      '<div style="display:flex;gap:8px">'+
        '<button class="btn '+(a.conectado?'btn-ghost':'btn-primary')+' btn-small" onclick="toggleApiConectado('+a.id+')">'+(a.conectado?'Desconectar':'Conectar')+'</button>'+
        (a.conectado ? '<button class="btn btn-ghost btn-small" onclick="probarConexionApi('+a.id+')">Probar conexión</button>' : '')+
      '</div>'+
    '</div>';
  }).join('');
}
function updateApiCampo(apiId, idx, value){
  const a = state.apis.find(function(x){ return x.id===apiId; });
  if(a) a.campos[idx].value = value;
}
function toggleApiConectado(id){
  const a = state.apis.find(function(x){ return x.id===id; });
  if(!a) return;
  a.conectado = !a.conectado;
  renderApisGrid();
  showToast(a.nombre+' '+(a.conectado?'conectado':'desconectado'));
}
function probarConexionApi(id){
  const a = state.apis.find(function(x){ return x.id===id; });
  if(!a) return;
  showToast('Probando conexión con '+a.nombre+'...');
  setTimeout(function(){ showToast('Conexión con '+a.nombre+' exitosa'); }, 700);
}

/* ============================= CONFIGURACIÓN / USUARIOS ============================= */
function renderUsuariosTable(){
  const qEl = document.getElementById('searchUsuarios');
  const q = qEl ? qEl.value.toLowerCase() : '';
  const filtrados = state.usuarios.filter(function(u){ return !q || u.nombre.toLowerCase().indexOf(q)>=0 || u.correo.toLowerCase().indexOf(q)>=0; });
  document.getElementById('usuariosTable').innerHTML = filtrados.map(function(u){
    const roleClass = u.rol==='Administrador'?'role-Administrador':u.rol==='Supervisor'?'role-Supervisor':u.rol==='Asesor'?'role-Asesor':'role-Lectura';
    const roleLabel = u.rol==='Asesor' ? 'Gestor de Crédito' : (u.rol==='Lectura' ? 'Solo lectura' : u.rol);
    return '<tr class="no-click">'+
      '<td style="font-weight:700">'+u.nombre+'</td>'+
      '<td>'+u.correo+'</td>'+
      '<td><span class="role-badge '+roleClass+'">'+roleLabel+'</span></td>'+
      '<td>'+pill(u.estado)+'</td>'+
      '<td><button class="btn btn-ghost btn-small" onclick="toggleUsuarioEstado('+u.id+')">'+(u.estado==='Activo'?'Desactivar':'Activar')+'</button></td>'+
    '</tr>';
  }).join('') || '<tr><td colspan="5" class="empty-state">No hay usuarios registrados</td></tr>';
}
function openUsuarioModal(){
  document.getElementById('usr-nombre').value='';
  document.getElementById('usr-correo').value='';
  document.getElementById('usr-rol').value='Asesor';
  document.getElementById('usr-estado').value='Activo';
  openModal('modal-usuario');
}
function submitUsuario(e){
  e.preventDefault();
  state.usuarios.push({
    id: uid(), nombre: document.getElementById('usr-nombre').value.trim(), correo: document.getElementById('usr-correo').value.trim(),
    rol: document.getElementById('usr-rol').value, estado: document.getElementById('usr-estado').value
  });
  closeModal('modal-usuario');
  renderAll();
  showToast('Usuario creado correctamente');
}
function toggleUsuarioEstado(id){
  const u = state.usuarios.find(function(x){ return x.id===id; });
  if(!u) return;
  u.estado = u.estado==='Activo' ? 'Inactivo' : 'Activo';
  renderUsuariosTable();
  showToast(u.nombre+' ahora está '+u.estado.toLowerCase());
}

/* ============================= AVA CHAT WIDGET ============================= */
function toggleAVAChat(){ document.getElementById('avaPreview').classList.toggle('open'); }
function sendAvaMessage(){
  const input = document.getElementById('avaInput');
  const msg = input.value.trim();
  if(!msg) return;
  const box = document.getElementById('avaMsgs');
  box.insertAdjacentHTML('beforeend', '<div class="ava-preview-msg user">'+msg+'</div>');
  input.value='';
  box.scrollTop = box.scrollHeight;
  setTimeout(function(){
    const low = msg.toLowerCase();
    let reply = 'Anoté tu mensaje. Un gestor dará seguimiento a tu solicitud desde AVA CRM.';
    if(low.indexOf('monto')>=0||low.indexOf('cuánto')>=0||low.indexOf('cuanto')>=0) reply = 'Puedo ayudarte a registrar el monto que necesitas para tu solicitud de crédito. ¿Qué monto deseas solicitar?';
    else if(low.indexOf('buró')>=0||low.indexOf('buro')>=0) reply = 'La consulta de buró se realiza una vez tu solicitud está registrada. ¿Deseas que te ayude a completarla?';
    else if(low.indexOf('hola')>=0) reply = '¡Hola! Soy AVA, el asistente de crédito de Veteranos RD. ¿Deseas iniciar una solicitud de crédito?';
    box.insertAdjacentHTML('beforeend', '<div class="ava-preview-msg">'+reply+'</div>');
    box.scrollTop = box.scrollHeight;
  }, 500);
}

/* ============================= RECORRIDO GUIADO ============================= */
const tourSteps = [
  {view:'dashboard', target:'.dashboard-hero', title:'Dashboard', text:'Cartera activa, solicitudes en proceso, mora y colocación se consultan en una sola vista ejecutiva.'},
  {view:'marketing', target:'.workspace-grid', title:'AVA', text:'AVA recibe la solicitud del veterano: identificación, monto, ingresos y documentos, de forma conversacional.', action:function(){switchMarketingTab('avachat',document.querySelectorAll('#page-marketing .marketing-tabs .marketing-tab')[0]);}},
  {view:'clientes', target:'#clientesTableWrap', title:'Solicitudes de Crédito', text:'Cada solicitud capturada por AVA se convierte en un expediente: monto, etapa, documentos e historial.'},
  {view:'pipeline', target:'#kanbanBoard', title:'Prospectos / Leads', text:'Sigue cada solicitante por etapa: nueva solicitud, en revisión, buró consultado, precalificada, aprobada.', action:function(){closeDrawer();}},
  {view:'buro', target:'#buroTable', title:'Buró de Crédito', text:'Consulta de buró simulada por solicitud: riesgo, obligaciones y alertas.'},
  {view:'precalificacion', target:'#precalificacionTable', title:'Precalificación', text:'Motor de precalificación simulado: capacidad estimada, riesgo y resultado automatizado.'},
  {view:'cotizaciones', target:'#quotesTable', title:'Créditos', text:'El ciclo del crédito: cliente, monto, plazo, saldo y estado, simulado de inicio a fin.'},
  {view:'cobranza', target:'#cobranzaTable', title:'Cobranza / Cartera', text:'Cartera total, créditos al día, vencimientos y mora, con historial de contacto y promesas de pago.'},
  {view:'gestiones', target:'#followupAlerts', title:'Gestiones', text:'Centraliza tareas, alertas de seguimiento e historial de actividades relacionadas con las solicitudes.', action:function(){switchGestionesTab('tareas',document.querySelectorAll('#page-gestiones .page-tools .marketing-tab')[0]);}},
  {view:'agenda', target:'#calendarMini', title:'Agenda', text:'Consulta citas y programa seguimientos vinculados a solicitantes.'},
  {view:'reportes', target:'.report-grid', title:'Reportes', text:'La gerencia visualiza solicitudes, colocación, cartera, cobranza y productividad con exportación a Excel.'},
  {view:'config', target:'#usuariosTable', title:'Configuración', text:'Administra usuarios, roles, moneda y preferencias del sistema.'}
];
let tourIdx=0, tourTargetEl=null;
function startTour(){ toggleSidebar(false); tourIdx=0; showTourStep(); }
function clearTourSpot(){ if(tourTargetEl){ tourTargetEl.classList.remove('tour-spot'); tourTargetEl=null; } }
function endTour(){ clearTourSpot(); const d=document.getElementById('tourDim'); if(d) d.remove(); const c=document.getElementById('tourCard'); if(c) c.remove(); }
function showTourStep(){
  clearTourSpot();
  const step = tourSteps[tourIdx];
  const isRepeatView = tourIdx>0 && tourSteps[tourIdx-1].view===step.view;
  navigate(step.view);
  const baseDelay = isRepeatView ? 60 : 160;
  setTimeout(function(){
    if(step.action) step.action();
    setTimeout(function(){
      const el = step.target ? document.querySelector(step.target) : null;
      if(el){
        el.classList.add('tour-spot');
        tourTargetEl = el;
        if(typeof el.scrollIntoView==='function') el.scrollIntoView({behavior:'smooth', block:'center'});
      }
      renderTourCard(step);
    }, step.action ? (step.actionDelay||300) : 20);
  }, baseDelay);
}
function renderTourCard(step){
  let dim = document.getElementById('tourDim');
  if(!dim){ dim = document.createElement('div'); dim.id='tourDim'; document.body.appendChild(dim); }
  let card = document.getElementById('tourCard');
  if(!card){ card = document.createElement('div'); card.id='tourCard'; card.className='lg-card'; document.body.appendChild(card); }
  const last = tourIdx===tourSteps.length-1;
  card.innerHTML =
    '<div class="lg-topline"></div>'+
    '<div class="lg-body">'+
      '<div class="lg-headrow"><span class="lg-badge">Recorrido guiado &middot; '+(tourIdx+1)+'/'+tourSteps.length+'</span><button class="lg-close" onclick="endTour()">&#10005;</button></div>'+
      '<div class="lg-titlerow"><div class="lg-icon">&#10024;</div><div class="lg-title">'+step.title+'</div></div>'+
      '<p class="lg-text">'+step.text+'</p>'+
      '<div class="lg-footrow">'+
        '<div class="lg-dots">'+tourSteps.map(function(s,i){ return '<div class="lg-dot '+(i===tourIdx?'on':'')+'"></div>'; }).join('')+'</div>'+
        '<div style="display:flex;gap:8px">'+
          (tourIdx>0?'<button class="lg-btn" onclick="tourIdx--;showTourStep()">&larr; Atrás</button>':'')+
          '<button class="lg-btn-primary" onclick="'+(last?'endTour()':'tourIdx++;showTourStep()')+'">'+(last?'Finalizar':'Siguiente')+'</button>'+
        '</div>'+
      '</div>'+
    '</div>';
}

/* ============================= INIT ============================= */
consolidateModules();
toggleGestionVinculo();
renderAll();

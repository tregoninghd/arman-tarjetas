(function(){
  const $ = id => document.getElementById(id);
  const ACCESS_CODE = "ARMAN2027"; // <-- para cambiar el código, edita este valor

  /* ---------- Gate ---------- */
  $('gateBtn').addEventListener('click', tryEnter);
  $('gateInput').addEventListener('keydown', e => { if(e.key === 'Enter') tryEnter(); });
  function tryEnter(){
    const val = $('gateInput').value.trim().toUpperCase();
    if(val === ACCESS_CODE){
      $('gateScreen').style.display = 'none';
      $('mainApp').style.display = 'block';
      initApp();
    } else {
      $('gateErr').textContent = 'Código incorrecto';
      $('gateInput').value = '';
    }
  }

  let appInitialized = false;
  function initApp(){
    if(appInitialized) return;
    appInitialized = true;

    /* Clock */
    function tick(){ $('clockNow').textContent = new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'}); }
    tick(); setInterval(tick,15000);

    /* Defaults */
    const now = new Date();
    $('fecha').value = now.toISOString().slice(0,10);
    $('hora').value = now.toTimeString().slice(0,5);

    /* Folio */
    function pad(n,l){ return String(n).padStart(l,'0'); }
    const folioDate = now.getFullYear().toString().slice(2) + pad(now.getMonth()+1,2) + pad(now.getDate(),2);
    const folio = 'TI-' + folioDate + '-' + pad(Math.floor(Math.random()*900+100),3);
    $('folioDisplay').textContent = folio;

    /* ---------- Chip groups (single select) ---------- */
    function buildSingleChips(containerId, options, defaultVal, colorFn){
      const el = $(containerId);
      let value = defaultVal;
      options.forEach(opt => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'chip-btn'; b.textContent = opt;
        if(opt === defaultVal){
          b.classList.add('active');
          const initialCls = colorFn ? colorFn(opt) : '';
          if(initialCls) b.classList.add(initialCls);
        }
        b.addEventListener('click', () => {
          value = opt;
          [...el.children].forEach(c => c.classList.remove('active','high','crit','ok'));
          b.classList.add('active');
          if(colorFn){ const c = colorFn(opt); if(c) b.classList.add(c); }
          el.dispatchEvent(new CustomEvent('change'));
          refreshTicket();
        });
        el.appendChild(b);
      });
      return { get: () => value };
    }

    /* ---------- Chip groups (multi select) ---------- */
    function buildMultiChips(containerId, options){
      const el = $(containerId);
      const state = new Set();
      options.forEach(opt => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'chip-btn'; b.textContent = opt;
        b.addEventListener('click', () => {
          if(state.has(opt)){ state.delete(opt); b.classList.remove('active'); }
          else { state.add(opt); b.classList.add('active'); }
        });
        el.appendChild(b);
      });
      return { get: () => [...state] };
    }

    const urgencia = buildSingleChips('urgenciaChips', ['Baja','Media','Alta','Crítica'], 'Baja',
      opt => opt==='Alta' ? 'high' : (opt==='Crítica' ? 'crit' : ''));
    const tipoIncidente = buildMultiChips('tipoIncidenteChips', [
      'Disturbios / agresión','Daños a infraestructura','Incidente vial',
      'Bajo efectos de alcohol o sustancias','Robo o hurto','Emergencia médica',
      'Falla o incumplimiento de personal','Queja de cliente','Reconocimiento positivo','Otro'
    ]);
    const hayResponsable = buildSingleChips('hayResponsableChips', ['Sí','No'], 'No', opt => opt==='Sí' ? 'ok' : '');
    const hayAutoridad = buildSingleChips('hayAutoridadChips', ['Sí','No'], 'No', opt => opt==='Sí' ? 'ok' : '');
    const evVideos = buildSingleChips('evVideosChips', ['Sí','No'], 'No', opt => opt==='Sí' ? 'ok' : '');
    const evFotos = buildSingleChips('evFotosChips', ['Sí','No'], 'No', opt => opt==='Sí' ? 'ok' : '');
    const evInformo = buildSingleChips('evInformoChips', ['Sí','No'], 'No', opt => opt==='Sí' ? 'ok' : '');

    $('hayResponsableChips').addEventListener('click', () => {
      $('responsableFields').style.display = hayResponsable.get()==='Sí' ? 'block' : 'none';
    });
    $('hayAutoridadChips').addEventListener('click', () => {
      $('autoridadFields').style.display = hayAutoridad.get()==='Sí' ? 'block' : 'none';
    });
    $('responsableFields').style.display = 'none';
    $('autoridadFields').style.display = 'none';

    /* ---------- Ticket live refresh ---------- */
    const statusMap = {
      'Baja':{cls:'baja',label:'PRIORIDAD BAJA'}, 'Media':{cls:'media',label:'PRIORIDAD MEDIA'},
      'Alta':{cls:'alta',label:'PRIORIDAD ALTA'}, 'Crítica':{cls:'critica',label:'PRIORIDAD CRÍTICA'}
    };
    function refreshTicket(){
      const chip = $('statusChip');
      const s = statusMap[urgencia.get()] || statusMap['Baja'];
      chip.className = 'status-chip ' + s.cls;
      chip.textContent = s.label;
      $('metaSupervisor').textContent = $('supervisor').value.trim() || '—';
      $('metaTurno').textContent = $('turno').value || '—';
    }
    ['supervisor'].forEach(id => $(id).addEventListener('input', refreshTicket));
    $('turno').addEventListener('change', refreshTicket);
    refreshTicket();

    /* ---------- Char counters ---------- */
    function bindCounter(fieldId, counterId, max){
      const el = $(fieldId), c = $(counterId);
      function upd(){
        const len = el.value.length;
        c.textContent = len + ' / ' + max;
        c.classList.toggle('near', len > max*0.85 && len <= max);
        c.classList.toggle('over', len >= max);
      }
      el.addEventListener('input', upd); upd();
    }
    bindCounter('hechos','countHechos',1800);
    bindCounter('antecedentes','countAntecedentes',500);
    bindCounter('acciones','countAcciones',600);
    bindCounter('medidas','countMedidas',500);

    /* ---------- Dynamic list: personas involucradas ---------- */
    function makeListManager(containerId, emptyHintId, addBtnId, placeholders){
      const container = $(containerId), emptyHint = $(emptyHintId), addBtn = $(addBtnId);
      const rows = [];
      function render(){
        emptyHint.style.display = rows.length ? 'none' : 'block';
      }
      function addRow(){
        const rowEl = document.createElement('div');
        rowEl.className = 'list-row';
        const in1 = document.createElement('input'); in1.type='text'; in1.placeholder = placeholders[0];
        const in2 = document.createElement('input'); in2.type='text'; in2.placeholder = placeholders[1];
        const del = document.createElement('button'); del.type='button'; del.className='row-del'; del.textContent='×';
        del.addEventListener('click', () => { rowEl.remove(); const idx = rows.indexOf(entry); if(idx>-1) rows.splice(idx,1); render(); });
        rowEl.appendChild(in1); rowEl.appendChild(in2); rowEl.appendChild(del);
        container.appendChild(rowEl);
        const entry = { get a(){return in1.value.trim();}, get b(){return in2.value.trim();} };
        rows.push(entry);
        render();
      }
      addBtn.addEventListener('click', addRow);
      addRow(); // start with one visible row
      return { getAll: () => rows.filter(r => r.a || r.b).map(r => ({a:r.a,b:r.b})) };
    }
    const personasList = makeListManager('listaPersonas','personasEmptyHint','addPersonaBtn',['Nombre','Rol / cargo']);
    const oficialesList = makeListManager('listaOficiales','oficialesEmptyHint','addOficialBtn',['Nombre del oficial','Cargo / corporación']);

    /* ---------- Photos ---------- */
    const MAX_PHOTOS = 6;
    let photos = []; // {dataUrl, bytes(Uint8Array), w, h}
    $('photoInput').addEventListener('change', async (e) => {
      const files = [...e.target.files].slice(0, MAX_PHOTOS - photos.length);
      for(const file of files){
        const resized = await resizeImage(file, 900);
        photos.push(resized);
        renderPhotoGrid();
      }
      e.target.value = '';
    });
    function renderPhotoGrid(){
      const grid = $('photoGrid');
      grid.innerHTML = '';
      photos.forEach((p, idx) => {
        const thumb = document.createElement('div'); thumb.className = 'photo-thumb';
        const img = document.createElement('img'); img.src = p.dataUrl;
        const rm = document.createElement('button'); rm.className = 'rm'; rm.textContent = '×';
        rm.addEventListener('click', () => { photos.splice(idx,1); renderPhotoGrid(); });
        thumb.appendChild(img); thumb.appendChild(rm);
        grid.appendChild(thumb);
      });
    }
    function resizeImage(file, maxDim){
      return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();
        reader.onload = () => {
          img.onload = () => {
            let w = img.width, h = img.height;
            if(w > h && w > maxDim){ h = Math.round(h * maxDim / w); w = maxDim; }
            else if(h >= w && h > maxDim){ w = Math.round(w * maxDim / h); h = maxDim; }
            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
            const base64 = dataUrl.split(',')[1];
            const bin = atob(base64);
            const bytes = new Uint8Array(bin.length);
            for(let i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
            resolve({ dataUrl, bytes, w, h });
          };
          img.onerror = reject;
          img.src = reader.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    /* ---------- Toast ---------- */
    function showToast(msg, isErr){
      const t = $('toast');
      t.textContent = msg;
      t.classList.toggle('err', !!isErr);
      t.classList.add('show');
      setTimeout(()=>t.classList.remove('show'), 2800);
    }

    /* ---------- Validation ---------- */
    function validate(){
      const missing = [];
      if(!$('supervisor').value.trim()) missing.push('Nombre del supervisor');
      if(!$('ubicacion').value.trim()) missing.push('Residencial / cliente');
      if(!$('lugarEspecifico').value.trim()) missing.push('Lugar específico');
      if(!$('tituloIncidente').value.trim()) missing.push('Título del incidente');
      if(!$('hechos').value.trim()) missing.push('Descripción de los hechos');
      if(!$('responsiva').checked) missing.push('Declaración de veracidad');
      return missing;
    }

    /* ---------- DOCX generation ---------- */
    let lastBlob = null, lastFileName = null;

    $('btnGenerar').addEventListener('click', async () => {
      const missing = validate();
      if(missing.length){ showToast('Falta: ' + missing.join(', '), true); return; }
      $('btnGenerar').disabled = true;
      $('btnGenerar').textContent = 'Generando...';
      try{
        const blob = await buildDocx();
        lastBlob = blob;
        lastFileName = folio + '.docx';
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = lastFileName;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(()=>URL.revokeObjectURL(url), 4000);
        showToast('Tarjeta generada: ' + lastFileName);
        if(navigator.canShare && navigator.share){ $('btnCompartir').style.display = 'block'; }
      }catch(err){
        console.error(err);
        showToast('Error al generar el documento', true);
      }finally{
        $('btnGenerar').disabled = false;
        $('btnGenerar').textContent = 'Generar tarjeta en Word';
      }
    });

    $('btnCompartir').addEventListener('click', async () => {
      if(!lastBlob) return;
      try{
        const file = new File([lastBlob], lastFileName, {type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
        if(navigator.canShare && navigator.canShare({files:[file]})){
          await navigator.share({files:[file], title:'Tarjeta informativa ' + folio});
        } else {
          showToast('Este dispositivo no permite compartir archivos directamente', true);
        }
      }catch(e){ /* cancelado por el usuario */ }
    });

    async function buildDocx(){
      const {
        Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        Header, Footer, ImageRun, AlignmentType, BorderStyle, WidthType,
        VerticalAlign, ShadingType, HeadingLevel
      } = docx;

      const GOLD = "E8A33D";
      const DARK = "12151A";
      const GRAY_BG = "F2F2F2";

      function labelCell(text){
        return new TableCell({
          width: { size: 26, type: WidthType.PERCENTAGE },
          shading: { fill: GRAY_BG },
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 100, bottom: 100, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 19 })] })]
        });
      }
      function valueCell(paragraphs){
        return new TableCell({
          width: { size: 74, type: WidthType.PERCENTAGE },
          verticalAlign: VerticalAlign.CENTER,
          margins: { top: 100, bottom: 100, left: 120, right: 120 },
          children: paragraphs
        });
      }
      function textParas(text, opts){
        opts = opts || {};
        const lines = (text || '—').split('\n').filter(l => l.trim().length || true);
        if(!lines.length) lines.push('—');
        return lines.map(line => new Paragraph({
          bullet: opts.bullet ? { level: 0 } : undefined,
          children: [new TextRun({ text: line || ' ', size: 19 })]
        }));
      }
      function labelRow(label, text, opts){
        return new TableRow({ children: [ labelCell(label), valueCell(textParas(text, opts)) ] });
      }
      function peopleRow(label, list){
        const paras = list.length
          ? list.map(p => new Paragraph({ bullet:{level:0}, children:[ new TextRun({ text: p.a + (p.b ? ' — ' + p.b : ''), size: 19 }) ] }))
          : textParas('—');
        return new TableRow({ children: [ labelCell(label), valueCell(paras) ] });
      }

      // ---- Header (letterhead) ----
      const logoBytes = base64ToBytes(window.__LOGO_B64__);
      const headerChildren = [
        new Paragraph({
          children: [
            new ImageRun({ data: logoBytes, type: 'png', transformation: { width: 46, height: 68 } }),
          ],
        }),
        new Paragraph({
          spacing: { before: 40, after: 80 },
          children: [ new TextRun({ text: 'ARMAN SEGURIDAD PRIVADA S.A DE C.V', bold: true, size: 22 }) ],
          border: { bottom: { color: GOLD, space: 4, style: BorderStyle.SINGLE, size: 16 } }
        }),
      ];

      // ---- Footer ----
      function footerLine(text){
        return new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [ new TextRun({ text, size: 14, color: '666666' }) ]
        });
      }
      const footerChildren = [
        new Paragraph({ border: { top: { color: GOLD, space: 4, style: BorderStyle.SINGLE, size: 16 } }, children: [] }),
        footerLine('AUTORIZACIÓN ESTATAL: DRSESSP / 653 / 2022'),
        footerLine('CALLE VENADO, SMZ 20, MZ 17, L 1 – 01. CANCÚN, QUINTANA ROO. CP: 77500'),
        footerLine('TELÉFONO: 998 89 23 533 / CORREO: armanss1510@gmail.com'),
        footerLine('MODALIDAD: I PROTECCIÓN Y VIGILANCIA DE BIENES MUEBLES E INMUEBLES Y DE PERSONAS FÍSICAS'),
        footerLine('CARACTERÍSTICA III. SIN PORTACIÓN DE ARMAS.'),
      ];

      // ---- Title table ----
      const titleTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [
            labelCell('LUGAR'),
            new TableCell({ width:{size:48,type:WidthType.PERCENTAGE}, shading:{fill:GRAY_BG}, verticalAlign:VerticalAlign.CENTER, margins:{top:100,bottom:100,left:120,right:120}, children:[ new Paragraph({ alignment: AlignmentType.CENTER, children:[ new TextRun({text:'TARJETA INFORMATIVA', bold:true, size:21}) ] }) ] }),
            labelCell('FECHA'),
          ]}),
          new TableRow({ children: [
            valueCell([ new Paragraph({ children:[ new TextRun({ text: $('ubicacion').value.trim() + (' — ' + $('lugarEspecifico').value.trim()), bold:true, size:19 }) ] }) ]),
            new TableCell({ width:{size:48,type:WidthType.PERCENTAGE}, verticalAlign:VerticalAlign.CENTER, margins:{top:100,bottom:100,left:120,right:120}, children:[ new Paragraph({ alignment: AlignmentType.CENTER, children:[ new TextRun({ text: $('tituloIncidente').value.trim(), bold:true, size:19 }) ] }) ] }),
            valueCell([ new Paragraph({ children:[ new TextRun({ text: formatFechaLarga($('fecha').value), size:19 }) ] }) ]),
          ]})
        ]
      });

      // ---- Body data ----
      const fechaHoraTxt = formatFechaLarga($('fecha').value) + ', a las ' + $('hora').value + ' hrs. (' + $('turno').value + ')';
      const tiposTxt = tipoIncidente.get().join(', ') || '—';
      const respTxt = hayResponsable.get()==='Sí'
        ? [$('respNombre').value.trim(), $('respIdent').value.trim(), $('respPlacas').value.trim() ? ('Placas: ' + $('respPlacas').value.trim()) : ''].filter(Boolean).join('\n')
        : 'No identificado al momento del reporte';
      const autoridadTxt = hayAutoridad.get()==='Sí' ? 'Sí' : 'No';

      const bodyRows = [
        labelRow('Fecha y hora', fechaHoraTxt),
        labelRow('Lugar del incidente', $('lugarEspecifico').value.trim()),
        labelRow('Persona(s) afectada(s)', $('personasAfectadas').value.trim()),
        peopleRow('Personas que tuvieron conocimiento y/o estuvieron involucradas', personasList.getAll()),
        labelRow('Responsable del incidente', respTxt),
        labelRow('Intervención policial o ambulancia', autoridadTxt + (hayAutoridad.get()==='Sí'
          ? '\nCorporación: ' + $('corporacion').value + '\nUnidad/Patrulla: ' + ($('numUnidad').value.trim() || '—')
          : '')),
      ];
      if(hayAutoridad.get()==='Sí'){
        bodyRows.push(peopleRow('Oficiales que atendieron', oficialesList.getAll()));
      }
      bodyRows.push(
        labelRow('Tipo de incidente', tiposTxt),
        labelRow('Antecedentes', $('antecedentes').value.trim() || 'Sin antecedentes reportados'),
        labelRow('Descripción del incidente', $('hechos').value.trim()),
        labelRow('Evidencias', 'Videos: ' + evVideos.get() + '\nFotografías: ' + evFotos.get() + '\nSe informó a Administración/Cliente: ' + evInformo.get()),
        labelRow('Acciones tomadas', $('acciones').value.trim() || '—', {bullet:true}),
        labelRow('Valor aproximado de lo afectado', $('valorAfectado').value.trim() || 'No cuantificado'),
        labelRow('Medidas a tomar / seguimiento', $('medidas').value.trim() || '—', {bullet:true}),
      );

      const bodyTable = new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: bodyRows });

      // ---- Photos section ----
      const photoChildren = [];
      if(photos.length){
        photoChildren.push(new Paragraph({ spacing:{before:200,after:100}, children:[ new TextRun({ text:'EVIDENCIA FOTOGRÁFICA', bold:true, size:20 }) ] }));
        for(let i=0;i<photos.length;i+=2){
          const rowImgs = [photos[i], photos[i+1]].filter(Boolean);
          const runs = rowImgs.map(p => {
            const targetW = 260;
            const targetH = Math.round(p.h * (targetW / p.w));
            return new ImageRun({ data: p.bytes, type: 'jpg', transformation: { width: targetW, height: targetH } });
          });
          photoChildren.push(new Paragraph({ children: runs.flatMap((r,idx)=> idx>0 ? [new TextRun({text:'   '}), r] : [r]) }));
        }
      }

      // ---- Footer meta ----
      const closing = [
        new Paragraph({ spacing:{before:300}, children:[ new TextRun({ text: 'Folio: ' + folio + '   ·   Generado: ' + now.toLocaleString('es-MX'), size:16, color:'666666' }) ] }),
        new Paragraph({ spacing:{before:200}, children:[ new TextRun({ text: 'Firma del supervisor: ' + ($('supervisor').value.trim() || '—'), size:19 }) ] }),
        new Paragraph({ spacing:{before:400}, children:[ new TextRun({ text: '_______________________________________', size:19 }) ] }),
      ];

      const doc = new Document({
        sections: [{
          properties: { page: { margin: { top: 900, bottom: 900, left: 900, right: 900 } } },
          headers: { default: new Header({ children: headerChildren }) },
          footers: { default: new Footer({ children: footerChildren }) },
          children: [ titleTable, new Paragraph({text:'', spacing:{after:120}}), bodyTable, ...photoChildren, ...closing ]
        }]
      });

      return await Packer.toBlob(doc);
    }

    function base64ToBytes(b64){
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for(let i=0;i<bin.length;i++) bytes[i] = bin.charCodeAt(i);
      return bytes;
    }
    function formatFechaLarga(isoDate){
      if(!isoDate) return '—';
      const d = new Date(isoDate + 'T00:00:00');
      return d.toLocaleDateString('es-MX', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
    }
  }
})();

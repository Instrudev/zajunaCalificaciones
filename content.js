(() => {
  const TARGET_URL_PATTERN = /https:\/\/zajuna\.sena\.edu\.co\/zajuna\/grade\/report\/user\/index\.php\?id=/;
  if (!TARGET_URL_PATTERN.test(window.location.href)) {
    return;
  }

  const existingButton = document.getElementById('zajuna-exportar-pendientes-btn');
  if (existingButton) return;

  const state = {
    phases: [],
    rows: [],
    modal: null,
    phaseListContainer: null,
    progressArea: null,
    exportButton: null,
    refreshButton: null,
  };

  const styles = `
    #zajuna-exportar-pendientes-btn {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 2147483647;
      padding: 10px 16px;
      background: #0d6efd;
      color: #fff;
      border: none;
      border-radius: 6px;
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
      cursor: pointer;
    }
    #zajuna-exportar-pendientes-btn:hover { background: #0b5ed7; }
    #zajuna-export-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.45);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 2147483646;
      font-family: Arial, sans-serif;
    }
    #zajuna-export-modal {
      background: #fff;
      width: 480px;
      max-width: 95vw;
      border-radius: 10px;
      box-shadow: 0 8px 28px rgba(0,0,0,0.25);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      max-height: 80vh;
    }
    #zajuna-export-modal header {
      padding: 14px 18px;
      background: #0d6efd;
      color: #fff;
      font-size: 16px;
      font-weight: 700;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    #zajuna-export-modal header button {
      background: transparent;
      border: none;
      color: #fff;
      font-size: 18px;
      cursor: pointer;
    }
    #zajuna-export-modal main {
      padding: 16px 18px 8px 18px;
      overflow: auto;
      flex: 1;
    }
    #zajuna-export-modal footer {
      padding: 12px 18px 16px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }
    #zajuna-phase-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 10px;
    }
    .zajuna-phase-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .zajuna-phase-item label {
      font-weight: 600;
    }
    #zajuna-progress-area {
      margin-top: 8px;
      padding: 10px;
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 6px;
      min-height: 60px;
      font-size: 13px;
      line-height: 1.4;
      white-space: pre-line;
    }
    .zajuna-small-button {
      padding: 10px 12px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
      font-weight: 700;
      color: #fff;
      background: #0d6efd;
    }
    .zajuna-secondary-button {
      background: #6c757d;
    }
    .zajuna-secondary-button:hover { background: #5c636a; }
    .zajuna-small-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `;

  function injectStyles() {
    const styleTag = document.createElement('style');
    styleTag.id = 'zajuna-export-styles';
    styleTag.textContent = styles;
    document.head.appendChild(styleTag);
  }

  function createButton() {
    const btn = document.createElement('button');
    btn.id = 'zajuna-exportar-pendientes-btn';
    btn.textContent = 'Exportar pendientes por fase';
    btn.addEventListener('click', openModal);
    document.body.appendChild(btn);
  }

  function openModal() {
    if (!state.modal) {
      buildModal();
    }
    refreshPhases();
    state.modal.style.display = 'flex';
  }

  function closeModal() {
    if (state.modal) {
      state.modal.style.display = 'none';
    }
  }

  function buildModal() {
    const backdrop = document.createElement('div');
    backdrop.id = 'zajuna-export-modal-backdrop';

    const modal = document.createElement('div');
    modal.id = 'zajuna-export-modal';

    const header = document.createElement('header');
    header.innerHTML = '<span>Exportar pendientes por fase</span>';
    const closeBtn = document.createElement('button');
    closeBtn.setAttribute('aria-label', 'Cerrar');
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', closeModal);
    header.appendChild(closeBtn);

    const main = document.createElement('main');
    const description = document.createElement('p');
    description.textContent = 'Seleccione una fase detectada y presione "Iniciar exportación".';
    main.appendChild(description);

    state.phaseListContainer = document.createElement('div');
    state.phaseListContainer.id = 'zajuna-phase-list';
    main.appendChild(state.phaseListContainer);

    state.progressArea = document.createElement('div');
    state.progressArea.id = 'zajuna-progress-area';
    state.progressArea.textContent = 'Esperando para iniciar.';
    main.appendChild(state.progressArea);

    const footer = document.createElement('footer');

    state.refreshButton = document.createElement('button');
    state.refreshButton.className = 'zajuna-small-button zajuna-secondary-button';
    state.refreshButton.textContent = 'Actualizar fases';
    state.refreshButton.addEventListener('click', refreshPhases);

    state.exportButton = document.createElement('button');
    state.exportButton.className = 'zajuna-small-button';
    state.exportButton.textContent = 'Iniciar exportación';
    state.exportButton.addEventListener('click', onStartExport);

    footer.appendChild(state.refreshButton);
    footer.appendChild(state.exportButton);

    modal.appendChild(header);
    modal.appendChild(main);
    modal.appendChild(footer);

    backdrop.appendChild(modal);
    state.modal = backdrop;
    document.body.appendChild(backdrop);
  }

  function refreshPhases() {
    state.phases = detectPhases();
    renderPhases();
  }

  function detectPhases() {
    const rows = Array.from(document.querySelectorAll('tr'));
    state.rows = rows;
    const phases = [];
    const regex = /^Fase\s+[1-4]/i;

    rows.forEach((row, index) => {
      const span = row.querySelector('span');
      if (!span) return;
      const text = (span.innerText || '').trim();
      if (!regex.test(text)) return;

      phases.push({
        title: text,
        startIndex: index,
        rowElement: row,
      });
    });

    phases.forEach((phase, i) => {
      phase.endIndex = i < phases.length - 1 ? phases[i + 1].startIndex : rows.length;
    });

    return phases;
  }

  function renderPhases() {
    if (!state.phaseListContainer) return;
    state.phaseListContainer.innerHTML = '';
    if (!state.phases.length) {
      const empty = document.createElement('p');
      empty.textContent = 'No se encontraron fases con el formato "Fase X" en la página.';
      state.phaseListContainer.appendChild(empty);
      return;
    }

    state.phases.forEach((phase, index) => {
      const item = document.createElement('div');
      item.className = 'zajuna-phase-item';
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = 'zajuna-phase-selection';
      input.id = `zajuna-phase-${index}`;
      input.value = index;
      if (index === 0) input.checked = true;
      const label = document.createElement('label');
      label.setAttribute('for', input.id);
      label.textContent = phase.title;
      item.appendChild(input);
      item.appendChild(label);
      state.phaseListContainer.appendChild(item);
    });
  }

  function getSelectedPhase() {
    const checked = state.phaseListContainer?.querySelector('input[name="zajuna-phase-selection"]:checked');
    if (!checked) return null;
    const idx = Number(checked.value);
    return state.phases[idx];
  }

  function logProgress(message) {
    if (!state.progressArea) return;
    const timestamp = new Date().toLocaleTimeString();
    state.progressArea.textContent = `[${timestamp}] ${message}\n${state.progressArea.textContent || ''}`;
  }

  async function onStartExport() {
    const selected = getSelectedPhase();
    if (!selected) {
      logProgress('Seleccione una fase antes de iniciar.');
      return;
    }

    toggleButtons(true);
    logProgress(`Iniciando exportación para ${selected.title}...`);
    try {
      const activities = collectActivities(selected);
      if (!activities.length) {
        logProgress('No se encontraron actividades tipo Evidencia en la fase seleccionada.');
        toggleButtons(false);
        return;
      }

      logProgress(`Se detectaron ${activities.length} actividades. Iniciando lectura...`);
      const results = [];
      for (let i = 0; i < activities.length; i++) {
        const activity = activities[i];
        logProgress(`Procesando actividad ${i + 1} de ${activities.length}: ${activity.name}`);
        try {
          const pending = await fetchPendingCount(activity.url);
          if (typeof pending === 'number') {
            if (pending > 0) {
              results.push({ ...activity, pending });
              logProgress(`Pendientes: ${pending}. Se agregará al Excel.`);
            } else {
              logProgress('Sin pendientes. Se omitirá.');
            }
          } else {
            logProgress('No se encontró la sección de "Pendientes por calificar". Se omitirá.');
          }
        } catch (error) {
          console.error(error);
          logProgress(`No se pudo leer la actividad ${activity.name}. Continuando...`);
        }
      }

      if (!results.length) {
        logProgress('No hay actividades con pendientes mayores a 0. No se generó archivo.');
      } else {
        generateExcel(results);
        logProgress('Exportación completada. Archivo generado: zajuna_pendientres_calificar.xlsx');
      }
    } finally {
      toggleButtons(false);
    }
  }

  function toggleButtons(disabled) {
    if (state.exportButton) state.exportButton.disabled = disabled;
    if (state.refreshButton) state.refreshButton.disabled = disabled;
  }

  function collectActivities(selectedPhase) {
    if (!selectedPhase || !state.rows.length) return [];
    return getEvidenceActivities(selectedPhase, state.rows);
  }

  function getEvidenceActivities(phase, rows) {
    const activities = [];

    for (let i = phase.startIndex + 1; i < phase.endIndex; i++) {
      const row = rows[i];

      const span = row.querySelector('span.d-block.text-uppercase.small.dimmed_text');

      if (span && span.innerText.trim() === 'Evidencia') {
        const link = row.querySelector('a.gradeitemheader');
        if (link) {
          activities.push({
            name: link.innerText.trim(),
            url: link.href,
          });
        }
      }
    }

    return activities;
  }

  function fetchPendingCount(url) {
    return new Promise((resolve) => {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';
      document.body.appendChild(iframe);

      const cleanup = () => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      };

      const timeout = setTimeout(() => {
        cleanup();
        resolve(null);
      }, 20000);

      iframe.onload = () => {
        try {
          const doc = iframe.contentDocument || iframe.contentWindow?.document;
          if (!doc) {
            clearTimeout(timeout);
            cleanup();
            resolve(null);
            return;
          }
          const pending = extractPending(doc);
          clearTimeout(timeout);
          cleanup();
          resolve(pending);
        } catch (error) {
          console.error(error);
          clearTimeout(timeout);
          cleanup();
          resolve(null);
        }
      };

      iframe.src = url;
    });
  }

  function extractPending(doc) {
    const target = 'Pendientes por calificar';
    const elements = Array.from(doc.querySelectorAll('body *'));
    for (const el of elements) {
      const text = (el.textContent || '').trim();
      if (!text.includes(target)) continue;
      const inlineMatch = text.match(/Pendientes por calificar[^0-9]*([0-9]+)/i);
      if (inlineMatch) {
        return Number(inlineMatch[1]);
      }
      const next = el.nextElementSibling;
      if (next) {
        const nextMatch = (next.textContent || '').match(/([0-9]+)/);
        if (nextMatch) return Number(nextMatch[1]);
      }
    }
    return null;
  }

  function generateExcel(rows) {
    const data = [['Actividad', 'URL', 'Pendientes por calificar']];
    rows.forEach((row) => {
      data.push([row.name, row.url, row.pending]);
    });
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pendientes');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'zajuna_pendientres_calificar.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  injectStyles();
  createButton();
})();

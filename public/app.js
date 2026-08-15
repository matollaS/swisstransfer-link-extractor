document.addEventListener('DOMContentLoaded', () => {
  const extractForm = document.getElementById('extractForm');
  const shareUrlInput = document.getElementById('shareUrl');
  const passwordInput = document.getElementById('password');
  const submitBtn = document.getElementById('submitBtn');
  const spinner = submitBtn.querySelector('.spinner');
  const btnText = submitBtn.querySelector('.btn-text');

  const errorAlert = document.getElementById('errorAlert');
  const errorMessage = document.getElementById('errorMessage');

  const resultsSection = document.getElementById('resultsSection');
  const transferIdBadge = document.getElementById('transferIdBadge');
  const metaTotalSize = document.getElementById('metaTotalSize');
  const metaFileCount = document.getElementById('metaFileCount');
  const metaSender = document.getElementById('metaSender');

  const filesList = document.getElementById('filesList');
  const copyAllBtn = document.getElementById('copyAllBtn');
  const downloadZipBtn = document.getElementById('downloadZipBtn');

  const toggleJsonBtn = document.getElementById('toggleJsonBtn');
  const jsonContainer = document.getElementById('jsonContainer');
  const jsonOutput = document.getElementById('jsonOutput');

  let currentResultData = null;

  extractForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    setLoading(true);

    const shareUrl = shareUrlInput.value.trim();
    const password = passwordInput.value.trim() || null;

    try {
      const res = await fetch('/api/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: shareUrl, password }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to extract direct links.');
      }

      currentResultData = json.data;
      renderResults(json.data, shareUrl, password);
    } catch (err) {
      showError(err.message);
      resultsSection.classList.add('hidden');
    } finally {
      setLoading(false);
    }
  });

  function renderResults(data, shareUrl, password) {
    transferIdBadge.textContent = `ID: ${data.transferId}`;
    metaTotalSize.textContent = formatBytes(data.totalSize);
    metaFileCount.textContent = `${data.files.length} file${data.files.length > 1 ? 's' : ''}`;
    metaSender.textContent = data.sender || 'Anonymous';

    // Set single ZIP download link
    const zipUrl = `/api/download-zip?url=${encodeURIComponent(shareUrl)}${password ? '&password=' + encodeURIComponent(password) : ''}`;
    downloadZipBtn.href = zipUrl;

    filesList.innerHTML = '';

    data.files.forEach((file, index) => {
      const card = document.createElement('div');
      card.className = 'file-card';
      card.innerHTML = `
        <div class="file-top">
          <div class="file-info">
            <span class="file-name">${escapeHtml(file.fileName)}</span>
            <span class="file-size">${formatBytes(file.size)} • ${escapeHtml(file.mimeType)}</span>
          </div>
          <div class="file-actions">
            <button class="btn btn-secondary btn-sm copy-btn" data-url="${escapeHtml(file.url)}">
              Copy Direct Link
            </button>
            <a href="${escapeHtml(file.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
              Download
            </a>
          </div>
        </div>
        <input type="text" class="file-url-input" value="${escapeHtml(file.url)}" readonly onclick="this.select()">
      `;

      const copyBtn = card.querySelector('.copy-btn');
      copyBtn.addEventListener('click', () => copyToClipboard(file.url, copyBtn));

      filesList.appendChild(card);
    });

    jsonOutput.textContent = JSON.stringify(data, null, 2);
    resultsSection.classList.remove('hidden');
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  copyAllBtn.addEventListener('click', () => {
    if (!currentResultData || !currentResultData.files.length) return;
    const allUrls = currentResultData.files.map((f) => f.url).join('\n');
    copyToClipboard(allUrls, copyAllBtn, 'All Direct Links Copied!');
  });

  toggleJsonBtn.addEventListener('click', () => {
    const isHidden = jsonContainer.classList.contains('hidden');
    if (isHidden) {
      jsonContainer.classList.remove('hidden');
      toggleJsonBtn.textContent = 'Hide Raw JSON';
    } else {
      jsonContainer.classList.add('hidden');
      toggleJsonBtn.textContent = 'View Raw JSON';
    }
  });

  function setLoading(isLoading) {
    if (isLoading) {
      spinner.classList.remove('hidden');
      btnText.textContent = 'Extracting...';
      submitBtn.disabled = true;
    } else {
      spinner.classList.add('hidden');
      btnText.textContent = 'Extract Direct Links';
      submitBtn.disabled = false;
    }
  }

  function showError(msg) {
    errorMessage.textContent = msg;
    errorAlert.classList.remove('hidden');
  }

  function hideError() {
    errorAlert.classList.add('hidden');
  }

  function copyToClipboard(text, btnElement, successMsg = 'Copied!') {
    navigator.clipboard.writeText(text).then(() => {
      const originalText = btnElement.textContent;
      btnElement.textContent = successMsg;
      btnElement.style.borderColor = 'var(--accent)';
      setTimeout(() => {
        btnElement.textContent = originalText;
        btnElement.style.borderColor = '';
      }, 2000);
    });
  }

  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
